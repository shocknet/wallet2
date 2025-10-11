import { IdentityDocV0, IdentityDocV0Schema, migrateIdentityDocToCurrent } from "@/State/scoped/backups/identity/schema";
import { identityActions } from "@/State/scoped/backups/identity/slice";
import { migrateSourceDocToCurrent, SourceDocV0, SourceDocV0Schema } from "@/State/scoped/backups/sources/schema";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { DocBase, DocBaseSchema } from "@/State/scoped/common";
import { AppThunkDispatch } from "@/State/store/store";

async function sha256Base64Url(input: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);

	// Convert to Base64
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const base64 = btoa(String.fromCharCode(...hashArray));

	// Convert to Base64URL
	return base64
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}


const SOURCE_NS = "-shockwallet:source_";

export async function getSourceDocDtag(pubkey: string, sourceId: string) {
	const material = `${pubkey}|${SOURCE_NS}|${sourceId}`;
	const digest = await sha256Base64Url(material);
	return `source@${digest}`;
}


export const getIdentityDocDtag = (pubkey: string) => {
	return `-identity@${pubkey}_`;
}




async function processRemoteIdentityDoc(doc: DocBase, dispatch: AppThunkDispatch): Promise<IdentityDocV0 | null> {
	let migrationResult;

	try {
		migrationResult = migrateIdentityDocToCurrent(doc);
	} catch {
		return null;
	}

	if (migrationResult === "AHEAD") {
		/* TODO: Mark the app as outdated */
		return null;
	} else {
		const docParseResult = IdentityDocV0Schema.safeParse(migrationResult);
		if (!docParseResult.success) {
			return null;
		}
		dispatch(identityActions.applyRemoteIdentity({ remote: docParseResult.data }));
		return docParseResult.data
	}
}

async function processRemoteSourceDoc(doc: DocBase, dispatch: AppThunkDispatch): Promise<SourceDocV0 | null> {

	let migrationResult;

	try {
		migrationResult = migrateSourceDocToCurrent(doc);
	} catch {
		return null;
	}


	if (migrationResult === "AHEAD") {
		/* TODO: Mark the app as outdated */
		return null;
	} else {
		const docParseResult = await SourceDocV0Schema.safeParseAsync(migrationResult);
		if (!docParseResult.success) {
			return null;
		}
		dispatch(sourcesActions.applyRemoteSource({ sourceId: docParseResult.data.source_id, remote: docParseResult.data }));
		return docParseResult.data
	}
}
export async function processRemoteDoc(doc: unknown, dispatch: AppThunkDispatch): Promise<IdentityDocV0 | SourceDocV0 | null> {
	const result = DocBaseSchema.safeParse(doc);
	if (!result.success) return null;

	if (result.data.doc_type === "doc/shockwallet/identity_") {
		return processRemoteIdentityDoc(result.data, dispatch)
	} else {
		return processRemoteSourceDoc(result.data, dispatch)
	}
}
