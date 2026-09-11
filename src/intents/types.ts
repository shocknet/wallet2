import type { ParsedLnurlWithdrawInput, ParsedNprofileInput } from "@/lib/types/parse";
import type { SendParsedInput } from "@/Pages/Send/nav";

type IntentBase = {
	id: string;
	identityId?: string;
};

export type AddSourceIntent = IntentBase & {
	kind: "add-source";
	nprofile: ParsedNprofileInput;
	fromUrl?: boolean;
	integrationData?: {
		token: string;
		lnAddress: string;
	};
	invitationToken?: string;
};

export type SweepIntent = IntentBase & {
	kind: "sweep";
	parsed: ParsedLnurlWithdrawInput;
};

export type SendIntent = IntentBase & {
	kind: "send";
	parsed: SendParsedInput;
};

export type OpenOperationIntent = IntentBase & {
	kind: "open-operation";
	sourceId: string;
	operationId: string;
};

export type NavigateIntent = IntentBase & {
	kind: "navigate";
	path: string;
};

export type AppIntent =
	| AddSourceIntent
	| SweepIntent
	| SendIntent
	| OpenOperationIntent
	| NavigateIntent;

export type AppIntentInput =
	| Omit<AddSourceIntent, "id">
	| Omit<SweepIntent, "id">
	| Omit<SendIntent, "id">
	| Omit<OpenOperationIntent, "id">
	| Omit<NavigateIntent, "id">;

export function isAddSourceIntent(intent: AppIntent): intent is AddSourceIntent {
	return intent.kind === "add-source";
}

export function isSweepIntent(intent: AppIntent): intent is SweepIntent {
	return intent.kind === "sweep";
}

export function isSendIntent(intent: AppIntent): intent is SendIntent {
	return intent.kind === "send";
}

export function isOpenOperationIntent(intent: AppIntent): intent is OpenOperationIntent {
	return intent.kind === "open-operation";
}

export function isNavigateIntent(intent: AppIntent): intent is NavigateIntent {
	return intent.kind === "navigate";
}
