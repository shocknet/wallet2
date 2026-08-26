import { parseAs } from "@/lib/parse";
import { InputClassification, type ParsedNprofileInput } from "@/lib/types/parse";
import type { SourcesPageNavState } from "./nav";

export type AddSourceIntent = {
	nprofile: ParsedNprofileInput;
	integrationData?: {
		token: string;
		lnAddress: string;
	};
	invitationToken?: string;
};

export type SourcesInbound =
	| { type: "add"; intent: AddSourceIntent }
	| { type: "sweep"; lnurlw: NonNullable<SourcesPageNavState["parsedLnurlW"]> }
	| { type: "invalid-nprofile"; message: string }
	| { type: "none" };

export async function resolveSourcesInbound(
	search: string,
	state: SourcesPageNavState | undefined,
): Promise<SourcesInbound> {
	const fromUrl = await addIntentFromSearch(search);
	if (fromUrl.type !== "none") return fromUrl;

	if (state?.parsedLnurlW) {
		return { type: "sweep", lnurlw: state.parsedLnurlW };
	}
	if (state?.parsedNprofile) {
		return { type: "add", intent: { nprofile: state.parsedNprofile } };
	}
	return { type: "none" };
}

async function addIntentFromSearch(search: string): Promise<SourcesInbound> {
	const params = new URLSearchParams(search);
	const sourceString = params.get("addSource");
	if (!sourceString) return { type: "none" };

	let nprofile: ParsedNprofileInput;
	try {
		nprofile = await parseAs(sourceString, InputClassification.NPROFILE);
	} catch (err: unknown) {
		return {
			type: "invalid-nprofile",
			message: err instanceof Error ? err.message : "Not an nprofile",
		};
	}

	return { type: "add", intent: exclusiveUrlExtra(nprofile, params) };
}

function exclusiveUrlExtra(
	nprofile: ParsedNprofileInput,
	params: URLSearchParams,
): AddSourceIntent {
	if (nprofile.adminEnrollToken) {
		return { nprofile };
	}

	const token = params.get("token");
	const lnAddress = params.get("lnAddress");
	if (token && lnAddress) {
		return { nprofile, integrationData: { token, lnAddress } };
	}

	const invitationToken = params.get("inviteToken");
	if (invitationToken) {
		return { nprofile, invitationToken };
	}

	return { nprofile };
}
