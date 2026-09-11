import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { useWatchClipboard } from "./useWatchClipboard";
import { addAsset } from "@/State/Slices/generatedAssets";

vi.useFakeTimers();

const LNURL = "lnurl1" + "p".repeat(12);
const INVOICE = "lnbc1" + "q".repeat(10);
const BTC_ADDRESS = "bc1p" + "q".repeat(12);

function Harness() {
	useWatchClipboard();
	return null;
}

const mockClipboardRead = vi.fn();
vi.mock("@capacitor/clipboard", () => ({
	Clipboard: {
		read: (...args: unknown[]) => mockClipboardRead(...args),
	},
}));

const mockShowNotice = vi.fn();
vi.mock("@/Components/prompt", () => ({
	usePromptNoticeModal: () => mockShowNotice,
}));

const mockAskClipboardDetected = vi.fn();
vi.mock("@/Components/Modals/ClipboardDetectedModal", () => ({
	useClipboardDetectedModal: () => mockAskClipboardDetected,
}));

const mockResolveAppIntent = vi.fn();
vi.mock("@/intents/resolve", () => ({
	resolveAppIntent: (raw: string) => mockResolveAppIntent(raw),
}));

const mockDispatch = vi.fn();
let mockIsActive = true;
let mockSeenAssets: string[] = [];
let mockPendingIntent: unknown = null;

vi.mock("@/State/store/hooks", () => ({
	useAppDispatch: () => mockDispatch,
	useAppSelector: (selector: (state: unknown) => unknown) =>
		selector({
			runtime: { isActive: mockIsActive },
			generatedAssets: { assets: mockSeenAssets },
			shell: { pendingIntent: mockPendingIntent },
		}),
}));

let warned = false;
const mockSetWarned = vi.fn((next: boolean) => {
	warned = next;
});
vi.mock("@/Hooks/useLocalStorage/useLocalStorage", () => ({
	useLocalStorage: () => [warned, mockSetWarned] as const,
}));

function overlayDismissed(role: "confirm" | "cancel") {
	return {
		status: "dismissed" as const,
		value: { role },
	};
}

const skipped = { status: "skipped" as const };

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

async function flushScheduledCheck() {
	await act(async () => {
		vi.advanceTimersByTime(50);
	});
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
	});
}

beforeEach(() => {
	mockDispatch.mockReset();
	mockShowNotice.mockReset();
	mockAskClipboardDetected.mockReset();
	mockClipboardRead.mockReset();
	mockResolveAppIntent.mockReset();
	mockSetWarned.mockClear();

	mockResolveAppIntent.mockReturnValue({ type: "intents/resolveAppIntent" });
	mockAskClipboardDetected.mockResolvedValue(overlayDismissed("confirm"));
	mockShowNotice.mockResolvedValue(overlayDismissed("confirm"));

	mockIsActive = true;
	mockSeenAssets = [];
	mockPendingIntent = null;
	warned = false;
	mockForeground();
});

afterEach(() => {
	vi.clearAllTimers();
});

describe("useWatchClipboard", () => {
	it("asks about a recognized clipboard value, then resolves it and remembers it", async () => {
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: LNURL });

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockAskClipboardDetected).toHaveBeenCalledWith({ value: LNURL });
		expect(mockResolveAppIntent).toHaveBeenCalledWith(LNURL);
		expect(mockDispatch).toHaveBeenCalledWith({ type: "intents/resolveAppIntent" });
		expect(mockDispatch).toHaveBeenCalledWith(addAsset({ asset: LNURL }));
	});

	it("remembers a declined value without resolving an intent", async () => {
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: INVOICE });
		mockAskClipboardDetected.mockResolvedValue(overlayDismissed("cancel"));

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockAskClipboardDetected).toHaveBeenCalledWith({ value: INVOICE });
		expect(mockResolveAppIntent).not.toHaveBeenCalled();
		expect(mockDispatch).toHaveBeenCalledWith(addAsset({ asset: INVOICE }));
	});

	it("does not remember or resolve when the clipboard ask is skipped", async () => {
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: LNURL });
		mockAskClipboardDetected.mockResolvedValue(skipped);

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockAskClipboardDetected).toHaveBeenCalledTimes(1);
		expect(mockResolveAppIntent).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
	});

	it("does not read the clipboard when the app is inactive", async () => {
		mockIsActive = false;
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: LNURL });

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockClipboardRead).not.toHaveBeenCalled();
		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
	});

	it("does not read the clipboard when an intent is already queued", async () => {
		mockPendingIntent = { kind: "add-source" };
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: LNURL });

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockClipboardRead).not.toHaveBeenCalled();
		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
	});

	it("does not ask after a pending intent arrives during Clipboard.read", async () => {
		let finishRead: ((value: { type: string; value: string }) => void) | undefined;
		mockClipboardRead.mockReturnValue(
			new Promise((resolve) => {
				finishRead = resolve;
			}),
		);

		const view = render(<Harness />);
		await act(async () => {
			vi.advanceTimersByTime(50);
		});
		expect(mockClipboardRead).toHaveBeenCalledTimes(1);

		mockPendingIntent = { kind: "send" };
		view.rerender(<Harness />);

		await act(async () => {
			finishRead?.({ type: "text/plain", value: LNURL });
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
		expect(mockResolveAppIntent).not.toHaveBeenCalled();
	});

	it("ignores unrecognized clipboard text", async () => {
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: "hello world" });

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
	});

	it("ignores bitcoin addresses", async () => {
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: BTC_ADDRESS });

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
	});

	it("does not ask about a value that was already seen", async () => {
		mockSeenAssets = [LNURL];
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: `lightning:${LNURL}` });

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
	});

	it("ignores clipboard errors other than NotAllowedError", async () => {
		mockClipboardRead.mockRejectedValue(new Error("nope"));

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockShowNotice).not.toHaveBeenCalled();
		expect(mockAskClipboardDetected).not.toHaveBeenCalled();
	});

	it("explains a blocked clipboard once, then sets warned", async () => {
		mockClipboardRead.mockRejectedValue({ name: "NotAllowedError" });

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockShowNotice).toHaveBeenCalledTimes(1);
		expect(mockShowNotice.mock.calls[0][0]).toMatchObject({
			title: "Clipboard access blocked",
		});
		expect(mockSetWarned).toHaveBeenCalledWith(true);
	});

	it("does not set warned when the blocked-access notice is skipped", async () => {
		mockClipboardRead.mockRejectedValue({ name: "NotAllowedError" });
		mockShowNotice.mockResolvedValue(skipped);

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockShowNotice).toHaveBeenCalledTimes(1);
		expect(mockSetWarned).not.toHaveBeenCalled();
	});

	it("does not explain a blocked clipboard again after warned", async () => {
		warned = true;
		mockClipboardRead.mockRejectedValue({ name: "NotAllowedError" });

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockShowNotice).not.toHaveBeenCalled();
		expect(mockSetWarned).not.toHaveBeenCalled();
	});

	it("clears warned after a successful clipboard read", async () => {
		warned = true;
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: LNURL });
		mockAskClipboardDetected.mockResolvedValue(overlayDismissed("cancel"));

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockSetWarned).toHaveBeenCalledWith(false);
		expect(mockAskClipboardDetected).toHaveBeenCalledTimes(1);
	});

	it("shows a notice when resolving the clipboard value throws", async () => {
		vi.spyOn(console, "error").mockImplementation(() => { });
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: LNURL });
		mockDispatch.mockImplementation((action: unknown) => {
			if (
				action &&
				typeof action === "object" &&
				"type" in action &&
				action.type === "intents/resolveAppIntent"
			) {
				return Promise.reject(new Error("bad invoice"));
			}
			return action;
		});

		render(<Harness />);
		await flushScheduledCheck();

		expect(mockShowNotice).toHaveBeenCalledWith({
			title: "Error",
			description: "bad invoice",
		});
		expect(mockDispatch).not.toHaveBeenCalledWith(addAsset({ asset: LNURL }));
	});

	it("checks again on window focus after the throttle", async () => {
		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: LNURL });

		render(<Harness />);
		await flushScheduledCheck();
		expect(mockAskClipboardDetected).toHaveBeenCalledTimes(1);

		mockClipboardRead.mockResolvedValue({ type: "text/plain", value: INVOICE });
		mockAskClipboardDetected.mockResolvedValue(overlayDismissed("cancel"));

		await act(async () => {
			vi.advanceTimersByTime(500);
			window.dispatchEvent(new Event("focus"));
			vi.advanceTimersByTime(50);
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(mockAskClipboardDetected).toHaveBeenCalledTimes(2);
		expect(mockAskClipboardDetected).toHaveBeenLastCalledWith({ value: INVOICE });
	});
});
