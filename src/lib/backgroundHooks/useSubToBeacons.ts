import { updateSourceState } from "@/Api/health";
import { subToBeacons } from "@/Api/nostr";
import { useEffect } from "react";
import { useSelector } from "@/State/store";

export const useSubToBeacons = () => {
	const spendSource = useSelector((state) => state.spendSource)
	const paySource = useSelector((state) => state.paySource)
	useEffect(() => {
		return subToBeacons(up => {
			updateSourceState(up.createdByPub, { disconnected: false, name: up.name })
		})
	}, [spendSource, paySource])
}
