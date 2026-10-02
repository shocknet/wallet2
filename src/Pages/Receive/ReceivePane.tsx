import type { ReactNode } from "react";

export function ReceivePane({ children }: { children: ReactNode }) {
	return (
		<div className="mx-auto h-full w-full max-w-md flex flex-col items-center">
			{children}
		</div>
	);
}
