import { TOKEN_RX } from "./utils";

export const highlightUrl = (url: string, invalidTokens = new Set<string>) => {
	const parts: JSX.Element[] = [];
	let last = 0,
		idx = 0;
	for (const m of url.matchAll(TOKEN_RX)) {
		const [full, tok] = m;
		const start = m.index ?? 0;
		if (start > last)
			parts.push(<span key={`t-${idx++}`}>{url.slice(last, start)}</span>);
		parts.push(
			<span
				key={`v-${idx++}`}
				style={{ color: invalidTokens.has(tok) ? "var(--ion-color-danger)" : "#2aabe1" }}
			>
				%{`[${tok}]`}
			</span>
		);
		last = start + full.length;
	}
	if (last < url.length) parts.push(<span key="tail">{url.slice(last)}</span>);
	return parts;
};
