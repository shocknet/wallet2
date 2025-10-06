
import { IonButton, IonButtons, IonHeader, IonImg, IonMenuButton, IonToolbar, useIonRouter, } from '@ionic/react';
import logo from "@/Assets/Images/isolated logo.png";
import { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import IdentitiesDropdown from '../IdentitiesDropdown';



type HomeHeaderProps = RouteComponentProps & {
	children?: React.ReactNode;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ children, ...props }: HomeHeaderProps) => {
	const router = useIonRouter()

	const [logoClickCounter, setLogoClickCounter] = useState(0);
	useEffect(() => {
		let singleClickTimer: NodeJS.Timeout;
		let tripeClickTimer: NodeJS.Timeout;
		if (logoClickCounter === 1) {
			singleClickTimer = setTimeout(() => {
				router.push("/home");
				setLogoClickCounter(0);
			}, 500);
		} else {
			if (logoClickCounter === 3) {
				router.push("/metrics");
			}
			tripeClickTimer = setTimeout(() => {
				setLogoClickCounter(0);
			}, 500);
		}
		return () => {
			clearTimeout(singleClickTimer)
			clearTimeout(tripeClickTimer);
		};
	}, [logoClickCounter, router]);



	return (
		<IonHeader className="ion-no-border">
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton shape="round" routerLink="/home" onClick={() => setLogoClickCounter(prev => prev + 1)}>
						<IonImg
							slot="start"
							src={logo}
							style={{ width: "25px", height: "auto" }}
						>
						</IonImg>
					</IonButton>
				</IonButtons>
				<IonButtons slot="end">
					<IdentitiesDropdown {...props} />
					<IonMenuButton color="primary"></IonMenuButton>
				</IonButtons>
			</IonToolbar>
			{children}
		</IonHeader>
	);
};

export default HomeHeader;
