import { describe, expect, it } from "vitest";
import { InputClassification, type ParsedInput } from "@/lib/types/parse";
import {
	bitcoinInputReducer,
	createInitialBitcoinInputState,
	displayValueForParsed,
} from "./model";

const nprofile = (overrides?: Partial<Extract<ParsedInput, { type: InputClassification.NPROFILE }>>): ParsedInput => ({
	type: InputClassification.NPROFILE,
	data: "nprofile1qq",
	pubkey: "pk",
	relays: ["wss://relay.example"],
	...overrides,
});

describe("displayValueForParsed", () => {
	it("keeps nprofile:token when an admin enroll token is present", () => {
		expect(
			displayValueForParsed(
				nprofile({ adminEnrollToken: "admin-token" }),
			),
		).toBe("nprofile1qq:admin-token");
	});

	it("uses parsed.data otherwise", () => {
		expect(displayValueForParsed(nprofile())).toBe("nprofile1qq");
		expect(
			displayValueForParsed({
				type: InputClassification.BITCOIN_ADDRESS,
				data: "bc1qexample",
			}),
		).toBe("bc1qexample");
	});
});

describe("createInitialBitcoinInputState", () => {
	it("starts empty and idle", () => {
		expect(createInitialBitcoinInputState()).toEqual({
			status: "idle",
			value: "",
		});
	});

	it("seeds from initialParsed as ok", () => {
		const parsed = nprofile({ adminEnrollToken: "tok" });
		expect(createInitialBitcoinInputState({ parsed })).toEqual({
			status: "ok",
			value: "nprofile1qq:tok",
			parsed,
		});
	});

	it("prefers an explicit initial value over displayValueForParsed", () => {
		const parsed = nprofile();
		const state = createInitialBitcoinInputState({
			value: " pasted ",
			parsed,
		});
		expect(state).toEqual({
			status: "ok",
			value: " pasted ",
			parsed,
		});
	});

	it("treats a non-empty initial value without parsed as typing", () => {
		expect(
			createInitialBitcoinInputState({ value: "nprofile1qq" }),
		).toEqual({
			status: "typing",
			value: "nprofile1qq",
		});
	});
});

describe("bitcoinInputReducer", () => {
	it("moves to typing on non-empty input and drops prior parse", () => {
		let state = createInitialBitcoinInputState({ parsed: nprofile() });
		state = bitcoinInputReducer(state, {
			type: "input",
			value: "lnbc1",
		});
		expect(state).toEqual({
			status: "typing",
			value: "lnbc1",
		});
	});

	it("returns to idle on empty or whitespace input", () => {
		let state = createInitialBitcoinInputState();
		state = bitcoinInputReducer(state, { type: "input", value: "lnbc1" });
		state = bitcoinInputReducer(state, { type: "input", value: "   " });
		expect(state).toEqual({
			status: "idle",
			value: "   ",
		});
	});

	it("clears back to empty idle", () => {
		let state = createInitialBitcoinInputState();
		state = bitcoinInputReducer(state, { type: "input", value: "lnbc1" });
		state = bitcoinInputReducer(state, { type: "clear" });
		expect(state).toEqual({
			status: "idle",
			value: "",
		});
	});

	it("enters loading with a classification", () => {
		expect(
			bitcoinInputReducer(createInitialBitcoinInputState(), {
				type: "parseLoading",
				value: "lnurl1qq",
				classification: InputClassification.LNURL_PAY,
			}),
		).toEqual({
			status: "loading",
			value: "lnurl1qq",
			classification: InputClassification.LNURL_PAY,
		});
	});

	it("stores a successful parse", () => {
		const parsed = nprofile();
		expect(
			bitcoinInputReducer(createInitialBitcoinInputState(), {
				type: "parseOk",
				value: "nprofile1qq",
				parsed,
			}),
		).toEqual({
			status: "ok",
			value: "nprofile1qq",
			parsed,
		});
	});

	it("stores a parse error; typing again leaves the error behind", () => {
		let state = bitcoinInputReducer(createInitialBitcoinInputState(), {
			type: "parseError",
			value: "nope",
			error: "Unrecognized input",
			classification: InputClassification.UNKNOWN,
		});
		expect(state).toEqual({
			status: "error",
			value: "nope",
			error: "Unrecognized input",
			classification: InputClassification.UNKNOWN,
		});

		state = bitcoinInputReducer(state, { type: "input", value: "still" });
		expect(state).toEqual({
			status: "typing",
			value: "still",
		});
	});

	it("commits an already-parsed value as ok", () => {
		const parsed = nprofile({ adminEnrollToken: "tok" });
		expect(
			bitcoinInputReducer(createInitialBitcoinInputState(), {
				type: "parseOk",
				value: displayValueForParsed(parsed),
				parsed,
			}),
		).toEqual({
			status: "ok",
			value: "nprofile1qq:tok",
			parsed,
		});
	});
});
