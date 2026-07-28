import { useWalletAvatar, WALLET_AVATAR_HEIGHT } from "@/Assets/Images/wallet-avatar";
import { ComponentProps } from "react";


function LogoButton({ onClick }: ComponentProps<"button">) {
	const logoSrc = useWalletAvatar();

	return (
		<button
			aria-label="Home"
			style={{
				background: "none",
				border: "none",
				padding: "0 8px",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
			}}
			onClick={onClick}
		>
			<img
				src={logoSrc}
				alt="Shockwallet"
				style={{
					display: "block",
					height: WALLET_AVATAR_HEIGHT.nav,
					width: "auto",
				}}
			/>
		</button>
	)
}

export default LogoButton;
