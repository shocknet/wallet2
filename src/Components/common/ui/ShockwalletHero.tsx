import { IonImg } from "@ionic/react";
import logo from "@/Assets/Images/isolated logo.png";
import shockwalletText from "@/Assets/Images/wallet_new_text.png";

export function ShockwalletHero() {
	return (
		<div className="flex flex-col items-center justify-center">
			<div className="h-16 w-16">
				<IonImg
					src={logo}
					style={{
						width: "100%",
						height: "auto",
					}}
				/>
			</div>
			<div className="mt-8 max-w-80">
				<IonImg
					src={shockwalletText}
					className="w-full h-auto object-contain"
				/>
			</div>
		</div>
	);
}
