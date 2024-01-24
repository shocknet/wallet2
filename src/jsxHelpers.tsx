import React from "react";
import BootstrapSource from "./Assets/Images/bootstrap_source.jpg";
import * as icons from "./Assets/SvgIconLibrary";

export const arrangeIcon = (value?: string) => {
	switch (value) {
		case "0":
			return <React.Fragment>
				<img src={BootstrapSource} width="33px" alt='Avatar' style={{ borderRadius: "50%" }} />
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