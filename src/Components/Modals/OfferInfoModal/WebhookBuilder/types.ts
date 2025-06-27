import { Expression } from "uri-template/dist/ast";

interface URLComponentBase {
	start: number;
	end: number;
}

interface URLComponentTemplate extends URLComponentBase {
	type: "template";
	node: Expression;
}
interface URLComponentNonTemplate extends URLComponentBase {
	type: "scheme" | "host" | "path" | "query" | "fragment";
	value: string;
}

export type URLComponent = URLComponentTemplate | URLComponentNonTemplate;




interface MergeInsertion {
	kind: "merge";
	type: "path" | "query";
	node: Expression;
}
interface InsertInsertion {
	kind: "insert";
	type: "path" | "query";
	position: number;
}

export type InsertionMode = MergeInsertion | InsertInsertion
