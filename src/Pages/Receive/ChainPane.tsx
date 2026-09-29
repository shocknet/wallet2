import { ExpandablePayload } from "./ExpandablePayload";
import { ReceivePane } from "./ReceivePane";
import { ReceiveQr } from "./ReceiveQr";

export function ChainPane({ value }: { value: string }) {
	return (
		<ReceivePane>
			<ReceiveQr value={value} prefix="bitcoin" />
			<ExpandablePayload value={value} />
		</ReceivePane>
	);
}
