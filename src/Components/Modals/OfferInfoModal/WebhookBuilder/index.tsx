import { IonChip, IonInput, IonItem, IonLabel, IonList, IonNote, IonPopover, IonText, IonToggle } from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/index.module.scss";
import { useDrag, useDrop } from "react-dnd";
import { charIndexAtX, insertionHeuristics, prefixWidthPx, BUILT_INS, stringify } from "./utils/utils";
import { throttle } from "@/lib/throttle";
import useDebounce from "@/Hooks/useDebounce";
import { Variable } from "uri-template/dist/ast";
import { useTemplateValidation } from "./hooks/useTemplateValidation";
import { useToast } from "@/lib/contexts/useToast";
import { InsertionMode } from "./types";

interface WebhookUrlBuilderProps {
	rows: string[];
	setUrl: (url: string) => void;
	url: string;
	onValidityChange?: (valid: boolean) => void;
}




const WebhookUrlBuilder = ({ rows, setUrl, url, onValidityChange }: WebhookUrlBuilderProps) => {
	const { showToast } = useToast();
	const urlInputRef = useRef<HTMLIonInputElement | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const [caret, setCaret] = useState<{ left: number; top: number; height: number } | null>(null);
	const [isDraggingToken, setIsDraggingToken] = useState<string | null>(null);
	const [forceSSL, setForceSSL] = useState(true);

	const [pendingInsertion, setPendingInsertion] = useState<(InsertionMode & { token: string })[] | null>(null);

	const debouncedUrl = useDebounce(url, 200);


	const allowedTokens = useMemo(
		() => [...new Set([...rows.map(r => r.trim()).filter(Boolean), ...BUILT_INS])],
		[rows]
	);

	const {
		ok: isValid,
		syntaxOK,
		httpsOK,
		unknown,
		expanded,
		ast,
		components
	} = useTemplateValidation(debouncedUrl, forceSSL, allowedTokens);




	const compute = useCallback(async (clientX: number) => {
		if (!urlInputRef.current) return null;
		const native = await urlInputRef.current.getInputElement();
		const rect = native.getBoundingClientRect();
		const relX = clientX - rect.left;
		const index = charIndexAtX(native, relX, debouncedUrl);
		const width = prefixWidthPx(native, index, debouncedUrl);
		return {
			index,
			width,
			rect,
		};
	}, [debouncedUrl]);




	useEffect(() => {
		onValidityChange?.(isValid);
	}, [isValid, onValidityChange]);




	const insertToken = useCallback((token: string, mode: InsertionMode) => {
		const opGoal = mode.type === "path" ? "/" : debouncedUrl.includes("?") ? "&" : "?";
		let newUrl = "";
		switch (mode.kind) {
			case "merge": {
				mode.node.variables.push({ type: "variable", name: token } as Variable);
				if (!ast) return;
				newUrl = stringify(ast);
				break;
			}
			case "insert": {
				const exprStr = `{${opGoal}${token}}`;
				newUrl = debouncedUrl.slice(0, mode.position) + exprStr + debouncedUrl.slice(mode.position);
				break;
			}
		}
		setUrl(newUrl)
	}, [debouncedUrl, ast, setUrl]);





	const [{ isOver, canDrop }, dropRef] = useDrop({
		accept: "TOKEN",
		drop: async ({ token }: { token: string }, monitor) => {
			if (!ast) {
				showToast({
					message: "Template is invalid. Please fix the syntax first.",
					color: "danger",
				});
				return;
			}
			const client = monitor.getClientOffset();
			if (!client) return;
			const index = (await compute(client.x))?.index ?? url.length;
			const options = insertionHeuristics(index, token, components)
			if (options === null) {
				return;
			}

			if (options.length === 1) {
				insertToken(token, options[0]);
			} else {
				// ambiguous; ask user
				setPendingInsertion(
					options.map(o => ({
						...o,
						token,
					}))
				);
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
		if (!urlInputRef.current) return;
		if (!ast) {
			showToast({
				message: "Template is invalid. Please fix the syntax first.",
				color: "danger",
			});
			return;
		}
		const index = debouncedUrl.length;
		const options = insertionHeuristics(index, token, components);
		if (options === null) {
			return;
		}

		if (options.length === 1) {
			insertToken(token, options[0]);
		} else {
			// ambiguous; ask user
			setPendingInsertion(
				options.map(o => ({
					...o,
					token,
				}))
			);
		}


	}, [insertToken, components, debouncedUrl, ast, showToast]);

	useEffect(() => {
		if (!isOver) {
			setIsDraggingToken(null);
			setCaret(null);
		}
	}, [isOver]);


	const closePopover = () => {
		setPendingInsertion(null);
	}


	return (


		<IonList className={styles["edit-list"]} lines="none">
			<IonPopover
				isOpen={!!pendingInsertion}
				onDidDismiss={closePopover}
				trigger="none"
				showBackdrop
			>
				<IonList lines="none">
					{
						pendingInsertion?.map((mode) => (
							<IonItem
								key={mode.type}
								button
								onClick={() => {
									insertToken(mode.token, mode);
									closePopover();
								}}
							>
								<IonLabel>
									Insert as {mode.type === "path" ? "path segment" : "query param"}
								</IonLabel>
							</IonItem>
						))
					}
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
						{expanded}
					</IonText>
				</IonLabel>
			</IonItem>

			{!isValid && (
				<IonItem lines="none">
					<IonNote color="danger">
						{!syntaxOK
							? "Unbalanced or invalid template"
							: !httpsOK
								? "Only https:// URLs are allowed"
								: "Unknown attribute(s): " + unknown.join(", ")}
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





