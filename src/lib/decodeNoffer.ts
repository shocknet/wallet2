import { decodeBech32 } from "@shocknet/clink-sdk";

export function decodeNoffer(data: string) {
	const decoded = decodeBech32(data);
	if (decoded.type !== "noffer") {
		throw new Error("Invalid noffer");
	}
	return decoded.data;
}
