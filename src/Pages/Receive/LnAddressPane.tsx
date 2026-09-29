import { ExpandablePayload } from "./ExpandablePayload";
import { ReceivePane } from "./ReceivePane";
import { ReceiveQr } from "./ReceiveQr";

export function LnAddressPane({ value }: { value: string }) {
	return (
		<ReceivePane>

			<ReceiveQr value={value} prefix="lightning" />
			<ExpandablePayload value={value} />

		</ReceivePane>
	);
}
