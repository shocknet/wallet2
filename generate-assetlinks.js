#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers"
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const args = yargs(hideBin(process.argv))
	.option("keystore", {
		alias: "ks",
		type: "string",
		description: "Path to keystore file (absolute path)"
	})
	.option("storepass", {
		"alias": "p",
		"type": "string",
		description: "keystore password"
	})
	.option("keypass", {
		alias: "k",
		type: "string",
		description: "Key password (optional)"
	})
	.option("alias", {
		alias: "a",
		type: "string",
		description: "Key alias",
	})
	.option("package", {
		alias: "id",
		type: "string",
		description: "Android application ID",
		required: true
	})
	.option("output", {
		alias: "o",
		type: "string",
		description: "Output directory",
		default: "public/.well-known"
	})
	.parse()


async function main() {
	try {
		// Generate assetlinks.json
		if (!args.keystore) {
			throw new Error("Keystore required for assetlinks generation");
		}

		let applicationId = process.env.VITE_ANDROID_APPLICATION_ID;

		if (args.package) {
			applicationId = args.package;
		}

		if (!applicationId) {
			throw new Error("applicationId was not passed in cmd and is not present in .env");
		}

		const output = execSync(
			`keytool -list -v -keystore "${args.keystore}" ` +
			`-alias "${args.alias}" ` +
			`-storepass "${args.storepass}" ` +
			(args.keypass ? `-keypass "${args.keypass}" ` : ""),
			{ encoding: "utf-8" }
		);

		const sha256Match = output.match(/SHA256:\s+([\w:]+)/);
		if (!sha256Match) throw new Error("SHA256 fingerprint not found");

		const fingerprint = sha256Match[1];
		const assetLinks = [{
			relation: ["delegate_permission/common.handle_all_urls"],
			target: {
				namespace: "android_app",
				package_name: applicationId,
				sha256_cert_fingerprints: [fingerprint]
			}
		}];

		const outputPath = path.join(args.output, "assetlinks.json");
		fs.mkdirSync(path.dirname(outputPath), { recursive: true });
		fs.writeFileSync(outputPath, JSON.stringify(assetLinks, null, 2));
		console.log(`✓ assetlinks.json generated for ${applicationId}`);
		console.log(`✓ SHA256: ${fingerprint}`);

	} catch (error) {
		console.error("❌ Build failed:", error.message);
		process.exit(1);
	}
}

main();
