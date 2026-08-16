import { useGetLnurlPayQuery } from "@/State/api/api";
import { Avatar, type AvatarProps } from "@/Components/Avatar";

export type LightningAddressAvatarProps = Omit<
	AvatarProps,
	"id" | "avatarUrl" | "beacon"
> & {
	address: string;
};


export function LightningAddressAvatar({
	address,
	...avatarProps
}: LightningAddressAvatarProps) {
	const trimmed = address.trim();
	const { data } = useGetLnurlPayQuery(
		{ address: trimmed },
		{ skip: trimmed.length === 0 },
	);

	const avatarUrl = data?.image?.trim() || undefined;

	return <Avatar id={trimmed || "lnaddr"} avatarUrl={avatarUrl} {...avatarProps} />;
}
