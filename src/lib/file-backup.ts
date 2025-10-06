import AES from "crypto-js/aes";
import encUtf8 from "crypto-js/enc-utf8";


import { Filesystem, Directory } from "@capacitor/filesystem";
import { isPlatform } from "@ionic/react";

function timestampName(prefix: string, ext = "dat") {
	const ts = new Date().toLocaleString().replace(/[,:\s/]/g, "-");
	return `${prefix}-${ts}.${ext}`;
}

export async function downloadNsecBackup(nsec: string, passphrase: string, filename?: string) {
	if (!nsec) throw new Error("Missing nsec");
	if (!passphrase) throw new Error("Missing passphrase");

	const ciphertext = AES.encrypt(nsec, passphrase).toString();

	const name = filename ?? timestampName("nsec-backup");

	if (!isPlatform("hybrid")) {

		const blob = new Blob([ciphertext], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	} else {

		await Filesystem.writeFile({
			path: name,
			data: ciphertext, // text string
			directory: Directory.Documents,
			recursive: true,
		});
	}
}



export type ImportResult =
	| { kind: "nsec"; nsec: string }
	| { kind: "legacy"; parsed: Record<string, any> };


export async function importBackupFileText(fileText: string, passphrase: string): Promise<ImportResult> {
	if (!fileText) throw new Error("Empty file");
	if (!passphrase) throw new Error("Missing passphrase");


	const maybeDataUrl = /^data:.*?;base64,/.test(fileText);
	const ciphertext = maybeDataUrl ? atob(fileText.split(",")[1] ?? "") : fileText;


	let plaintext = "";
	try {
		plaintext = AES.decrypt(ciphertext, passphrase).toString(encUtf8);
	} catch {
		throw new Error("Decryption failed (wrong password or corrupt file)");
	}
	if (!plaintext) {
		throw new Error("Wrong password or empty decrypted payload");
	}


	try {
		const parsed = JSON.parse(plaintext);
		console.log({ parsed })
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {

			return { kind: "legacy", parsed };
		} else {
			return { kind: "legacy", parsed: {} };
		}
	} catch {
		/* It's an nsec */
	}


	return { kind: "nsec", nsec: plaintext.trim() };
}


export async function importBackupFile(file: File, passphrase: string): Promise<ImportResult> {
	const text = await file.text();
	return importBackupFileText(text, passphrase);
}
