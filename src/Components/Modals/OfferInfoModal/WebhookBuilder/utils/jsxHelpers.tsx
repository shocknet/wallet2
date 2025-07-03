import { expandExpression, parse } from "uri-template";
import { Expression, Literal } from "uri-template/dist/ast";
import { stringifyExpression } from "./utils";


export function highlightExpanded(
	ast: ReturnType<typeof parse>["ast"] | null,
	sampleValues: Record<string, string>,
): JSX.Element[] {
	if (!ast) return [];

	const parts: JSX.Element[] = [];

	const first = ast.parts[0];
	if (
		first?.type === 'literal' &&
		!/^\w+:\/\//.test(first.value)       // no scheme
	) {
		parts.push(
			<span key="scheme">https://</span>
		);
	}

	ast.parts.forEach((p, idx) => {
		if (p.type === "literal") {
			parts.push(<span key={`lit-${idx}-${p.value}`}>{(p as Literal).value}</span>);
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
