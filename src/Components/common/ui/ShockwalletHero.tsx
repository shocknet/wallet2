import { motion } from "framer-motion";
import {
	WALLET_AVATAR_HEIGHT,
	useWalletWelcomeWordmark,
} from "@/Assets/Images/wallet-avatar";

const sizes = {
	md: {
		wordmark: "mt-4",
	},
	lg: {
		wordmark: "mt-5",
	},
} as const;

export function ShockwalletHero({
	size = "lg",
	tagline,
	className = "",
}: {
	size?: keyof typeof sizes;
	tagline?: string;
	className?: string;
}) {
	const dims = sizes[size];
	const wordmarkSrc = useWalletWelcomeWordmark();

	return (
		<motion.div
			className={`flex flex-col items-center justify-center text-center ${className}`}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
		>
			<div className={dims.wordmark}>
				<img
					src={wordmarkSrc}
					alt="ShockWallet"
					style={{
						display: "block",
						height: WALLET_AVATAR_HEIGHT.welcome,
						width: "auto",
						maxWidth: "100%",
					}}
				/>
			</div>
			{tagline ? (
				<motion.p
					className="mt-4 max-w-sm text-base leading-relaxed tracking-tight text-secondary"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.15, duration: 0.4 }}
				>
					{tagline}
				</motion.p>
			) : null}
		</motion.div>
	);
}
