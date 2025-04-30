import { InputClassification } from "@/lib/types/parse";
import { SourceOperation } from "@/State/history/types";
import { flashOutline, hourglass, linkOutline, radioOutline, trendingDownOutline, trendingUpOutline } from "ionicons/icons";
import moment from "moment";


export interface OperationDisplayData {
	label: string | null;
	date: string
	typeIcon: string;
	typeIconColor: string;
	directionIcon: string;
	color: string;
	sign: string;
}

export const getOperationDisplayData = (operation: SourceOperation): OperationDisplayData => {

	const directionIcon = operation.inbound ? trendingUpOutline : trendingDownOutline;
	const color = operation.inbound ? "success" : "danger";
	const sign = operation.inbound ? "" : "-";



	let label: string | null = null


	let typeIcon = flashOutline;
	const typeIconColor = "#FFD700";


	switch (operation.type) {
		case "INVOICE":
		case "LNURL_WITHDRAW": {
			// For invoices the label is in priority order:
			// 1. operation.memo
			// 2. operation.invoiceMemo
			// 3. invoiceSource.description
			// 4. invoiceSource.identifier
			// 5. invoiceSource.domain
			// 6. invoiceSource.noffer.pubkey
			// 7. invoiceSource.noffer.relay
			// 8. null
			const invoiceSource = operation.invoiceSource;
			const labelFromLnService = invoiceSource !== undefined ?
				invoiceSource.type === InputClassification.LNURL_PAY || invoiceSource.type === InputClassification.LN_ADDRESS ?
					invoiceSource.description || invoiceSource.identifier || invoiceSource.domain :
					invoiceSource?.type === InputClassification.NOFFER ?
						invoiceSource.noffer.pubkey || invoiceSource.noffer.relay
						: null
				: null;
			label = extractInvoiceMemo(operation.memo) || extractInvoiceMemo(operation.invoiceMemo) || labelFromLnService || null;
			break;
		}
		case "USER_TO_USER": {
			label = operation.memo || null;
			break;
		}
		case "ON-CHAIN": {
			label = operation.memo || null;
			typeIcon = linkOutline;
			break;
		}

	}


	let date = moment(operation.paidAtUnix).fromNow();

	if (operation.optimistic) {
		switch (operation.type) {
			case "INVOICE": {
				typeIcon = radioOutline;
				date = "Pending"
				break;
			}
			case "ON-CHAIN": {
				switch (operation.status) {
					case "broadcasting": {
						typeIcon = radioOutline;
						date = "Pending";
						break;
					}
					case "confirming": {
						typeIcon = hourglass;
						break;
					}
				}

			}
		}
	}


	return {
		label,
		date,
		typeIcon,
		typeIconColor,
		directionIcon,
		color,
		sign
	}
}


const extractInvoiceMemo = (description?: string) => {
	if (!description) return null;
	try {
		const parsed = JSON.parse(description);
		if (Array.isArray(parsed)) {
			const plainText = parsed.find(
				(item) => Array.isArray(item) && item[0] === "text/plain"
			);
			if (plainText && typeof plainText[1] === "string") {
				return plainText[1];
			}
		}
	} catch (_) {
		// not JSON, just return the raw description
	}
	return description;
}
