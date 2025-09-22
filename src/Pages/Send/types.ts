import { FeeTier } from "@/lib/fees";
import { InputClassification, ParsedInput, ParsedInvoiceInput, ParsedLightningAddressInput, ParsedLnurlPayInput, ParsedNofferInput } from "@/lib/types/parse";
import { NprofileView } from "@/State/scoped/backups/sources/selectors";

interface IdleState {
	status: "idle";
	inputValue: string;
}


interface LoadingState {
	status: "loading";
	inputValue: string;
	classification: InputClassification;
	// e.g. LNURL or LN_ADDRESS being fetched
}

interface ParsedOkState {
	status: "parsedOk";
	inputValue: string;
	parsedData: ParsedInput;
}

interface ErrorState {
	status: "error";
	inputValue: string;
	error: string;
	classification?: InputClassification;
}

// Recipient input states
export type InputState =
	| IdleState
	| LoadingState
	| ParsedOkState
	| ErrorState;


export interface CardProps {
	selectedFeeTier: number;
	setSelectedFeeTier: React.Dispatch<React.SetStateAction<number>>;
	feeTiers: FeeTier[];
	selectedSource: NprofileView
	invoiceData: ParsedInvoiceInput;
	lnurlData: ParsedLightningAddressInput | ParsedLnurlPayInput;
	nofferData: ParsedNofferInput;
	note: string;
	setNote: React.Dispatch<React.SetStateAction<string>>;
}
