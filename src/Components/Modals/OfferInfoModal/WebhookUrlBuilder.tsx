import { IonChip, IonInput, IonItem, IonLabel, IonList, IonNote, IonText, IonToggle } from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles/index.module.scss";
import { useDrag, useDrop } from "react-dnd";
import { charIndexAtX, prefixWidthPx } from "./utils";
import { throttle } from "@/lib/throttle";
import { BUILT_INS, TOKEN_RX, validateUrl } from "./utils";
import { highlightUrl } from "./helpers";





interface WebhookUrlBuilderProps {
	rows: string[];
	setUrl: (url: string) => void;
	url: string;
	onValidityChange?: (valid: boolean) => void;
}

const WebhookUrlBuilder = ({ rows, setUrl, url, onValidityChange }: WebhookUrlBuilderProps) => {
	const urlInputRef = useRef<HTMLIonInputElement | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const [caret, setCaret] = useState<{ left: number; top: number; height: number } | null>(null);
	const [forceSSL, setForceSSL] = useState(true);



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

	const tokensInUrl = useMemo(
		() => Array.from(url.matchAll(TOKEN_RX)).map(m => m[1]),
		[url]
	);
	const unknownTokens = useMemo(
		() => new Set(tokensInUrl.filter(t => !allowedTokens.includes(t))),
		[tokensInUrl, allowedTokens]
	);

	const { ok: urlOk } = validateUrl(url, forceSSL);
	const isValid = urlOk && unknownTokens.size === 0;
	useEffect(() => {
		onValidityChange?.(isValid);
	}, [isValid, onValidityChange]);


	const [{ isOver, canDrop }, dropRef] = useDrop({
		accept: "TOKEN",
		drop: async ({ token }: { token: string }, monitor) => {
			const client = monitor.getClientOffset();
			const info = client && (await compute(client.x));
			const index = info ? info.index : url.length;

			const insert = `%[${token}]`;

			setUrl(url.slice(0, index) + insert + url.slice(index));

			setCaret(null);

		},
		hover: throttle(async (_item, monitor) => {
			const client = monitor.getClientOffset();
			if (!client || !wrapperRef.current) return;
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


	const insertByCaret = useCallback(async (tok: string) => {
		if (!urlInputRef.current) return;
		const el = await urlInputRef.current.getInputElement();
		const start = el.selectionStart ?? url.length;
		const insert = `%[${tok}]`;
		setUrl(url.slice(0, start) + insert + url.slice(start));
		setTimeout(() => {
			el.setSelectionRange(start + insert.length, start + insert.length);
			el.focus();
		});
	}, [setUrl, url]);




	return (


		<IonList className={styles["edit-list"]} lines="none">
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
						ref={el => {
							urlInputRef.current = el;
						}}
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
							border: canDrop ? '2px dashed var(--ion-color-primary)' : undefined
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
				</div>




			</IonItem>
			{url && (
				<IonItem lines="none">
					<IonLabel >
						<span className="text-quiet ion-margin-bottom">Preview:</span>
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
			<div className="ion-padding-horizontal ion-padding-bottom">
				{
					...allowedTokens.map(t => (

						<DraggableChip key={t} token={t} handleClick={insertByCaret} />
					))
				}
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





