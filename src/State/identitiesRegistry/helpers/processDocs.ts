import dLogger from "@/Api/helpers/debugLog";
import { IdentityDocV0, IdentityDocV0Schema, migrateIdentityDocToCurrent } from "@/State/scoped/backups/identity/schema";
import { migrateSourceDocToCurrent, SourceDocV0, SourceDocV0Schema } from "@/State/scoped/backups/sources/schema";
import { DocBase, DocBaseSchema } from "@/State/scoped/common";



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


const SOURCE_NS = "shockwallet:source_";

export async function getSourceDocDtag(pubkey: string, sourceId: string) {
	const material = `${pubkey}|${SOURCE_NS}|${sourceId}`;
	const digest = await sha256Base64Url(material);
	return `source@${digest}`;
}

export const identityDocDtag = "sw_identity";





async function processRemoteIdentityDoc(doc: DocBase): Promise<IdentityDocV0 | null> {
	const log = dLogger.withContext({
		procedure: "process-remote-identity-doc",
	});

	let migrationResult;


	try {
		migrationResult = migrateIdentityDocToCurrent(doc);
	} catch {
		log.error("Error migrating doc");
		return null;
	}

	if (migrationResult === "AHEAD") {
		/* TODO: Mark the app as outdated */
		log.error("remote doc version is ahead of us");
		return null;
	} else {
		const docParseResult = IdentityDocV0Schema.safeParse(migrationResult);
		if (!docParseResult.success) {
			log.error("failed parsing remote doc");
			return null;
		}
		log.info("parsed remote doc", {
			data: { pubkey: docParseResult.data.identity_pubkey, favSrc: docParseResult.data.favorite_source_id }
		});
		return docParseResult.data
	}
}

async function processRemoteSourceDoc(doc: DocBase): Promise<SourceDocV0 | null> {
	const log = dLogger.withContext({
		procedure: "process-remote-source-doc",
	});

	let migrationResult;

	try {
		migrationResult = migrateSourceDocToCurrent(doc);
	} catch {
		log.error("Error migrating doc");
		return null;
	}


	if (migrationResult === "AHEAD") {
		/* TODO: Mark the app as outdated */
		log.error("remote doc version is ahead of us");
		return null;
	} else {
		const docParseResult = await SourceDocV0Schema.safeParseAsync(migrationResult);
		if (!docParseResult.success) {
			log.error("failed parsing remote doc");
			return null;
		}

		const { keys: _keys, admin_token: _admin_token, ...safeFields } = docParseResult.data;

		log.info("parsed remote doc", {
			data: { ...safeFields }
		});
		return docParseResult.data
	}
}
export async function processRemoteDoc(doc: unknown): Promise<IdentityDocV0 | SourceDocV0 | null> {
	const log = dLogger.withContext({
		procedure: "process-remote-docs-base"
	});

	const result = DocBaseSchema.safeParse(doc);
	if (!result.success) {
		log.error("failed parsing remote doc");
		return null;
	}

	if (result.data.doc_type === "doc/shockwallet/identity_") {
		return processRemoteIdentityDoc(result.data)
	} else {
		return processRemoteSourceDoc(result.data)
	}
}
