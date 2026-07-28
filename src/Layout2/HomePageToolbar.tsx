import { IonButton, IonButtons, IonIcon, IonTitle, IonToolbar, useIonRouter } from "@ionic/react";
import { notificationsOutline } from "ionicons/icons";
import { ProfileMenuButton } from "./ProfileMenuButton";
import LogoButton from "./LogoButton";
import SourcesStatusIndicator from "@/Components/SourcesStatusIndicator";
import { useCallback, useEffect, useRef } from "react";

interface HomePageToolbarProps {
	title?: string;
}

function HomePageToolbar({ title }: HomePageToolbarProps) {
	const router = useIonRouter();
	const clickCountRef = useRef(0);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timerRef.current != null) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	const onLogoClick = useCallback(() => {
		if (timerRef.current != null) {
			clearTimeout(timerRef.current);
		}

		clickCountRef.current += 1;

		if (clickCountRef.current >= 3) {
			clickCountRef.current = 0;
			router.push("/metrics", "forward");
			return;
		}

		timerRef.current = setTimeout(() => {
			clickCountRef.current = 0;
			timerRef.current = null;
		}, 500);
	}, [router]);

	return (
		<IonToolbar>
			<IonButtons slot="start">
				<LogoButton onClick={onLogoClick} />
			</IonButtons>
			{title && (
				<IonTitle>
					{title}
				</IonTitle>
			)}
			<IonButtons slot="end">
				<SourcesStatusIndicator />
				<IonButton className="text-muted">
					<IonIcon slot="icon-only" icon={notificationsOutline} />
				</IonButton>
				<ProfileMenuButton />
			</IonButtons>
		</IonToolbar>
	);
}

export default HomePageToolbar;
