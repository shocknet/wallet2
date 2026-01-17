import type { BackButtonEvent } from "@ionic/core";

declare global {
	interface DocumentEventMap {
		ionBackButton: BackButtonEvent;
	}
}
