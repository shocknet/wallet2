import { useCallback, useEffect, useState } from 'react';
import { useDispatch, } from '@/State/store/store';
import { decodeNprofile, getDeviceId } from '@/constants';
import { getNostrClient } from '@/Api/nostr';
import { generateNewKeyPair } from '@/Api/helpers';
import { toast } from 'react-toastify';
import { toggleLoading } from '@/State/Slices/loadingOverlay';
import { getAdminSource, setAdminSource, type AdminSource } from './helpers';
import { useAppSelector } from '@/State/store/hooks';
import { selectHealthyNprofileViews } from '@/State/scoped/backups/sources/selectors';
import { nip19 } from 'nostr-tools';
import { sourcesActions } from '@/State/scoped/backups/sources/slice';


export const AdminGuard = ({ updateSource }: { updateSource: (adminSource: AdminSource) => void }) => {
	//const [loading, setLoading] = useState(false)
	const [adminConnect, setAdminConnect] = useState('')
	const healthyNprofileSourceViews = useAppSelector(selectHealthyNprofileViews);
	const dispatch = useDispatch();
	useEffect(() => {
		const adminSource = getAdminSource()
		if (adminSource) {
			updateSource(adminSource)
			return
		}
		const adminSourceId = healthyNprofileSourceViews.find(p => !!p.adminToken)
		if (adminSourceId) {
			console.log("admin source found", adminSourceId)
			updateSource({ nprofile: nip19.nprofileEncode({ pubkey: adminSourceId.lpk, relays: adminSourceId.relays }), keys: adminSourceId.keys })
		}
	}, [healthyNprofileSourceViews])
	const submitAdminConnect = useCallback(async () => {
		const deviceId = getDeviceId();
		const splitted = adminConnect.split(":")
		const inputSource = splitted[0]
		const adminEnrollToken = splitted.length > 1 ? splitted[1] : undefined;
		if (!adminEnrollToken) {
			toast.error("Please provide an nprofile with an admin token")
			return
		}
		dispatch(toggleLoading({ loadingMessage: "Connecting to admin dashboard" }))
		try {
			const data = decodeNprofile(inputSource);
			const pub = data.pubkey
			const existingSpendSourceId = healthyNprofileSourceViews.find(id => id.lpk === pub);
			if (existingSpendSourceId) {
				const spendSource = existingSpendSourceId;
				if (spendSource && spendSource.adminToken !== adminEnrollToken) {
					const client = await getNostrClient(inputSource, spendSource.keys!); // TODO: write migration to remove type override
					const res = await client.EnrollAdminToken({ admin_token: adminEnrollToken });
					if (res.status !== "OK") {
						toast.error("Error enrolling admin token " + res.reason)
						dispatch(toggleLoading({ loadingMessage: "" }))
						return
					}
					dispatch(sourcesActions.updateAdminToken({ sourceId: spendSource.sourceId, adminToken: adminEnrollToken, by: deviceId }));
				}
				dispatch(toggleLoading({ loadingMessage: "" }))
				return
			}
			const newSourceKeyPair = generateNewKeyPair();
			const client = await getNostrClient(inputSource, newSourceKeyPair);
			const res = await client.EnrollAdminToken({ admin_token: adminEnrollToken });
			if (res.status !== "OK") {
				toast.error("Error enrolling admin token " + res.reason)
				dispatch(toggleLoading({ loadingMessage: "" }))
				return
			}
			const s = { nprofile: inputSource, keys: newSourceKeyPair }
			setAdminSource(s)
			updateSource(s)
			dispatch(toggleLoading({ loadingMessage: "" }))
		} catch {
			toast.error("error decoding nprofile")
			dispatch(toggleLoading({ loadingMessage: "" }))
			return;
		}
	}, [adminConnect])

	return <div style={{ width: '60%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', margin: 'auto', border: '1px solid rgb(42, 171, 225)', padding: '20px 10%', borderRadius: 10 }}>
		<p>Admin Connect</p>
		<input type='text' style={{ color: 'black', width: "100%" }} value={adminConnect} onChange={e => setAdminConnect(e.target.value)} placeholder='paste admin connect here'></input>
		<button onClick={() => submitAdminConnect()} style={{ width: "100%", height: 30, marginTop: 10 }}>SUBMIT</button>
	</div>
}
