import QrCode from "@/Components/QrCode";

export function ReceiveQr({
	value,
	prefix,
}: {
	value: string;
	prefix?: string;
}) {
	return (
		<div className="w-full max-w-[22rem] sm:max-w-[24rem]">
			<QrCode value={value} prefix={prefix} />
		</div>
	);
}
