import { IonChip, IonInput, IonItem, IonLabel, IonList, IonNote, IonPopover, IonText, IonToggle } from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles/index.module.scss";
import { useDrag, useDrop } from "react-dnd";
import { charIndexAtX, componentAt, parseUrlComponents, prefixWidthPx } from "./utils";
import { throttle } from "@/lib/throttle";
import { BUILT_INS, TOKEN_RX, validateUrl } from "./utils";
import { highlightUrl } from "./helpers";
import { parse } from "uri-template";
import useDebounce from "@/Hooks/useDebounce";
import { Expression, Literal, Template, Variable } from "uri-template/dist/ast";





interface WebhookUrlBuilderProps {
	rows: string[];
	setUrl: (url: string) => void;
	url: string;
	onValidityChange?: (valid: boolean) => void;
}

interface ExprPos {
	node: Expression;
	start: number;
	end: number;
}
function parseWithPos(str: string): { ast: Template; exprs: ExprPos[] } {
	const { ast } = parse(str);
	let offset = 0;
	const exprs: ExprPos[] = [];

	(ast as Template).parts.forEach(p => {
		if (p.type === "literal") {
			offset += (p as Literal).value.length;
		} else {
			const ex = p as Expression;
			const raw = `{${ex.operator}${ex.variables.map(v => v.name).join(",")}}`;
			exprs.push({ node: ex, start: offset, end: offset + raw.length });
			offset += raw.length;
		}
	});
	return { ast: ast as Template, exprs };
}

function stringify(ast: Template): string {
	return ast.parts
		.map(p =>
			p.type === "literal"
				? (p as Literal).value
				: `{${(p as Expression).operator}${(p as Expression).variables
					.map(v => v.name)
					.join(",")}}`,
		)
		.join("");
}

type Zone = "scheme" | "host" | "path" | "query" | "fragment";


function decideInsertModes(
	zone: Zone,
	queryExists: boolean
): ("path" | "query")[] {
	if (zone === "query") return ["query"];
	if (zone === "path") return queryExists ? ["query"] : ["path", "query"];
	if (zone === "host" || zone === "scheme")
		return queryExists ? ["query"] : ["path", "query"];
	if (zone === "fragment") return ["path"];
	return ["path", "query"];     // fallback
}


const WebhookUrlBuilder = ({ rows, setUrl, url, onValidityChange }: WebhookUrlBuilderProps) => {
	const urlInputRef = useRef<HTMLIonInputElement | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const [caret, setCaret] = useState<{ left: number; top: number; height: number } | null>(null);
	const [isDraggingToken, setIsDraggingToken] = useState<string | null>(null);
	const [insertType, setInsertType] = useState<"path" | "query" | null>(null);
	const [showInsertMenu, setShowInsertMenu] = useState(false);
	const [dropPosition, setDropPosition] = useState({ index: 0, context: "" });
	const [expandedUrl, setExpandedUrl] = useState("");
	const [forceSSL, setForceSSL] = useState(true);
	const menuTriggerRef = useRef<HTMLDivElement>(null);
	const [showMenu, setShowMenu] = useState(false);
	const [pendingToken, setPendingToken] = useState<string | null>(null);
	const [pendingIdx, setPendingIdx] = useState<number>(0);




	const debouncedUrl = useDebounce(url, 200);
	const urlContext = useMemo(() => {
		parseWithPos(debouncedUrl);
		const components = parseUrlComponents(debouncedUrl);
		return components;
	}, [debouncedUrl]);






	const expandUrl = useCallback(() => {
		try {
			const template = URITemplate.parse(url);
			const sampleData: Record<string, string> = {};

			// Collect all tokens
			const tokens = new Set<string>();
			const templateRegex = /\{([^{}]+?)\}/g;
			let match;
			while ((match = templateRegex.exec(url)) !== null) {
				const content = match[1];
				content.split(",").forEach(token => {
					const cleanToken = token.replace(/^[?&#/;]/, "");
					tokens.add(cleanToken);
				});
			}

			// Create sample values
			Array.from(tokens).forEach(token => {
				sampleData[token] = token === "invoice" ? "inv123" : "value";
			});

			return template.expand(sampleData);
		} catch (e: any) {
			return e?.message || "Invalid URL template";
		}
	}, [url]);


	useEffect(() => {
		setExpandedUrl(expandUrl());
	}, [url, expandUrl]);



	const compute = async (clientX: number) => {
		if (!urlInputRef.current) return null;
		const native = await urlInputRef.current.getInputElement();
		const rect = native.getBoundingClientRect();
		const relX = clientX - rect.left;
		const index = charIndexAtX(native, relX, url);
		const width = prefixWidthPx(native, index, url);
		return {
			index,
			width,
			rect,
		};
	};

	const allowedTokens = useMemo(
		() => [...new Set([...rows.map(r => r.trim()).filter(Boolean), ...BUILT_INS])],
		[rows]
	);

	const tokensInUrl = useMemo(() => {
		const { exprs } = parseWithPos(url);
		return exprs.flatMap(e => e.node.variables.map(v => v.name));
	}, [url]);
	const unknownTokens = useMemo(
		() => new Set(tokensInUrl.filter(t => !allowedTokens.includes(t))),
		[tokensInUrl, allowedTokens]
	);

	const { ok: urlOk } = validateUrl(url, forceSSL);
	const isValid = urlOk && unknownTokens.size === 0;
	useEffect(() => {
		onValidityChange?.(isValid);
	}, [isValid, onValidityChange]);




	const insertToken = (token: string, mode: "path" | "query", idx: number) => {
		const { ast, exprs } = parseWithPos(url);
		const hit = exprs.find(e => idx >= e.start && idx <= e.end);
		const opGoal = mode === "path" ? "/" : url.includes("?") ? "&" : "?";

		if (
			hit &&
			((mode === "path" && hit.node.operator === "/") ||
				(mode === "query" && (hit.node.operator === "?" || hit.node.operator === "&")))
		) {
			if (!hit.node.variables.some(v => v.name === token))
				hit.node.variables.push({ type: "variable", name: token } as Variable);
			setUrl(stringify(ast));
			return;
		}

		/* splice literal + new expression */
		const exprStr = `{${opGoal}${token}}`;
		setUrl(url.slice(0, idx) + exprStr + url.slice(idx));
	};





	const [{ isOver, canDrop }, dropRef] = useDrop({
		accept: "TOKEN",
		drop: async ({ token }: { token: string }, monitor) => {
			const client = monitor.getClientOffset();
			if (!client) return;
			const index = (await compute(client.x))?.index ?? url.length;
			const comp = componentAt(index, urlContext) ?? {
				type: "path", start: index, end: index, value: "",
			};
			const modes = decideInsertModes(comp.type as Zone, url.includes("?"));
			console.log({ modes })

			const snapIdx =
				comp.type === "host" || comp.type === "scheme"
					? comp.end
					: comp.type === "path"
						? comp.end
						: comp.type === "query"
							? comp.end
							: index;

			if (modes.length === 1) {
				insertToken(token, modes[0], snapIdx);
			} else {
				/* ambiguous: ask user */
				setPendingToken(token);
				setPendingIdx(snapIdx);
				setShowMenu(true);
			}
			setCaret(null);

		},
		hover: throttle(async (item: { token: string }, monitor) => {
			const client = monitor.getClientOffset();
			if (!client || !wrapperRef.current) return;

			setIsDraggingToken(item.token);

			const info = await compute(client.x);
			if (!info) return;
			const { width, rect } = info;

			const wrapperRect = wrapperRef.current.getBoundingClientRect();
			setCaret({
				left: rect.left - wrapperRect.left + width,
				top: rect.top - wrapperRect.top,
				height: rect.height,
			});
		}),
		collect: (monitor) => ({
			isOver: monitor.isOver({ shallow: true }),
			canDrop: monitor.canDrop()
		}),

	});


	const insertByCaret = useCallback(async (token: string) => {
		/* 		if (!urlInputRef.current) return;
				const el = await urlInputRef.current.getInputElement();
				const start = el.selectionStart ?? url.length;
				const context = getContextAtPosition(start, urlContext);

				if (context === "path" || context === "query") {
					const paramType = context === "query" ? "query" : "path";
					insertToken(token, paramType, start);
				} else {
					// Show menu for ambiguous contexts
					const rect = el.getBoundingClientRect();
					setDropPosition({
						index: start,
						context: "unknown"
					});
					setShowInsertMenu(true);
				} */
	}, [url, insertToken]);

	useEffect(() => {
		if (!isOver) {
			setIsDraggingToken(null);
			setCaret(null);
		}
	}, [isOver]);


	return (


		<IonList className={styles["edit-list"]} lines="none">
			<IonPopover
				isOpen={showMenu}
				onDidDismiss={() => setShowMenu(false)}
				trigger="none"
				showBackdrop
			>
				<IonList lines="none">
					<IonItem
						button
						onClick={() => {
							insertToken(pendingToken!, "path", pendingIdx);
							setShowMenu(false);
						}}
					>
						<IonLabel>Insert as path segment</IonLabel>
					</IonItem>
					<IonItem
						button
						onClick={() => {
							insertToken(pendingToken!, "query", pendingIdx);
							setShowMenu(false);
						}}
					>
						<IonLabel>Insert as query param</IonLabel>
					</IonItem>
				</IonList>
			</IonPopover>
			<IonItem lines="full" className="ion-margin-bottom">
				<IonToggle
					checked={forceSSL}
					justify="space-between"
					onIonChange={e => setForceSSL(e.detail.checked)}
					className="text-medium"
					style={{ fontWeight: "600" }}
				>
					Force SSL (https)
				</IonToggle>
			</IonItem>
			<IonItem className={styles["edit-item-input"]}>
				<div
					ref={el => {
						wrapperRef.current = el;
						dropRef(el);
					}}
					style={{ position: 'relative', width: '100%' }}
				>

					<IonInput
						ref={urlInputRef}
						label="Callback URL"
						value={url}
						inputmode="url"
						autocapitalize="off"
						placeholder="https://example.com?i=%[invoice]&a=%[amount]"
						onIonInput={e => setUrl(e.detail.value ?? "")}
						mode="md"
						fill="outline"
						labelPlacement="stacked"
						className="ion-margin-top"
						style={{
							backgroundColor: isOver ? 'rgba(56, 128, 255, 0.05)' : undefined,
							border: canDrop ? '2px dashed var(--ion-color-primary)' : undefined,
							transition: 'all 0.2s ease'
						}}
					>
					</IonInput>

					{isOver && caret && (
						<div
							role="presentation"
							style={{
								position: 'absolute',
								left: caret.left,
								top: caret.top,
								height: caret.height,
								width: '2px',
								backgroundColor: 'var(--ion-color-primary)',
								zIndex: 10,
								pointerEvents: 'none',
								animation: 'caretBlink 1s step-end infinite'
							}}
						/>
					)}

					{/* Token preview */}
					{isOver && isDraggingToken && caret && (
						<div
							style={{
								position: 'absolute',
								left: caret.left,
								top: caret.top + 4,
								padding: '2px 6px',
								background: 'var(--ion-color-primary)',
								color: 'white',
								borderRadius: '4px',
								fontSize: '0.8rem',
								zIndex: 11,
								pointerEvents: 'none',
								transform: 'translateY(-100%)',
								boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
							}}
						>
							{isDraggingToken}
						</div>
					)}
				</div>




			</IonItem>
			<IonItem lines="none">
				<IonLabel>
					<span className="text-quiet ion-margin-bottom">Expanded Preview:</span>
					<IonText style={{ display: "block", fontStyle: "italic" }} className="ion-text-wrap text-low">
						{expandedUrl}
					</IonText>
				</IonLabel>
			</IonItem>
			{url && (
				<IonItem lines="none">
					<IonLabel>
						<span className="text-quiet ion-margin-bottom">Template Preview:</span>
						<IonText style={{ display: "block", fontStyle: "italic" }} className="ion-text-wrap text-low">
							{highlightUrl(url, unknownTokens)}
						</IonText>
					</IonLabel>
				</IonItem>
			)}

			{!isValid && (
				<IonItem lines="none">
					<IonNote color="danger">
						{!urlOk ? "Invalid or non-HTTPS URL" : "Unknown attribute(s) detected"}
					</IonNote>
				</IonItem>
			)}
			<IonItem>
				<span style={{ fontSize: "0.75rem" }} className="text-low">Drag and drop your payer data keys into the url input</span>
			</IonItem>
			<div className="ion-padding-horizontal ion-padding-bottom" style={{
				minHeight: '60px',
				border: isOver ? '2px dashed var(--ion-color-primary-tint)' : 'none',
				borderRadius: '8px',
				transition: 'all 0.2s ease',
				backgroundColor: isOver ? 'rgba(56, 128, 255, 0.03)' : 'transparent'
			}}>
				<div style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: '8px',
					opacity: isOver ? 0.7 : 1,
					transition: 'opacity 0.2s ease'
				}}>
					{allowedTokens.map(t => (
						<DraggableChip key={t} token={t} handleClick={insertByCaret} />
					))}
				</div>
			</div>

		</IonList>

	)

}


const DraggableChip = ({ token, handleClick }: { token: string, handleClick: (token: string) => void }) => {
	const [{ isDragging }, dragRef] = useDrag({
		type: "TOKEN",
		item: { token },
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),

	});

	return (
		<IonChip
			ref={dragRef}
			color="primary"
			style={{
				opacity: isDragging ? 0.7 : 1,
				cursor: 'grab',
				transform: isDragging ? 'scale(1.1)' : 'scale(1)',
				transition: 'transform 0.2s ease'
			}}
			onClick={() => handleClick(token)}
		>
			{token}
		</IonChip>
	);
};

export default WebhookUrlBuilder;





