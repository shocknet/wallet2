import { useEffect, useState } from "react";
import { truncateTextMiddle } from "@/lib/format";

export function ExpandablePayload({
	value,
	head,
	tail,
}: {
	value: string;
	head?: number;
	tail?: number;
}) {
	const [fullOpen, setFullOpen] = useState(false);

	useEffect(() => {
		setFullOpen(false);
	}, [value]);

	const shown =
		head != null && tail != null
			? truncateTextMiddle(value, head, tail)
			: value;
	const truncated = shown !== value;

	return (
		<div className="flex w-full max-w-[22rem] flex-col items-center gap-2 sm:max-w-[24rem]">
			{truncated ? (
				<button
					type="button"
					className="
						m-0 max-w-full bg-transparent p-0
						break-all px-2 text-center text-sm leading-snug text-primary
						underline decoration-dotted decoration-muted underline-offset-2
					"
					aria-expanded={fullOpen}
					onClick={() => setFullOpen((open) => !open)}
				>
					{shown}
				</button>
			) : (
				<p className="m-0 max-w-full break-all px-2 text-center text-sm leading-snug text-primary">
					{shown}
				</p>
			)}
			{fullOpen ? (
				<div className="w-full rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
					<p className="code-string m-0 max-h-40 overflow-y-auto break-all whitespace-pre-wrap text-xs leading-5 text-primary select-all">
						{value}
					</p>
				</div>
			) : null}
		</div>
	);
}
