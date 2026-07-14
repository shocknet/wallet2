import { IonImg } from "@ionic/react";
import { motion } from "framer-motion";
import logo from "@/Assets/Images/isolated logo.png";
import shockwalletText from "@/Assets/Images/wallet_new_text.png";

const sizes = {
	md: {
		logo: "h-12 w-12",
		wordmark: "mt-4 max-w-56",
	},
	lg: {
		logo: "h-16 w-16",
		wordmark: "mt-5 max-w-72",
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

	return (
		<motion.div
			className={`flex flex-col items-center justify-center text-center ${className}`}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
		>
			<div className={dims.logo}>
				<IonImg
					src={logo}
					alt=""
					style={{
						width: "100%",
						height: "auto",
					}}
				/>
			</div>
			<div className={dims.wordmark}>
				<IonImg
					src={shockwalletText}
					alt="ShockWallet"
					className="w-full h-auto object-contain"
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
