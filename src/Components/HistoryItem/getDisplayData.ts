import { InputClassification } from "@/lib/types/parse";
import { SourceOperation } from "@/State/history/types";
import { flash, hourglass, logoBitcoin, radioOutline, trendingDownOutline, trendingUpOutline } from "ionicons/icons";
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


	let typeIcon = flash;
	let typeIconColor = "";


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
			label = operation.memo || operation.invoiceMemo || labelFromLnService || null;
			typeIconColor = "#FFD700";
			break;
		}
		case "ON-CHAIN": {
			label = operation.memo || null;
			typeIcon = logoBitcoin;
			typeIconColor = "#F7931A";
			break;
		}
	}




	let date = moment(operation.paidAtUnix).fromNow();

	if (operation.optimistic) {
		switch (operation.type) {
			case "INVOICE": {
				typeIcon = radioOutline;
				typeIconColor = "#FFD700";
				date = "Pending"
				break;
			}
			case "ON-CHAIN": {
				switch (operation.status) {
					case "broadcasting": {
						typeIcon = radioOutline;
						typeIconColor = "#F7931A";
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
