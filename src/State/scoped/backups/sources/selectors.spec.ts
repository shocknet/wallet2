import { describe, expect, it } from "vitest";
import { selectResolvedAdminSourceId } from "./selectors";

const resolve = selectResolvedAdminSourceId.resultFunc;

describe("selectResolvedAdminSourceId", () => {
	it("uses the only admin node", () => {
		expect(resolve(["a"], null)).toBe("a");
	});

	it("asks the user to pick when there are several admin nodes", () => {
		expect(resolve(["a", "b"], null)).toBeNull();
	});

	it("uses the node the user picked", () => {
		expect(resolve(["a", "b"], "b")).toBe("b");
	});

	it("ignores a pick that is no longer an admin node", () => {
		expect(resolve(["a", "b"], "gone")).toBeNull();
	});
});
