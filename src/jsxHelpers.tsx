import React from "react";
import { getLightningPubLogoSrc, LIGHTNING_PUB_MARK_HEIGHT } from "./Assets/Images/lightning-pub";
import * as icons from "./Assets/SvgIconLibrary";

export const arrangeIcon = (value?: string) => {
	switch (value) {
		case "0":
			return <React.Fragment>
				<img
					src={getLightningPubLogoSrc("mark", document.documentElement.classList.contains("dark") ? "dark" : "light")}
					alt="Lightning.pub"
					style={{ height: LIGHTNING_PUB_MARK_HEIGHT.nav, width: "auto", display: "block" }}
				/>
			</React.Fragment>
		case "1":
			return icons.mynode()

		case "2":
			return icons.uncle()

		case "3":
			return icons.lightning()

		case "4":
			return icons.zbd()

		case "5":
			return icons.stacker()

		default:
			if (!value?.includes("http")) {
				value = "https://www.google.com/s2/favicons?sz=64&domain=" + value;
			}
			return <React.Fragment>
				<img src={value} width="33px" alt='Avatar' style={{ borderRadius: "50%" }} />
			</React.Fragment>
	}
}