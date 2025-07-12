import { parse } from "uri-template";
import { Expression } from "uri-template/dist/ast";



export interface Pieces {
	baseUrl: string;
	pathTemplate: Expression | null;
	queryTemplate: Expression | null;
	ast: ReturnType<typeof parse>["ast"] | null;
}
