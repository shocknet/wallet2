
import { IonButton, IonButtons, IonHeader, IonImg, IonMenuButton, IonToolbar, } from '@ionic/react';
import logo from "@/Assets/Images/isolated logo.png";
import { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';



type HomeHeaderProps = RouteComponentProps & {
	children?: React.ReactNode;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ children, history }: HomeHeaderProps) => {

	const [logoClickCounter, setLogoClickCounter] = useState(0);
	useEffect(() => {
		let singleClickTimer: NodeJS.Timeout;
		let tripeClickTimer: NodeJS.Timeout;
		if (logoClickCounter === 1) {
			singleClickTimer = setTimeout(() => {
				history.push("/");
				setLogoClickCounter(0);
			}, 500);
		} else {
			if (logoClickCounter === 3) {
				history.push("/metrics");
			}
			tripeClickTimer = setTimeout(() => {
				setLogoClickCounter(0);
			}, 500);
		}
		return () => {
			clearTimeout(singleClickTimer)
			clearTimeout(tripeClickTimer);
		};
	}, [logoClickCounter, history]);





	return (
		<IonHeader className="ion-no-border">
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton shape="round" onClick={() => setLogoClickCounter(prev => prev + 1)}>
						<IonImg
							slot="start"
							src={logo}
							style={{ width: "30px", height: "auto" }}
						>
						</IonImg>
					</IonButton>
				</IonButtons>

				<IonButtons slot="end">
					<IonMenuButton color="primary"></IonMenuButton>
				</IonButtons>
			</IonToolbar>
			{children}
		</IonHeader>
	);
};

export default HomeHeader;