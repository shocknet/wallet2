import cn from "clsx";
import {
	allowOverlayRoles,
	type OverlayOptions,
} from "@/overlay";

export function lockedPromptOverlay(cssClass?: string): OverlayOptions {
	return {
		cssClass: cn("dialog-modal", "wallet-modal", cssClass),
		backdropDismiss: false,
		keyboardClose: false,
		canDismiss: allowOverlayRoles("confirm", "cancel"),
	};
}
