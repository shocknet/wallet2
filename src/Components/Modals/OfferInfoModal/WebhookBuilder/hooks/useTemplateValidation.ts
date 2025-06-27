import { useMemo } from "react";
import { parse } from "uri-template";
import { Expression, Literal, Template } from "uri-template/dist/ast";
import { parseNonTemplateParts } from "../utils/utils";
import { highlightExpanded } from "../utils/jsxHelpers";
import { URLComponent } from "../types";

export interface TemplateStatus {
	ok: boolean;
	syntaxOK: boolean;
	httpsOK: boolean;
	unknown: string[];
	expanded: JSX.Element[];
	ast: ReturnType<typeof parse>["ast"] | null;
	components: URLComponent[];
}


export function useTemplateValidation(
	raw: string,
	forceSSL: boolean,
	allowed: string[],
): TemplateStatus {
	return useMemo<TemplateStatus>(() => {

		let parsed: ReturnType<typeof parse> | null = null;
		try {
			parsed = parse(raw);
		} catch {
			return {
				ok: false,
				syntaxOK: false,
				httpsOK: false,
				unknown: [],
				expanded: [],
				ast: null,
				components: [],
			};
		}

		let offset = 0;
		const exprs: URLComponent[] = [];

		(parsed.ast as Template).parts.forEach(p => {
			if (p.type === "literal") {
				exprs.push(...parseNonTemplateParts(p.value, offset));
				offset += (p as Literal).value.length;
			} else {
				const ex = p as Expression;
				const raw = `{${ex.operator}${ex.variables.map(v => v.name).join(",")}}`;
				exprs.push({ type: "template", node: ex, start: offset, end: offset + raw.length });
				offset += raw.length;
			}
		});

		const unknown = new Set<string>();
		parsed.ast.parts.forEach(p => {
			if (p.type === "expression") {
				(p as Expression).variables.forEach(v => {
					if (!allowed.includes(v.name)) unknown.add(v.name);
				});
			}
		});

		const sample: Record<string, string> = {};
		[...unknown, ...allowed].forEach(k => (sample[k] = `[${k}]`));


		const expanded = parsed.expand(sample);
		const highlighted = highlightExpanded(parsed.ast, sample);


		const provisional = /^(https?:)?\/\//i.test(expanded)
			? expanded
			: `https://${expanded}`;
		let httpsOK = true;
		try {
			const u = new URL(provisional);
			httpsOK = !forceSSL || u.protocol === "https:";
		} catch {
			httpsOK = false;
		}

		const ok = unknown.size === 0 && httpsOK;

		return {
			ok,
			syntaxOK: true,
			httpsOK,
			unknown: [...unknown],
			expanded: highlighted,
			ast: parsed.ast,
			components: exprs
		};
	}, [raw, forceSSL, allowed]);
}

