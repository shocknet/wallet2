import { describe, it, beforeEach, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter as Router } from "react-router-dom";
import { useWatchClipboard } from "./useWatchClipboard";
import { InputClassification } from "../types/parse";

// Render the hook in a react component
function Harness() {
	useWatchClipboard();
	return null;
}

// ---  mocks ---

const mockRemove = vi.fn();
vi.mock("@capacitor/app", () => {
	return {
		App: {
			addListener: vi.fn(() =>
				Promise.resolve({
					remove: mockRemove,
				})
			),
		},
	};
});


const mockClipboardRead = vi.fn();
vi.mock("@capacitor/clipboard", () => {
	return {
		Clipboard: {
			read: () => mockClipboardRead(),
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
	// get the real MemoryRouter, etc.
	const actual: any = await orig();
	return {
		...actual,
		useHistory: () => ({
			push: mockPush,
		}),
	};
});

// truncateTextMiddle mock – deterministic
vi.mock("../format", () => {
	return {
		truncateTextMiddle: (v: string, _len: number) => `TRUNC(${v})`,
	};
});

// Redux hooks mock
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

// addAsset action mock
vi.mock("@/State/Slices/generatedAssets", () => {
	return {
		addAsset: ({ asset }: { asset: string }) => ({
			type: "generatedAssets/addAsset",
			payload: { asset },
		}),
	};
});

// Dynamic import of '@/lib/parse' is mocked
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

// we need fake timers because the hook debounces checkClipboard by 50ms
// and schedules kickCheckSoon() on mount.
vi.useFakeTimers();


function renderHarness() {
	return render(
		<Router>
			<Harness />
		</Router>
	);
}

// utility: make the document look "active"
function mockAppIsForeground() {
	// jsdom doesn't define document.hasFocus() usefully, so patch it
	Object.defineProperty(document, "hasFocus", {
		value: () => true,
		configurable: true,
	});

	// jsdom sets visibilityState="visible" by default? It may, but let's guarantee.
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

	mockBootstrapped = true;
	mockSeenAssets = [];
});

afterEach(() => {
	vi.clearAllTimers();
	vi.useRealTimers();
	// then go back to fake for next test
	vi.useFakeTimers();
});

describe("useWatchClipboard", () => {
	it("on mount schedules clipboard check and shows alert for new interesting clipboard content", async () => {
		mockAppIsForeground();

		const clipboardText = "lnurl1abc123";

		// mock clipboard reading
		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: clipboardText,
		});

		// mock classification: real bitcoiny thing
		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LNURL_WITHDRAW,
			value: clipboardText,
		});

		// mock parseBitcoinInput for 'Yes' button later
		mockParseBitcoinInput.mockResolvedValue({
			type: InputClassification.LNURL_WITHDRAW,
			data: "parsed-data-here",
		});

		renderHarness();

		// On mount, the hook calls kickCheckSoon(), which sets a timer for 50ms.
		// Let that fire, and let async stuff resolve.
		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		// It should have asked to show an alert
		expect(mockShowAlert).toHaveBeenCalledTimes(1);

		const alertConfig = mockShowAlert.mock.calls[0][0];

		expect(alertConfig.header).toMatch(/Clipboard Detected/i);
		expect(alertConfig.message).toBe(`TRUNC(${clipboardText})`);

		// The alert has Yes and No buttons
		expect(alertConfig.buttons).toHaveLength(2);
		const yesBtn = alertConfig.buttons.find((b: any) => b.text === "Yes");
		expect(yesBtn).toBeTruthy();

		// The alert also has onDidDismiss, which should mark value as seen
		expect(typeof alertConfig.onDidDismiss).toBe("function");

		// Simulate dismiss: this should dispatch addAsset({ asset: clipboardText })
		await act(async () => {
			await alertConfig.onDidDismiss();
		});

		expect(mockDispatch).toHaveBeenCalledWith({
			type: "generatedAssets/addAsset",
			payload: { asset: clipboardText },
		});
	});

	it("does not alert if app is not bootstrapped", async () => {
		mockAppIsForeground();

		mockBootstrapped = false;

		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: "lnurl1zzzz",
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LNURL_WITHDRAW,
			value: "lnurl1zzzz",
		});

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockShowAlert).not.toHaveBeenCalled();
	});

	it("does not alert for UNKNOWN classification", async () => {
		mockAppIsForeground();

		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: "garbage stuff",
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.UNKNOWN,
			value: "garbage stuff",
		});

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockShowAlert).not.toHaveBeenCalled();
	});

	it("does not alert if clipboard value is already in seenAssets", async () => {
		mockAppIsForeground();

		const repeated = "lnurl1repeat";
		mockSeenAssets = [repeated];

		mockClipboardRead.mockResolvedValue({
			type: "text/plain",
			value: repeated,
		});

		mockIdentifyBitcoinInput.mockReturnValue({
			classification: InputClassification.LNURL_WITHDRAW,
			value: repeated,
		});

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		expect(mockShowAlert).not.toHaveBeenCalled();
	});

	it("pressing Yes for LNURL_WITHDRAW navigates to /sources with parsed data", async () => {
		mockAppIsForeground();

		const clipboardText = "lnurl1withdrawme";
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

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		const alertConfig = mockShowAlert.mock.calls[0][0];
		const yesBtn = alertConfig.buttons.find((b: any) => b.text === "Yes");

		await act(async () => {
			await yesBtn.handler();
		});

		expect(mockPush).toHaveBeenCalledTimes(1);
		const navArg = mockPush.mock.calls[0][0];
		expect(navArg.pathname).toBe("/sources");
		expect(navArg.state).toEqual({
			parsedLnurlW: {
				type: InputClassification.LNURL_WITHDRAW,
				data: "withdraw-data",
			},
		});
	});

	it("pressing Yes for non-withdraw navigates to /send with {input: parsed.data}", async () => {
		mockAppIsForeground();

		const clipboardText = "lnbc2500etc";
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
			data: "decoded-invoice",
		});

		renderHarness();

		await act(async () => {
			vi.advanceTimersByTime(60);
			await Promise.resolve();
		});

		const alertConfig = mockShowAlert.mock.calls[0][0];
		const yesBtn = alertConfig.buttons.find((b: any) => b.text === "Yes");

		await act(async () => {
			await yesBtn.handler();
		});

		expect(mockPush).toHaveBeenCalledTimes(1);
		const navArg = mockPush.mock.calls[0][0];
		expect(navArg.pathname).toBe("/send");
		expect(navArg.state).toEqual({
			input: "decoded-invoice",
		});
	});
});
