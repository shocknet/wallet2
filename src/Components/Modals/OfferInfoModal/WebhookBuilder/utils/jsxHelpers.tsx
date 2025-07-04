import { expandExpression, parse } from "uri-template";
import { Expression, Literal } from "uri-template/dist/ast";
import { BUILT_INS, stringifyExpression } from "./utils";


export function expandAndHighlight(raw: string, payerData: string[]): JSX.Element[] | null {

	let parsed: ReturnType<typeof parse> | null = null;

	try {
		parsed = parse(raw);
	} catch {
		return null; // Invalid template syntax
	}
	const keys = new Set([...BUILT_INS, ...payerData]);


	const sample: Record<string, string> = {};
	keys.forEach(k => (sample[k] = `[${k}]`));
	return highlightExpanded(parsed.ast, sample);
}


export function highlightExpanded(
	ast: ReturnType<typeof parse>["ast"] | null,
	sampleValues: Record<string, string>,
): JSX.Element[] {
	if (!ast) return [];

	const parts: JSX.Element[] = [];


	ast.parts.forEach((p, idx) => {
		if (p.type === "literal") {
			parts.push(<span key={`lit-${idx}-${p.value}`} style={{ color: "var(--ion-text-color-step-150)" }}>{(p as Literal).value}</span>);
		} else {
			const seg = decodeURIComponent(expandExpression(p as Expression, sampleValues));
			const id = stringifyExpression(p);
			parts.push(
				<span key={`expr-${id}`} style={{ color: "var(--ion-color-primary)" }}>
					{seg}
				</span>,
			);
		}
	});

	return parts;
}



export function highlightUrlTemplate(
	tpl: string,
	unknownSet?: Set<string>,
): JSX.Element[] {
	const out: JSX.Element[] = [];
	let last = 0;
	let key = 0;

	const rx = /\{([^{}]+?)\}/g;
	let m: RegExpExecArray | null;

	while ((m = rx.exec(tpl)) !== null) {
		const [rawExpr, inner] = m;
		const start = m.index;


		if (start > last) {
			out.push(<span key={key++}>{tpl.slice(last, start)}</span>);
		}


		const vars = inner.replace(/^[+#./;&?]/, "").split(",");
		const isUnknown = unknownSet && vars.some(v => unknownSet.has(v));

		out.push(
			<span
				key={key++}
				style={{
					color: isUnknown
						? "var(--ion-color-danger)"
						: "var(--ion-color-primary)",
				}}
			>
				{rawExpr}
			</span>,
		);

		last = start + rawExpr.length;
	}


	if (last < tpl.length) {
		out.push(<span key={key++}>{tpl.slice(last)}</span>);
	}

	return out;
}
