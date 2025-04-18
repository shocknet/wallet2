import { Satoshi } from "./units";

export interface DecodedInvoice {
	amount: Satoshi;
	description?: string;
}