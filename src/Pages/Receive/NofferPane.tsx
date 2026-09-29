import { ExpandablePayload } from "./ExpandablePayload";
import { ReceivePane } from "./ReceivePane";
import { ReceiveQr } from "./ReceiveQr";

const HEAD = 12;
const TAIL = 12;

export function NofferPane({ value }: { value: string }) {
	return (
		<ReceivePane>
			<ReceiveQr value={value} />
			<ExpandablePayload value={value} head={HEAD} tail={TAIL} />
		</ReceivePane>
	);
}
