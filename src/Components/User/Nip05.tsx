import { IonIcon } from "@ionic/react";
import { checkmarkCircle } from "ionicons/icons";
import { useVerifyNip05Query } from "@/State/api/api";

interface Nip05Props {
	pubkey: string;
	nip05: string;
	className?: string;
}

export function Nip05({ pubkey, nip05, className }: Nip05Props) {
	const { data: verified, isFetching } = useVerifyNip05Query({
		pubkey,
		nip05,
	});

	const isVerified = verified === true;
	const isPending = isFetching && verified === undefined;

	return (
		<span
			className={[
				"inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1",
				isVerified
					? "bg-[color-mix(in_srgb,var(--ion-color-success)_14%,transparent)] text-[var(--ion-color-success)]"
					: "bg-[color-mix(in_srgb,var(--app-surface-muted)_90%,transparent)] text-muted",
				className ?? "",
			].join(" ")}
			title={
				isVerified
					? "Verified NIP-05"
					: isPending
						? "Verifying NIP-05"
						: "Unverified NIP-05"
			}
		>
			{isVerified ? (
				<IonIcon
					icon={checkmarkCircle}
					className="shrink-0 text-sm"
					aria-hidden
				/>
			) : null}
			<span
				className={[
					"truncate text-xs tracking-wide",
					isPending ? "animate-pulse" : "",
				].join(" ")}
			>
				{nip05}
			</span>
		</span>
	);
}
