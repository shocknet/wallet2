import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DashDialogProps = {
	title: string;
	onClose: () => void;
	children: ReactNode;
	footer?: ReactNode;
};

export function DashDialog({ title, onClose, children, footer }: DashDialogProps) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	return createPortal(
		<div className="pub-dash dash-dialog-backdrop" onClick={onClose}>
			<div
				className="dash-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="dash-dialog-title"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="dash-dialog-head">
					<h2 id="dash-dialog-title">{title}</h2>
					<button type="button" className="dash-dialog-x" onClick={onClose} aria-label="Close">
						×
					</button>
				</div>
				<div className="dash-dialog-body">{children}</div>
				{footer && <div className="dash-dialog-foot">{footer}</div>}
			</div>
		</div>,
		document.body
	);
}
