import { describe, expect, it } from "vitest";
import { overlayDismissResult } from "./types";

describe("overlayDismissResult", () => {
	it("keeps a typed dismiss payload", () => {
		expect(overlayDismissResult({ role: "confirm", data: "pw" })).toEqual({
			role: "confirm",
			data: "pw",
		});
		expect(overlayDismissResult({ role: "cancel" })).toEqual({ role: "cancel" });
	});

	it("maps Ionic closes with no typed result to cancel", () => {
		expect(overlayDismissResult(undefined)).toEqual({ role: "cancel" });
		expect(overlayDismissResult(null)).toEqual({ role: "cancel" });
		expect(overlayDismissResult("backdrop")).toEqual({ role: "cancel" });
	});
});
