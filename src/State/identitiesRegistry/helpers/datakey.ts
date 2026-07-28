import { exportAesGcmKey, generateAesGcmKey, importAesGcmKey } from "@/lib/aesGcm";
import { IdentityNostrApi } from "./identityNostrApi";
import { base64urlDecode, base64urlEncode } from "@/lib/base64url";


export async function wrapDataKeyWithNip44(args: {
	pubkey: string;
	api: IdentityNostrApi;
	dataKey: CryptoKey;
}): Promise<string> {
	const rawDataKey = await exportAesGcmKey(args.dataKey);
	const encoded = base64urlEncode(rawDataKey);
	return args.api.encrypt(args.pubkey, encoded);
}

export async function unwrapDataKeyWithNip44(args: {
	pubkey: string;
	api: IdentityNostrApi;
	wrappedDataKeyCiphertext: string;
}): Promise<CryptoKey> {
	const decoded = await args.api.decrypt(args.pubkey, args.wrappedDataKeyCiphertext);
	return importAesGcmKey(base64urlDecode(decoded));
}


export async function generateAndWrapDataKey(pubkey: string, nostrApi: IdentityNostrApi) {
	const dataKey = await generateAesGcmKey();



	const wrappedDataKeyCiphertext = await wrapDataKeyWithNip44({
		pubkey: pubkey,
		api: nostrApi,
		dataKey,
	});
	return wrappedDataKeyCiphertext;
}


