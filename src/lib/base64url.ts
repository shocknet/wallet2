export function base64urlEncode(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary)
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "");
}

export function base64urlDecode(value: string): Uint8Array {
	const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
	const base64 = padded.replaceAll("-", "+").replaceAll("_", "/");
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes;
}
