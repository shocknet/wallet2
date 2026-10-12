import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// jsdom's TextEncoder returns a Uint8Array from another realm. nostr-tools nip44
// checks `instanceof Uint8Array` and rejects it. Copy the bytes into this realm.
const NativeTextEncoder = globalThis.TextEncoder;
globalThis.TextEncoder = class extends NativeTextEncoder {
	encode(input?: string) {
		return new Uint8Array(super.encode(input));
	}
} as typeof TextEncoder;

afterEach(() => {
	cleanup();
});
