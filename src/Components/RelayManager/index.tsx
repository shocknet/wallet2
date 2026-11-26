import {
	IonButton,
	IonIcon,
	IonInput,
	IonItem,
	IonList,
	IonText,
} from "@ionic/react";
import { addOutline, closeOutline } from "ionicons/icons";
import { WsUrlSchema } from "@/lib/urlZod";
import { useValidatedInput } from "@/Hooks/useValidatedInput";

type RelayManagerProps = {
	relays: readonly string[];
	onAdd: (url: string) => void;
	onRemove: (url: string) => void;
};

export function RelayManager({
	relays,
	onAdd,
	onRemove,
}: RelayManagerProps) {
	const input = useValidatedInput<string>(
		"",
		onAdd,
		raw => {
			const parsed = WsUrlSchema.safeParse(raw);

			if (!parsed.success) {
				return {
					ok: false,
					error: "Invalid relay URL",
				};
			}

			if (relays.includes(parsed.data)) {
				return {
					ok: false,
					error: "Duplicate relay",
				};
			}

			return {
				ok: true,
				value: parsed.data,
			};
		},
		"manual",
	);

	const addRelay = () => {
		if (input.commit()) {
			input.reset();
		}
	};

	return (
		<IonList
			lines="none"
			className="m-0 !bg-transparent p-0 [--background:transparent]"
		>
			{relays.map(url => (
				<IonItem
					key={url}
					lines="none"
					detail={false}
					className="mb-2 rounded-lg [--background:var(--app-surface-muted)] [--background-activated:var(--app-surface-muted)] [--background-focused:var(--app-surface-muted)] [--background-hover:var(--app-surface-muted)] [--border-radius:0.5rem] [--border-width:0] [--highlight-height:0] [--inner-border-width:0] [--inner-padding-bottom:0] [--inner-padding-end:0] [--inner-padding-top:0] [--min-height:0] [--padding-bottom:0] [--padding-end:0] [--padding-start:0] [--padding-top:0]"
				>
					<div className="flex w-full min-w-0 items-center gap-2 px-3 py-2">
						<span className="min-w-0 flex-1 break-all text-sm text-primary">
							{url}
						</span>
						<button
							type="button"
							className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted"
							onClick={() => onRemove(url)}
							aria-label={`Remove ${url}`}
						>
							<IonIcon icon={closeOutline} />
						</button>
					</div>
				</IonItem>
			))}

			<IonItem
				lines="none"
				detail={false}
				className="[--background:transparent] [--background-activated:transparent] [--background-focused:transparent] [--background-hover:transparent] [--border-width:0] [--highlight-height:0] [--highlight-height-focused:0] [--inner-border-width:0] [--inner-padding-bottom:0] [--inner-padding-end:0] [--inner-padding-top:0] [--min-height:0] [--padding-bottom:0] [--padding-end:0] [--padding-start:0] [--padding-top:0]"
			>
				<div className="flex w-full min-w-0 items-center gap-2">
					<IonInput
						mode="md"
						fill="outline"
						className="flex-1 ![--background:transparent]"
						value={input.value}
						spellCheck={false}
						autocapitalize="off"
						inputmode="url"
						aria-label="New relay URL"
						placeholder="wss://relay.example.com"
						onIonInput={e =>
							input.onChange(e.detail.value ?? "")
						}
						onIonBlur={input.onBlur}
						onKeyDown={e => {
							if (e.key === "Enter") {
								e.preventDefault();
								addRelay();
							}
						}}
					/>
					<IonButton
						fill="clear"
						size="small"
						color="primary"
						type="button"
						disabled={!input.isValid}
						className="m-0 shrink-0 [--padding-start:0.6rem] [--padding-end:0.7rem]"
						onClick={addRelay}
						aria-label="Add relay"
					>
						<IonIcon slot="start" icon={addOutline} />
						Add
					</IonButton>
				</div>
			</IonItem>

			{input.value.trim() && input.error && (
				<IonText color="danger" className="px-1 text-sm">
					{input.error}
				</IonText>
			)}
		</IonList>
	);
}
