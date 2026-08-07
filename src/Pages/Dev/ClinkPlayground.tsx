import { useMemo, useState, type ReactNode } from "react";
import {
	IonButton,
	IonContent,
	IonHeader,
	IonInput,
	IonPage,
	IonSelect,
	IonSelectOption,
	IonTextarea,
} from "@ionic/react";
import {
	ClinkSDK,
	decodeBech32,
	getPublicKey,
	newNdebitFullAccessRequest,
	newNdebitPaymentRequest,
	nip19,
	type DecodeResult,
	type RecurringDebitTimeUnit,
} from "@shocknet/clink-sdk";
import { bytesToHex } from "@noble/hashes/utils";
import RootPageToolbar from "@/Layout2/RootPageToolbar";

type ClientKey = {
	privateKey: Uint8Array;
	publicKeyHex: string;
	npub: string;
};

type LogEntry = {
	at: string;
	label: string;
	payload: unknown;
};

function makeClientKey(privateKey = ClinkSDK.generateSecretKey()): ClientKey {
	const publicKeyHex = getPublicKey(privateKey);
	return {
		privateKey,
		publicKeyHex,
		npub: nip19.npubEncode(publicKeyHex),
	};
}

function tryDecode(raw: string): DecodeResult | { error: string } {
	const value = raw.trim();
	if (!value) {
		return { error: "Paste a noffer1 / ndebit1 / nmanage1 string" };
	}
	try {
		return decodeBech32(value);
	} catch (err) {
		return {
			error: err instanceof Error ? err.message : "Failed to decode bech32",
		};
	}
}

function Section({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className="flex flex-col gap-3">
			<p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">
				{title}
			</p>
			{children}
		</section>
	);
}

function MonoBlock({ value }: { value: unknown }) {
	return (
		<pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 font-mono text-xs text-secondary">
			{typeof value === "string" ? value : JSON.stringify(value, null, 2)}
		</pre>
	);
}

export default function ClinkPlayground() {
	const [bech32, setBech32] = useState("");
	const [client, setClient] = useState<ClientKey>(() => makeClientKey());
	const [timeoutSeconds, setTimeoutSeconds] = useState(30);
	const [amountSats, setAmountSats] = useState(1000);
	const [budgetNumber, setBudgetNumber] = useState(1);
	const [budgetUnit, setBudgetUnit] =
		useState<RecurringDebitTimeUnit>("day");
	const [bolt11, setBolt11] = useState("");
	const [busy, setBusy] = useState(false);
	const [log, setLog] = useState<LogEntry[]>([]);

	const decoded = useMemo(() => tryDecode(bech32), [bech32]);

	const pushLog = (label: string, payload: unknown) => {
		setLog((prev) => [
			{
				at: new Date().toISOString(),
				label,
				payload,
			},
			...prev,
		]);
	};

	const sdkFromDecoded = () => {
		if ("error" in decoded) {
			throw new Error(decoded.error);
		}
		return new ClinkSDK({
			privateKey: client.privateKey,
			relays: [decoded.data.relay],
			toPubKey: decoded.data.pubkey,
			defaultTimeoutSeconds: timeoutSeconds,
		});
	};

	const pointerFromDecoded = () => {
		if ("error" in decoded) {
			return undefined;
		}
		if (decoded.type === "ndebit" || decoded.type === "nmanage") {
			return decoded.data.pointer;
		}
		return undefined;
	};

	const run = async (label: string, action: () => Promise<unknown>) => {
		if (busy) {
			return;
		}
		setBusy(true);
		try {
			const result = await action();
			pushLog(label, result);
		} catch (err) {
			pushLog(label, {
				error: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setBusy(false);
		}
	};

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<RootPageToolbar title="Clink playground" />
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="mx-auto flex w-full max-w-md flex-col gap-6 pb-10 pt-4">
					<Section title="Bech32">
						<IonTextarea
							className="filled-input"
							fill="solid"
							mode="md"
							label="noffer1 / ndebit1 / nmanage1"
							labelPlacement="stacked"
							autoGrow
							value={bech32}
							onIonInput={(e) => setBech32(e.detail.value ?? "")}
						/>
						{"error" in decoded ? (
							<p className="m-0 text-sm text-danger">{decoded.error}</p>
						) : (
							<MonoBlock value={decoded} />
						)}
					</Section>

					<Section title="Client identity">
						<MonoBlock
							value={{
								npub: client.npub,
								pubkey: client.publicKeyHex,
								privkey: bytesToHex(client.privateKey),
							}}
						/>
						<IonButton
							expand="block"
							fill="outline"
							disabled={busy}
							onClick={() => {
								const next = makeClientKey();
								setClient(next);
								pushLog("generateSecretKey", {
									npub: next.npub,
									pubkey: next.publicKeyHex,
								});
							}}
						>
							Generate new key
						</IonButton>
						<IonInput
							className="filled-input"
							fill="solid"
							mode="md"
							type="number"
							label="Timeout (seconds)"
							labelPlacement="stacked"
							value={timeoutSeconds}
							onIonInput={(e) =>
								setTimeoutSeconds(Number(e.detail.value) || 30)
							}
						/>
					</Section>

					<Section title="Ndebit">
						<IonInput
							className="filled-input"
							fill="solid"
							mode="md"
							type="number"
							label="Amount (sats)"
							labelPlacement="stacked"
							value={amountSats}
							onIonInput={(e) =>
								setAmountSats(Number(e.detail.value) || 0)
							}
						/>
						<div className="grid grid-cols-2 gap-2">
							<IonInput
								className="filled-input"
								fill="solid"
								mode="md"
								type="number"
								label="Budget number"
								labelPlacement="stacked"
								value={budgetNumber}
								onIonInput={(e) =>
									setBudgetNumber(Number(e.detail.value) || 1)
								}
							/>
							<IonSelect
								className="filled-input"
								fill="solid"
								mode="md"
								label="Budget unit"
								labelPlacement="stacked"
								interface="popover"
								value={budgetUnit}
								onIonChange={(e) =>
									setBudgetUnit(e.detail.value as RecurringDebitTimeUnit)
								}
							>
								<IonSelectOption value="day">day</IonSelectOption>
								<IonSelectOption value="week">week</IonSelectOption>
								<IonSelectOption value="month">month</IonSelectOption>
							</IonSelect>
						</div>
						<IonTextarea
							className="filled-input"
							fill="solid"
							mode="md"
							label="Bolt11 (pay once)"
							labelPlacement="stacked"
							autoGrow
							value={bolt11}
							onIonInput={(e) => setBolt11(e.detail.value ?? "")}
						/>
						<div className="grid grid-cols-1 gap-2">
							<IonButton
								expand="block"
								disabled={busy || "error" in decoded || decoded.type !== "ndebit"}
								onClick={() =>
									void run("Ndebit full access", async () => {
										const sdk = sdkFromDecoded();
										return sdk.Ndebit(
											newNdebitFullAccessRequest(pointerFromDecoded()),
										);
									})
								}
							>
								Request full access
							</IonButton>
							<IonButton
								expand="block"
								fill="outline"
								disabled={busy || "error" in decoded || decoded.type !== "ndebit"}
								onClick={() =>
									void run("Ndebit budget", async () => {
										const sdk = sdkFromDecoded();
										return sdk.Ndebit(
											ClinkSDK.newNdebitBudgetRequest(
												{ number: budgetNumber, unit: budgetUnit },
												amountSats,
												pointerFromDecoded(),
											),
										);
									})
								}
							>
								Request budget
							</IonButton>
							<IonButton
								expand="block"
								fill="outline"
								disabled={
									busy ||
									!bolt11.trim() ||
									"error" in decoded ||
									decoded.type !== "ndebit"
								}
								onClick={() =>
									void run("Ndebit pay invoice", async () => {
										const sdk = sdkFromDecoded();
										return sdk.Ndebit(
											newNdebitPaymentRequest(
												bolt11.trim(),
												amountSats || undefined,
												pointerFromDecoded(),
											),
										);
									})
								}
							>
								Pay invoice once
							</IonButton>
						</div>
					</Section>

					<Section title="Noffer">
						<IonButton
							expand="block"
							disabled={busy || "error" in decoded || decoded.type !== "noffer"}
							onClick={() =>
								void run("Noffer", async () => {
									if ("error" in decoded || decoded.type !== "noffer") {
										throw new Error("Need a decoded noffer1");
									}
									const sdk = sdkFromDecoded();
									return sdk.Noffer(
										{
											offer: decoded.data.offer,
											amount_sats: amountSats || undefined,
										},
										(receipt) => pushLog("Noffer receipt", receipt),
									);
								})
							}
						>
							Request invoice
						</IonButton>
					</Section>

					<Section title="Nmanage">
						<IonButton
							expand="block"
							disabled={
								busy || "error" in decoded || decoded.type !== "nmanage"
							}
							onClick={() =>
								void run("Nmanage list", async () => {
									const sdk = sdkFromDecoded();
									return sdk.Nmanage(
										ClinkSDK.newListRequest(pointerFromDecoded()),
									);
								})
							}
						>
							List offers
						</IonButton>
					</Section>

					<Section title="Log">
						<div className="flex justify-end">
							<IonButton
								size="small"
								fill="clear"
								disabled={log.length === 0}
								onClick={() => setLog([])}
							>
								Clear
							</IonButton>
						</div>
						{log.length === 0 ? (
							<p className="m-0 text-sm text-muted">No requests yet.</p>
						) : (
							<div className="flex flex-col gap-3">
								{log.map((entry) => (
									<div key={`${entry.at}-${entry.label}`} className="flex flex-col gap-1">
										<p className="m-0 text-xs text-muted">
											{entry.at} · {entry.label}
										</p>
										<MonoBlock value={entry.payload} />
									</div>
								))}
							</div>
						)}
					</Section>
				</div>
			</IonContent>
		</IonPage>
	);
}
