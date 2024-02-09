import { useEffect } from "react";
import { useDispatch, useSelector } from "../../State/store";
import { decodeNprofile } from "../../custom-nip19";
import { getNostrClient } from "../../Api";
import Bridge from "../../Api/bridge";
import { editPaySources } from "../../State/Slices/paySourcesSlice";

export const LnAddressCheck = () => {
	const paySource = useSelector((state) => state.paySource);
	const spendSource = useSelector(state => state.spendSource);
	const dispatch = useDispatch();

	// for nostr pay to sources, if vanity_name doesn't already exist in store, get it from bridge
	useEffect(() => {
		const nostrPayTos = paySource.filter(s => s.pasteField.includes("nprofile"));
		nostrPayTos.forEach(source => {
			if (!source.vanityName) {
				const { pubkey, relays, bridge } = decodeNprofile(source.pasteField)
				if (bridge && bridge.length > 0) {
					getNostrClient({ pubkey, relays }).then(c => {
						c.GetLnurlPayLink().then(pubRes => {
							if (pubRes.status !== 'OK') {
								console.log("Pub error: ", pubRes.reason);
							} else {
								const bridgeHandler = new Bridge(bridge[0]);
								bridgeHandler.GetOrCreateVanityName(pubRes.k1).then(bridgeRes => {
									if (bridgeRes.status === "OK") {
										dispatch(editPaySources({ ...source, vanityName: bridgeRes.vanity_name }));
									} else {
										console.log("Vanity name error");
									}
								})
							}
						})
					})
				}
			}
		})
		/* spendSource in the dependency array instead of paySource to avoid infinite loop
			adding a nostr source is both an addition of paySource and spendSource, so it's a hacky trick
		*/
	}, [dispatch, spendSource]);

	return null;
}
