import { useEffect, useRef } from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OverlayCoordinator, useOverlayCoordinator } from "./OverlayCoordinator";
import { type Dismiss, type OverlayResult, type Present, type TryPresent } from "./types";

vi.mock("@ionic/react", () => import("./ionicHooks.mock"));

type ConfirmDismiss = Dismiss<OverlayResult<"confirm">>;

type OverlayApi = {
	present: Present;
	tryPresent: TryPresent;
};

function Probe({ onReady }: { onReady: (api: OverlayApi) => void }) {
	const api = useOverlayCoordinator();
	const ready = useRef(onReady);
	ready.current = onReady;
	useEffect(() => {
		ready.current({
			present: api.present,
			tryPresent: api.tryPresent,
		});
	}, [api.present, api.tryPresent]);
	return null;
}

function renderCoordinator() {
	let api: OverlayApi | undefined;
	render(
		<OverlayCoordinator>
			<Probe onReady={(next) => { api = next; }} />
		</OverlayCoordinator>,
	);
	if (!api) {
		throw new Error("overlay api not ready");
	}
	return api;
}

async function flush() {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
	});
}

describe("OverlayCoordinator", () => {
	it("tryPresent returns skipped when occupied", async () => {
		const { present, tryPresent } = renderCoordinator();
		let dismissFirst: ConfirmDismiss | undefined;

		const first = present<OverlayResult<"confirm">>((dismiss) => {
			dismissFirst = dismiss;
			return null;
		});

		await flush();

		await expect(tryPresent(() => null)).resolves.toEqual({ status: "skipped" });

		await act(async () => {
			dismissFirst?.({ role: "confirm" });
		});
		await expect(first).resolves.toEqual({ role: "confirm" });
	});

	it("keeps the coordinator available inside the presented overlay", async () => {
		const { present } = renderCoordinator();
		let dismissFirst: ConfirmDismiss | undefined;

		const shown = present<OverlayResult<"confirm">>((dismiss) => {
			dismissFirst = dismiss;
			return <Probe onReady={() => { }} />;
		});
		await flush();

		await act(async () => {
			dismissFirst?.({ role: "confirm" });
		});
		await expect(shown).resolves.toEqual({ role: "confirm" });
	});

	it("present throws when the slot is occupied", async () => {
		const { present, tryPresent } = renderCoordinator();
		let dismissFirst: ConfirmDismiss | undefined;

		const first = tryPresent<OverlayResult<"confirm">>((dismiss) => {
			dismissFirst = dismiss;
			return null;
		});
		await flush();

		await expect(present(() => null)).rejects.toThrow(/slot is occupied/);
		await expect(tryPresent(() => null)).resolves.toEqual({ status: "skipped" });

		await act(async () => {
			dismissFirst?.({ role: "confirm" });
		});
		await expect(first).resolves.toEqual({
			status: "dismissed",
			value: { role: "confirm" },
		});
	});
});
