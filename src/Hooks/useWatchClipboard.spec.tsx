import { describe, it, beforeEach, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter as Router } from "react-router-dom";
import { useWatchClipboard } from "./useWatchClipboard";
import { InputClassification } from "../lib/types/parse";

function Harness() {
	useWatchClipboard();
	return null;
}

vi.useFakeTimers();

const mockClipboardRead = vi.fn();
vi.mock("@capacitor/clipboard", () => {
	return {
		Clipboard: {
			read: (...args: any[]) => mockClipboardRead(...args),
		},
	};
});

const mockShowAlert = vi.fn();
vi.mock("@/lib/contexts/useAlert", () => {
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

vi.mock("@/lib/format", () => {
	return {
		truncateTextMiddle: (v: string, _n: number) => `TRUNC(${v})`,
	};
});

const mockAskClipboardDetected = vi.fn();
vi.mock("@/Components/Modals/ClipboardDetectedModal", () => {
	return {
		useAskClipboardDetected: () => mockAskClipboardDetected,
	};
});

const mockAskSweepLnurlw = vi.fn();
vi.mock("@/Components/Modals/SweepLnurlwModal", () => {
	return {
		useAskSweepLnurlw: () => mockAskSweepLnurlw,
	};
});

// app state from redux selectors
const mockDispatch = vi.fn();
let mockIsActive = true;
let mockSeenAssets: string[] = [];

vi.mock("@/State/store/hooks", () => {
	return {
		useAppDispatch: () => mockDispatch,
		useAppSelector: (selectorFn: any) =>
			selectorFn({
				runtime: { isActive: mockIsActive },
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


let warnedMockVal = false;
const mockUpdateWarned = vi.fn();

vi.mock("@/Hooks/useLocalStorage/useLocalStorage", () => {
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
	mockAskClipboardDetected.mockReset();
	mockAskSweepLnurlw.mockReset();
	mockClipboardRead.mockReset();
	mockIdentifyBitcoinInput.mockReset();
	mockParseBitcoinInput.mockReset();
	mockUpdateWarned.mockClear();

	mockAskClipboardDetected.mockResolvedValue(true);
	mockAskSweepLnurlw.mockResolvedValue(undefined);

	mockIsActive = true;
	mockSeenAssets = [];


	warnedMockVal = false;

	mockForeground();
});

afterEach(() => {
	vi.clearAllTimers();
});



describe("useWatchClipboard happy path", () => {
	it("reads clipboard, confirms, and on confirm sweeps lnurl-w + dispatches addAsset", async () => {
		const clipboardText = "lnurl1heylisten";
		const parsedLnurlW = {
			type: InputClassification.LNURL_WITHDRAW,
			data: "withdraw-data",
		};

		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: clipboardText,
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LNURL_WITHDRAW,
			value: clipboardText,
		});

		mockParseBitcoinInput.mockResolvedValue(parsedLnurlW);

		renderHarness();

		await act(async () => {
			// let the initial throttle (50ms) fire
			vi.advanceTimersByTime(60);
			// let pending promises flush
			await Promise.resolve();
		});

		expect(mockAskClipboardDetected).toHaveBeenCalledTimes(1);
		expect(mockAskClipboardDetected.mock.calls[0][0]).toEqual({ value: clipboardText });

		await act(async () => {
			await Promise.resolve();
		});

		// addAsset dispatched
		expect(mockDispatch).toHaveBeenCalledWith({
			type: "generatedAssets/addAsset",
			payload: { asset: clipboardText },
		});

		expect(mockAskSweepLnurlw).toHaveBeenCalledTimes(1);
		expect(mockAskSweepLnurlw).toHaveBeenCalledWith(parsedLnurlW);
		expect(mockPush).not.toHaveBeenCalled();

		// because warnedMockVal started false, we should NOT have asked to reset warned
		expect(mockUpdateWarned).not.toHaveBeenCalledWith(false);
	});

	it("reads clipboard, shows detect modal, and on cancel still dispatches addAsset but does not navigate", async () => {
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

		mockAskClipboardDetected.mockResolvedValue(null);

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockAskClipboardDetected).toHaveBeenCalledTimes(1);

		await act(async () => {
			await Promise.resolve();
		});

		// addAsset still dispatched
		expect(mockDispatch).toHaveBeenCalledWith({
			type: "generatedAssets/addAsset",
			payload: { asset: clipboardText },
		});

		// but we did NOT navigate
		expect(mockPush).not.toHaveBeenCalled();
		expect(mockAskSweepLnurlw).not.toHaveBeenCalled();
	});

	it("parses noffer and navigates to send with parsed input", async () => {
		const noffer = "noffer1qqsrf5h4ya83jk8u6t9jgc76h6kalz3plp9vusjpm2ygqgalqhxgp9gpr9mhxue69uhhyetvv9ujumrfva58gmnfdenjuur4vgpp2ctywejkuar4wfhh2um5dae8gmmfwdjnqdsrqypqqudzmz";
		const parsedNoffer = {
			type: InputClassification.NOFFER,
			data: noffer,
			noffer: { offer: "abc", pubkey: "pk", relay: "wss://relay.example" },
		};

		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: noffer,
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.NOFFER,
			value: noffer,
		});

		mockParseBitcoinInput.mockResolvedValue(parsedNoffer);

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		await act(async () => {
			await Promise.resolve();
		});

		expect(mockParseBitcoinInput).toHaveBeenCalledWith(noffer, InputClassification.NOFFER);
		expect(mockPush).toHaveBeenCalledWith({
			pathname: "/send",
			state: { parsed: parsedNoffer },
		});
	});
});

describe("useWatchClipboard guards", () => {
	it("does nothing if app is not active", async () => {
		mockIsActive = false;

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
		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
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
		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
	});

	it("does nothing if classification is a chain address", async () => {
		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: "bc1qxyz",
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.UNKNOWN,
			value: "bc1qxyz",
		});

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockIdentifyBitcoinInput).toHaveBeenCalledWith("bc1qxyz", {
			disallowed: [InputClassification.BITCOIN_ADDRESS],
		});
		expect(mockShowAlert).not.toHaveBeenCalled();
		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
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
		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
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
		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});
});

describe("clipboard permission warning ('warned') behavior", () => {
	it("on first NotAllowedError and warned=false: shows clipboard access alert and sets warned=true", async () => {
		mockClipboardRead.mockRejectedValue({ name: "NotAllowedError" });

		const alertResult = Promise.resolve({ role: "cancel" });
		mockShowAlert.mockReturnValue(alertResult);

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockShowAlert).toHaveBeenCalledTimes(1);
		const cfg = mockShowAlert.mock.calls[0][0];
		expect(cfg.header).toMatch(/Clipboard access blocked/i);
		expect(mockUpdateWarned).toHaveBeenCalledWith(true);
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
		mockAskClipboardDetected.mockResolvedValue(null);

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		// since warnedMockVal was true, we expect the hook to call updateWarned(false)
		// right after a successful Clipboard.read
		expect(mockUpdateWarned).toHaveBeenCalledWith(false);

		expect(mockAskClipboardDetected).toHaveBeenCalledTimes(1);

		await act(async () => {
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

describe("useWatchClipboard app active handling", () => {
	it("re-checks clipboard on window focus after the throttle", async () => {
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

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockAskClipboardDetected).toHaveBeenCalledTimes(1);

		await act(async () => {
			await Promise.resolve();
		});

		expect(mockAskSweepLnurlw).toHaveBeenCalledTimes(1);

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

		mockAskClipboardDetected.mockResolvedValueOnce(null);

		await act(async () => {
			vi.advanceTimersByTime(500);
			window.dispatchEvent(new Event("focus"));
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		await act(async () => {
			await Promise.resolve();
		});

		expect(mockAskClipboardDetected).toHaveBeenCalledTimes(2);
		expect(mockDispatch).toHaveBeenCalledWith({
			type: "generatedAssets/addAsset",
			payload: { asset: "lnbc2500fresh" },
		});
	});
});
