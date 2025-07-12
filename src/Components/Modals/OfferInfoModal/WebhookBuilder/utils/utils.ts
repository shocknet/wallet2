import { Expression, Template } from "uri-template/dist/ast";
import { Pieces } from "../types";
import { parse } from "uri-template";


export const TOKEN_RX = /%\[([A-Za-z0-9_-]+)\]/g;
export const BUILT_INS = ["invoice", "amount"];






export type Phase = 'initial' | 'live';


export interface TemplateStatus {
	ok: boolean;          // template passes all rules
	fatal: boolean;       // builder must switch to raw-input
	pieces: Pieces;
	flags: ValidationFlags;
}

export interface ValidationFlags {
	syntaxErr?: string;
	operatorErr?: string;
	interleaveErr?: string;     // literal between two expressions
	pathAfterQuery?: string;
	duplicateQmark?: string;
	unknownVars?: string[];
	protocolErr?: string;
	forceSSLErr?: string;
	noBaseUrl?: string;
	noExpression?: string; // no expressions at all
}

export function parseAndValidate(
	raw: string,
	allowed: string[],
	forceSSL?: boolean,
	phase: Phase = 'initial'
): TemplateStatus {
	const flags: ValidationFlags = {};

	let parsed: ReturnType<typeof parse> | null = null;
	const pieces: Pieces = emptyPieces();

	try {
		parsed = parse(raw);
		pieces.ast = parsed.ast as Template;
	} catch {
		flags.syntaxErr = "Invalid template syntax";
		return { ok: false, fatal: true, pieces, flags };
	}


	let hitTemplate = false;



	let seenQueryExpr = false;
	let literalSinceExpr = false;




	(parsed.ast as Template).parts.forEach(p => {
		if (p.type === "literal") {
			if (!hitTemplate) pieces.baseUrl += p.value;
			if (hitTemplate && p.value.trim() !== "") literalSinceExpr = true;
		} else {
			const expr = p as Expression;

			/* unsupported operator */
			if (!['/', '?', '&'].includes(expr.operator)) {
				flags.operatorErr = `Operator "${expr.operator}" is unsupported`;
			}

			/* expression after a non-empty literal that followed a previous expr */
			if (literalSinceExpr) flags.interleaveErr = 'Cannot have literal text between template expressions';


			/* path / query classification */
			if (expr.operator === '/' /* path expr */) {
				if (seenQueryExpr) flags.pathAfterQuery = 'Path templates cannot follow query';
				if (!pieces.pathTemplate) pieces.pathTemplate = expr;
				else pieces.pathTemplate.variables.push(...expr.variables);
			} else {                         /* '?' or '&' */
				seenQueryExpr = true;
				if (!pieces.queryTemplate) pieces.queryTemplate = expr;
				else pieces.queryTemplate.variables.push(...expr.variables);
			}



			hitTemplate = true;
			literalSinceExpr = false; // reset for next iteration
		}
	});





	/* duplicate ? operator  */
	if (pieces.baseUrl.includes('?') && pieces.queryTemplate?.operator === '?') {
		flags.duplicateQmark = 'Use "{&var}" when base already contains "?"';
	}

	if (!pieces.baseUrl.includes('?') && pieces.queryTemplate?.operator === '&') {
		flags.duplicateQmark = 'Use "{?var}" when base does not contain "?"';
	}





	if ((pieces.baseUrl.includes('?') && pieces.pathTemplate)) {
		flags.pathAfterQuery = 'Path templates cannot follow query';
	}



	// Return if raw url has templates that aren't from the allowed list
	const unknown = new Set<string>();
	for (const e of [pieces.pathTemplate, pieces.queryTemplate]) {
		if (e) {
			e.variables.forEach(v => {
				if (!allowed.includes(v.name)) unknown.add(v.name);
			});
		}
	}
	if (unknown.size !== 0) flags.unknownVars = [...unknown];


	const sample: Record<string, string> = {};
	[...unknown, ...allowed].forEach(k => (sample[k] = `[${k}]`));




	if (pieces.baseUrl.trim() === "") {
		flags.noBaseUrl = 'Base URL is required';
	} else if (!/^\w+:\/\//.test(pieces.baseUrl)) {
		flags.protocolErr = 'Base URL must include http:// or https://';
	} else {
		try {
			const u = new URL(pieces.baseUrl);

			if (u.protocol === 'http:' && forceSSL) {
				// Either no protocol supplied, or http while SSL forced
				flags.protocolErr = 'Base must start with https:// (Force SSL enabled)'

			} else if (!['http:', 'https:'].includes(u.protocol)) {
				flags.protocolErr = `Unsupported protocol "${u.protocol}"`;
			}
		} catch {
			flags.protocolErr = "Base part is not a valid URL";
		}
	}

	if (pieces.baseUrl && !pieces.pathTemplate && !pieces.queryTemplate) {
		flags.noExpression = "Template must contain at least one expression (path or query)";
	}

	const fatal =
		flags.syntaxErr ||
		flags.operatorErr ||
		flags.interleaveErr ||
		(phase === 'initial' && (flags.pathAfterQuery || flags.duplicateQmark));


	const ok = !(
		flags.noExpression ||
		flags.noBaseUrl ||
		flags.syntaxErr ||
		flags.operatorErr ||
		flags.interleaveErr ||
		flags.pathAfterQuery ||
		flags.duplicateQmark ||
		flags.unknownVars ||
		flags.protocolErr ||
		flags.forceSSLErr
	);

	return { ok, fatal: !!fatal, pieces, flags }



}


export function emptyPieces(): Pieces {
	return { baseUrl: '', pathTemplate: null, queryTemplate: null, ast: null };
}
export function buildTemplate({ baseUrl, pathTemplate, queryTemplate }: Pieces): string {
	const pathPart = stringifyExpression(pathTemplate);
	const queryPart = stringifyExpression(queryTemplate);

	return baseUrl + pathPart + queryPart;
}


export function stringifyExpression(expr: Expression | null): string {
	return expr ? `{${expr.operator}${expr.variables.map(v => v.name).join(",")}}` : "";
}



export const makeExpr = (operator: '/' | '?' | '&', key: string): Expression =>
	(parse(`{${operator}${key}}`).ast.parts[0] as Expression); // parts[0] because literal "" is not present

export function removeAt<T>(arr: T[], idx: number): T[] {
	return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
}
