import {
	IonButton,
	IonButtons,
	IonHeader,
	IonImg,
	IonToolbar,
	useIonRouter,
} from "@ionic/react";
import { useEffect, useState } from "react";
import logo from "@/Assets/Images/isolated logo.png";
import SourcesStatusIndicator from "@/Components/SourcesStatusIndicator";
import { ProfileMenuButton } from "../ProfileMenuButton";

const HomeHeader = ({ children }: { children?: React.ReactNode }) => {
	const router = useIonRouter();

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
					<IonButton
						shape="round"
						onClick={() => setLogoClickCounter((prev) => prev + 1)}
					>
						<IonImg
							slot="start"
							src={logo}
							style={{ width: "25px", height: "auto" }}
						/>
					</IonButton>
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
