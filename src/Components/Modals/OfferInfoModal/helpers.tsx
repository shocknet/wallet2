import { parseUrlComponents } from "./utils";

export function highlightUrl(url: string, invalidTokens: Set<string>) {
	// Use parseUrlComponents to get components
	const components = parseUrlComponents(url);
	const parts: JSX.Element[] = [];

	components.forEach(comp => {
		let content = comp.value;
		let isInvalid = false;

		if (comp.type === "template") {
			// Check if template contains invalid tokens
			const tokens = content.split(',').map(t => t.trim());
			isInvalid = tokens.some(t => invalidTokens.has(t));
			content = `{${content}}`;
		}

		parts.push(
			<span
				key={`${comp.start}-${comp.end}`}
				style={{
					color: isInvalid ? "var(--ion-color-danger)" :
						comp.type === "template" ? "#2aabe1" : "inherit"
				}}
			>
				{content}
			</span>
		);
	});

	return parts;
}
