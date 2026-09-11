import { createElement, useCallback, useContext, useRef, type ComponentType, type ContextType, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { ReactReduxContext } from "react-redux";

type OverlayHandlers = {
	onDidPresent?: () => void;
	onDidDismiss?: (ev: { detail: { data: unknown; role?: string } }) => void;
};

function wrapWithRedux(node: ReactNode, redux: ContextType<typeof ReactReduxContext>) {
	if (!redux) return node;
	return createElement(ReactReduxContext.Provider, { value: redux }, node);
}

export function useIonModal(Host: ComponentType<object>, componentProps?: object) {
	const redux = useContext(ReactReduxContext);
	const openRef = useRef(false);
	const optionsRef = useRef<OverlayHandlers | null>(null);
	const rootRef = useRef<Root | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const present = useCallback((options: OverlayHandlers = {}) => {
		if (openRef.current) return;
		openRef.current = true;
		optionsRef.current = options;
		const container = document.createElement("div");
		containerRef.current = container;
		document.body.appendChild(container);
		const root = createRoot(container);
		rootRef.current = root;
		flushSync(() => {
			root.render(wrapWithRedux(createElement(Host, componentProps), redux));
		});
		options.onDidPresent?.();
	}, [Host, componentProps, redux]);

	const dismiss = useCallback((data?: unknown, role?: string) => {
		if (!openRef.current) return Promise.resolve();
		const opts = optionsRef.current;
		openRef.current = false;
		optionsRef.current = null;
		flushSync(() => {
			rootRef.current?.unmount();
		});
		rootRef.current = null;
		containerRef.current?.remove();
		containerRef.current = null;
		opts?.onDidDismiss?.({ detail: { data, role } });
		return Promise.resolve();
	}, []);

	return [present, dismiss] as const;
}
