import { WALLET_AVATAR_HEIGHT, useWalletWelcomeWordmark } from "@/Assets/Images/wallet-avatar";

export function ShockwalletHero() {
	const wordmarkSrc = useWalletWelcomeWordmark();

	return (
		<div className="flex flex-col items-center justify-center w-full max-w-md px-4">
			<img
				src={wordmarkSrc}
				alt="Shockwallet"
				style={{
					display: "block",
					height: WALLET_AVATAR_HEIGHT.welcome,
					width: "auto",
					maxWidth: "100%",
				}}
			/>
		</div>
	);
}
