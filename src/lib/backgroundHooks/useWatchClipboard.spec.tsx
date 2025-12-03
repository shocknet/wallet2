import { describe, it, beforeEach, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter as Router } from "react-router-dom";
import { useWatchClipboard } from "./useWatchClipboard";
import { InputClassification } from "../types/parse";

function Harness() {
	useWatchClipboard();
	return null;
}

vi.useFakeTimers();


const appStateListeners: Array<(s: { isActive: boolean }) => void> = [];
const mockRemove = vi.fn();

vi.mock("@capacitor/app", () => {
	return {
		App: {
			addListener: vi.fn((_event: string, cb: (s: { isActive: boolean }) => void) => {
				appStateListeners.push(cb);
				return Promise.resolve({
					remove: mockRemove,
				});
			}),
		},
	};
});

const mockClipboardRead = vi.fn();
vi.mock("@capacitor/clipboard", () => {
	return {
		Clipboard: {
			read: (...args: any[]) => mockClipboardRead(...args),
		},
	};
});

const mockShowAlert = vi.fn();
vi.mock("../contexts/useAlert", () => {
	return {
		useAlert: () => ({
			showAlert: mockShowAlert,
		}),
	};
});

const mockPush = vi.fn();
vi.mock("react-router-dom", async (orig) => {
	const actual: any = await orig();
	return {
		...actual,
		useHistory: () => ({
			push: mockPush,
		}),
	};
});

vi.mock("../format", () => {
	return {
		truncateTextMiddle: (v: string, _n: number) => `TRUNC(${v})`,
	};
});

// app state from redux selectors
const mockDispatch = vi.fn();
let mockBootstrapped = true;
let mockSeenAssets: string[] = [];

vi.mock("@/State/store/hooks", () => {
	return {
		useAppDispatch: () => mockDispatch,
		useAppSelector: (selectorFn: any) =>
			selectorFn({
				appState: { bootstrapped: mockBootstrapped },
				generatedAssets: { assets: mockSeenAssets },
			}),
	};
});

vi.mock("@/State/Slices/generatedAssets", () => {
	return {
		addAsset: ({ asset }: { asset: string }) => ({
			type: "generatedAssets/addAsset",
			payload: { asset },
		}),
	};
});


const mockIdentifyBitcoinInput = vi.fn();
const mockParseBitcoinInput = vi.fn();
vi.mock("@/lib/parse", () => {
	return {
		identifyBitcoinInput: (...args: any[]) =>
			mockIdentifyBitcoinInput(...args),
		parseBitcoinInput: (...args: any[]) =>
			mockParseBitcoinInput(...args),
	};
});


vi.mock("../hooks/useEventCallbck/useEventCallback", () => {
	return {
		useEventCallback: (fn: any) => fn,
	};
});


let warnedMockVal = false;
const mockUpdateWarned = vi.fn();

vi.mock("../hooks/useLocalStorage/useLocalStorage", () => {
	return {
		useLocalStorage: () => [warnedMockVal, mockUpdateWarned] as const,
	};
});


function renderHarness() {
	return render(
		<Router>
			<Harness />
		</Router>
	);
}

function mockForeground() {
	Object.defineProperty(document, "hasFocus", {
		value: () => true,
		configurable: true,
	});
	Object.defineProperty(document, "visibilityState", {
		value: "visible",
		configurable: true,
	});
}


beforeEach(() => {
	mockDispatch.mockClear();
	mockShowAlert.mockClear();
	mockPush.mockClear();
	mockClipboardRead.mockReset();
	mockIdentifyBitcoinInput.mockReset();
	mockParseBitcoinInput.mockReset();
	mockRemove.mockClear();
	mockUpdateWarned.mockClear();
	appStateListeners.length = 0;

	mockBootstrapped = true;
	mockSeenAssets = [];


	warnedMockVal = false;

	mockForeground();
});

afterEach(() => {
	vi.clearAllTimers();
});



describe("useWatchClipboard happy path", () => {
	it("reads clipboard, shows alert, and on confirm navigates + dispatches addAsset", async () => {
		const clipboardText = "lnurl1heylisten";

		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: clipboardText,
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LNURL_WITHDRAW,
			value: clipboardText,
		});

		mockParseBitcoinInput.mockResolvedValue({
			type: InputClassification.LNURL_WITHDRAW,
			data: "withdraw-data",
		});

		const alertResult = Promise.resolve({ role: "confirm" });
		mockShowAlert.mockReturnValue(alertResult);

		renderHarness();

		await act(async () => {
			// let the initial throttle (50ms) fire
			vi.advanceTimersByTime(60);
			// let pending promises flush
			await Promise.resolve();
		});

		// alert shown
		expect(mockShowAlert).toHaveBeenCalledTimes(1);

		const alertConfig = mockShowAlert.mock.calls[0][0];
		expect(alertConfig.header).toMatch(/Clipboard Detected/i);
		expect(alertConfig.message).toBe(`TRUNC(${clipboardText})`);

		// resolve alert "confirm"
		await act(async () => {
			await alertResult;
			await Promise.resolve();
		});

		// addAsset dispatched
		expect(mockDispatch).toHaveBeenCalledWith({
			type: "generatedAssets/addAsset",
			payload: { asset: clipboardText },
		});

		// navigates to /sources with parsedLnurlW
		expect(mockPush).toHaveBeenCalledTimes(1);
		const navArg = mockPush.mock.calls[0][0];
		expect(navArg.pathname).toBe("/sources");
		expect(navArg.state).toEqual({
			parsedLnurlW: {
				type: InputClassification.LNURL_WITHDRAW,
				data: "withdraw-data",
			},
		});

		// because warnedMockVal started false, we should NOT have asked to reset warned
		expect(mockUpdateWarned).not.toHaveBeenCalledWith(false);
	});

	it("reads clipboard, shows alert, and on cancel still dispatches addAsset but does not navigate", async () => {
		const clipboardText = "lnbc2500nonsense";

		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: clipboardText,
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LN_INVOICE,
			value: clipboardText,
		});

		mockParseBitcoinInput.mockResolvedValue({
			type: InputClassification.LN_INVOICE,
			data: "decoded-invoice-here",
		});

		const alertResult = Promise.resolve({ role: "cancel" });
		mockShowAlert.mockReturnValue(alertResult);

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockShowAlert).toHaveBeenCalledTimes(1);

		await act(async () => {
			await alertResult;
			await Promise.resolve();
		});

		// addAsset still dispatched
		expect(mockDispatch).toHaveBeenCalledWith({
			type: "generatedAssets/addAsset",
			payload: { asset: clipboardText },
		});

		// but we did NOT navigate
		expect(mockPush).not.toHaveBeenCalled();
	});
});

describe("useWatchClipboard guards", () => {
	it("does nothing if app is not bootstrapped", async () => {
		mockBootstrapped = false;

		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: "lnurl1abc",
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LNURL_WITHDRAW,
			value: "lnurl1abc",
		});

		const alertResult = Promise.resolve({ role: "confirm" });
		mockShowAlert.mockReturnValue(alertResult);

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockShowAlert).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("does nothing if classification is UNKNOWN", async () => {
		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: "weirdstuff",
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.UNKNOWN,
			value: "weirdstuff",
		});

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockShowAlert).not.toHaveBeenCalled();
	});

	it("does nothing if value was already seen", async () => {
		const repeated = "lnurl1repeat";
		mockSeenAssets = [repeated];

		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: repeated,
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LN_INVOICE,
			value: repeated,
		});

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockShowAlert).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
	});

	it("does nothing if Clipboard.read() throws a generic error (not NotAllowedError)", async () => {
		mockClipboardRead.mockRejectedValue(new Error("nope"));

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LN_INVOICE,
			value: "lnurl",
		});

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		// no alert, no dispatch, no nav
		expect(mockShowAlert).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});
});

describe("clipboard permission warning ('warned') behavior", () => {
	it("on first NotAllowedError and warned=false: shows 'Clipboard Permission Denided' alert and sets warned=true via onDidPresent", async () => {
		// start with warnedMockVal = false (default in beforeEach)
		mockClipboardRead.mockRejectedValue({ name: "NotAllowedError" });

		const alertResult = Promise.resolve({ role: "cancel" });
		mockShowAlert.mockReturnValue(alertResult);

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		// we should have shown the permission denied alert
		expect(mockShowAlert).toHaveBeenCalledTimes(1);
		const cfg = mockShowAlert.mock.calls[0][0];
		expect(cfg.header).toMatch(/Clipboard Permission Denided/i);
		expect(typeof cfg.onDidPresent).toBe("function");

		// simulate Ionic alert actually presenting
		cfg.onDidPresent();

		// after presenting, we expect warned := true
		expect(mockUpdateWarned).toHaveBeenCalledWith(true);

		// we do NOT navigate or dispatch addAsset in this path
		expect(mockPush).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
	});

	it("on NotAllowedError and warned=true: does NOT show alert again", async () => {
		// set warnedMockVal already true to simulate 'we already warned the user'
		warnedMockVal = true;

		mockClipboardRead.mockRejectedValue({ name: "NotAllowedError" });

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		// no alert spam
		expect(mockShowAlert).not.toHaveBeenCalled();

		// no attempts to flip warned here, since read threw
		expect(mockUpdateWarned).not.toHaveBeenCalled();

		expect(mockPush).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
	});

	it("on successful Clipboard.read and warned=true: resets warned back to false", async () => {
		// warned starts true
		warnedMockVal = true;

		const clipboardText = "lnbc_reset_warning";
		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: clipboardText,
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LN_INVOICE,
			value: clipboardText,
		});

		mockParseBitcoinInput.mockResolvedValue({
			type: InputClassification.LN_INVOICE,
			data: "decoded-success-here",
		});

		// user cancels, doesn't matter; this path is to assert updateWarned(false)
		const alertResult = Promise.resolve({ role: "cancel" });
		mockShowAlert.mockReturnValue(alertResult);

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		// since warnedMockVal was true, we expect the hook to call updateWarned(false)
		// right after a successful Clipboard.read
		expect(mockUpdateWarned).toHaveBeenCalledWith(false);

		// alert should still pop (normal flow)
		expect(mockShowAlert).toHaveBeenCalledTimes(1);

		// resolve alert
		await act(async () => {
			await alertResult;
			await Promise.resolve();
		});

		// addAsset was dispatched with the new asset
		expect(mockDispatch).toHaveBeenCalledWith({
			type: "generatedAssets/addAsset",
			payload: { asset: clipboardText },
		});

		// in LN_INVOICE branch, confirm 'cancel' does not navigate
		expect(mockPush).not.toHaveBeenCalled();
	});
});

describe("useWatchClipboard appStateChange handling", () => {
	it("listens to App.addListener('appStateChange') and re-checks clipboard on isActive=true", async () => {
		const clipVal = "lnurl1resume";

		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: clipVal,
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LNURL_WITHDRAW,
			value: clipVal,
		});

		mockParseBitcoinInput.mockResolvedValue({
			type: InputClassification.LNURL_WITHDRAW,
			data: "withdraw-data",
		});

		const alertResult = Promise.resolve({ role: "confirm" });
		mockShowAlert.mockReturnValue(alertResult);

		renderHarness();

		// initial mount run
		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockShowAlert).toHaveBeenCalledTimes(1);

		// finish first alert
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});

		await act(async () => {
			await alertResult;
			await Promise.resolve();
		});

		// now simulate clipboard changed while backgrounded
		const newVal = "lnbc2500fresh";
		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: newVal,
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LN_INVOICE,
			value: newVal,
		});

		mockParseBitcoinInput.mockResolvedValue({
			type: InputClassification.LN_INVOICE,
			data: "decoded-invoice-later",
		});

		const nextAlertResult = Promise.resolve({ role: "cancel" });
		mockShowAlert.mockReturnValueOnce(nextAlertResult);

		// app goes inactive then active again
		await act(async () => {
			for (const cb of appStateListeners) {
				cb({ isActive: false });
			}
		});

		await act(async () => {
			for (const cb of appStateListeners) {
				cb({ isActive: true });
			}
			vi.advanceTimersByTime(60);
		});

		// wait for alert promise resolve
		await nextAlertResult;
		await Promise.resolve();

		await act(async () => {
			await Promise.resolve();
		});

		// second alert fired
		expect(mockShowAlert).toHaveBeenCalledTimes(2);

		// and we stored the asset
		expect(mockDispatch).toHaveBeenCalledWith({
			type: "generatedAssets/addAsset",
			payload: { asset: "lnbc2500fresh" },
		});
	});
});
