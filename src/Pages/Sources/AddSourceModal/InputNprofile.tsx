import { useState } from "react";
import { BitcoinInput } from "@/Components/BitcoinInput/BitcoinInput";
import { IDLE_STATE, type BitcoinInputState } from "@/Components/BitcoinInput/model";
import { InputClassification, type ParsedNprofileInput } from "@/lib/types/parse";
import type { ModalDismiss } from "@/Components/Modals/hooks/useAskModal";
import { AddNprofileCase } from "./AddCases/AddNprofileCase";
import { ConnectAsAdminCase } from "./AddCases/ConnectAsAdminCase";


const NPROFILE_ONLY = [InputClassification.NPROFILE];

function nprofileFromDraft(state: BitcoinInputState): ParsedNprofileInput | null {
	if (state.status !== "ok") return null;
	if (state.parsed.type !== InputClassification.NPROFILE) return null;
	return state.parsed;
}

export function InputNprofileCase({
	dismiss,
}: {
	dismiss: ModalDismiss<true>;
}) {
	const [draft, setDraft] = useState<BitcoinInputState>(IDLE_STATE);
	const parsed = nprofileFromDraft(draft);

	return (
		<>
			<p className="m-0 mb-3 text-sm text-muted">
				Paste a Lightning.Pub node&apos;s <strong className="text-secondary">nprofile</strong> to connect.
			</p>
			<BitcoinInput
				allowed={NPROFILE_ONLY}
				unidentifiedError="Not an nprofile"
				scanInstruction="Scan an nprofile"
				placeholder="nprofile1..."
				fill="solid"
				mode="md"
				onChange={setDraft}
				className="filled-input"
			/>
			<div className="mt-5 flex flex-col gap-2">
				{
					parsed
						? parsed.adminEnrollToken
							? (
								<ConnectAsAdminCase
									parsed={parsed as ParsedNprofileInput & { adminEnrollToken: string }}
									dismiss={dismiss}
								/>
							)
							: <AddNprofileCase parsed={parsed} dismiss={dismiss} />
						: null
				}
			</div>
		</>
	);
}
