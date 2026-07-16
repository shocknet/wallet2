import {
	IonButtons,
	IonHeader,
	IonToolbar,
	useIonRouter,
} from "@ionic/react";
import { useEffect, useState } from "react";
import {
	WALLET_AVATAR_HEIGHT,
	useWalletAvatar,
} from "@/Assets/Images/wallet-avatar";
import SourcesStatusIndicator from "@/Components/SourcesStatusIndicator";
import { ProfileMenuButton } from "../ProfileMenuButton";

const HomeHeader = ({ children }: { children?: React.ReactNode }) => {
	const router = useIonRouter();
	const logoSrc = useWalletAvatar();

	const [logoClickCounter, setLogoClickCounter] = useState(0);
	useEffect(() => {
		let singleClickTimer: NodeJS.Timeout;
		let tripeClickTimer: NodeJS.Timeout;
		if (logoClickCounter === 1) {
			singleClickTimer = setTimeout(() => {
				router.push("/home", "back");
				setLogoClickCounter(0);
			}, 500);
		} else {
			if (logoClickCounter === 3) {
				router.push("/metrics", "forward");
			}
			tripeClickTimer = setTimeout(() => {
				setLogoClickCounter(0);
			}, 500);
		}
		return () => {
			clearTimeout(singleClickTimer);
			clearTimeout(tripeClickTimer);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [logoClickCounter]);

	return (
		<IonHeader className="ion-no-border">
			<IonToolbar>
				<IonButtons slot="start">
					<button
						type="button"
						aria-label="Home"
						onClick={() => setLogoClickCounter((prev) => prev + 1)}
						style={{
							background: "none",
							border: "none",
							padding: "0 8px",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
						}}
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
				</IonButtons>
				<IonButtons slot="end">
					<SourcesStatusIndicator />
					<ProfileMenuButton />
				</IonButtons>
			</IonToolbar>
			{children}
		</IonHeader>
	);
};

export default HomeHeader;
