
import { useDispatch, useSelector } from "../../../State/store";
import { Modal } from "../Modal";

import styles from "./styles/index.module.scss";
import { CrossIcon, ShieldIcon, TrashIcon } from '../../../Assets/SvgIconLibrary';

import { arrangeIcon } from "../../../jsxHelpers";
import Dropdown from "../../Dropdowns/LVDropdown";
import { useCallback, useEffect, useState } from "react";
import { nip19 } from "nostr-tools";
import classNames from "classnames";
import { setSourceToEdit } from "../../../State/Slices/modalsSlice";
import { deletePaySources, editPaySources } from "../../../State/Slices/paySourcesSlice";
import { toast } from "react-toastify";
import Toast from "../../Toast";
import { SourceTrustLevel } from "../../../globalTypes";
import { deleteSpendSources, editSpendSources } from "../../../State/Slices/spendSourcesSlice";
import PromptForActionModal, { ActionType } from "../PromptForActionModal";

const isValidUrl = (url: string) => {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}






const trustLevelsArray = Object.values(SourceTrustLevel);

const substringNpub = (npub: string) => {
	return `${npub.substring(0, 15)}...${npub.substring(npub.length - 15, npub.length)}`;
}



export const EditSourceModal = () => {
	const dispatch = useDispatch()
	const paySources = useSelector(state => state.paySource)
	const spendSources = useSelector(state => state.spendSource)
	const sourceToEdit = useSelector(state => state.modalsSlice.sourceToEdit);
	const [editValues, setEditValues] = useState({
		relay: "",
		nameService: "",
		trustLevel: SourceTrustLevel.MEDIUM
	})

	const [initialRelay, setInitialRelay] = useState("")
	const [initialNameService, setInitialNameService] = useState("")

	const [isPromptConfirmDelete, setIsPromptConfirmDelete] = useState(false);



	useEffect(() => {
		if (!sourceToEdit) return;
		setIsPromptConfirmDelete(false)

		let relay = ""
		let nameService = ""
		if (sourceToEdit.source.pubSource) {
			const { type, data } = nip19.decode(sourceToEdit.source.pasteField);
			if (type === "nprofile" && data.relays) {
				relay = data.relays[0]
				setInitialRelay(relay)
			}
		}
		if (sourceToEdit.type === "payTo") {
			nameService = sourceToEdit.source.bridgeUrl || ""
			setInitialNameService(nameService)
		}
		setEditValues(state => ({ ...state, nameService, relay }));

	}, [sourceToEdit])






	const handleSave = useCallback(() => {
		if (!sourceToEdit) return;

		const shouldUpdate = (editValues.relay !== initialRelay) || (editValues.nameService !== initialNameService) || (editValues.trustLevel !== sourceToEdit.source.option)

		let newPasteField = sourceToEdit.source.pasteField

		if (editValues.relay !== initialRelay) {
			if (!isValidUrl(editValues.relay)) {
				toast.error(<Toast title="Relay Error" message="The relay URL you entered is not a valid url" />);
				return;
			}

			newPasteField = nip19.nprofileEncode({ pubkey: sourceToEdit.source.id.split("-")[0], relays: [editValues.relay] })
		}

		if (editValues.nameService !== initialNameService) {
			if (!isValidUrl) {
				toast.error(<Toast title="Name Service Error" message="The name service URL you entered is not a valid url" />);
				return;
			}
		}

		if (shouldUpdate) {
			if (sourceToEdit.type === "payTo") {
				dispatch(editPaySources({
					...sourceToEdit.source,
					pasteField: newPasteField,
					option: editValues.trustLevel,
					bridgeUrl: editValues.nameService
				}))
				const counterpartSource = spendSources.sources[sourceToEdit.source.id];
				if (counterpartSource) {
					dispatch(editSpendSources({
						...counterpartSource,
						option: editValues.trustLevel,
						pasteField: newPasteField,
					}))
				}
			} else {
				dispatch(editSpendSources({
					...sourceToEdit.source,
					pasteField: newPasteField,
					option: editValues.trustLevel,
				}))

				const counterpartSource = paySources.sources[sourceToEdit.source.id];
				if (counterpartSource) {
					dispatch(editPaySources({
						...counterpartSource,
						option: editValues.trustLevel,
						pasteField: newPasteField,
					}))
				}
			}

			toast.success("Source Properties saved successfuly")
		}
		dispatch(setSourceToEdit(null))
	}, [sourceToEdit, editValues, initialNameService, initialRelay, dispatch, spendSources, paySources]);

	const handleSourceDelete = useCallback(() => {
		if (!sourceToEdit) return;
		dispatch(deleteSpendSources(sourceToEdit.source.id))
		dispatch(deletePaySources(sourceToEdit.source.id))
		dispatch(setSourceToEdit(null))
		toast.success(<Toast title="Success" message="Source deleted successfuly" />)
	}, [dispatch, sourceToEdit])



	const modalContent = sourceToEdit ? (
		<div className={styles["container"]}>
			<div className={styles["corner-icon"]} onClick={() => setIsPromptConfirmDelete(true)}>
				<TrashIcon />
			</div>
			<div className={styles["modal-header"]}>Source Properties</div>
			<div className={styles["modal-body"]}>
				<div className={styles["requestor-container"]}>
					{
						arrangeIcon(sourceToEdit.source.icon)
					}
					<span className={styles["source-label"]}>{sourceToEdit.source.label}</span>
					<Dropdown<SourceTrustLevel>
						setState={(option) => setEditValues(state => ({ ...state, trustLevel: option }))}
						jsx={
							<div className={styles["dropdown-box"]}>{editValues.trustLevel} ▼</div>
						}
						otherOptions={trustLevelsArray}
						className={styles["dropdown-options"]}
					/>

				</div>
				<div className={styles["source-items-container"]}>
					{
						sourceToEdit.source.pubSource
						&&
						<>
							<div className={styles["item-line"]}>
								<span className={styles["item-label"]}>
									Source Key:
								</span>
								<span className={classNames(styles["item-value"], styles["npub"])}>
									{substringNpub(nip19.npubEncode(sourceToEdit.source.id.split("-")[0]))}
								</span>
							</div>
							<div className={styles["item-line"]}>
								<span className={styles["item-label"]}>
									Local Key:
								</span>
								<span className={classNames(styles["item-value"], styles["npub"])}>
									{substringNpub(nip19.npubEncode(sourceToEdit.source.id.split("-")[1]))}
								</span>
							</div>
							<div className={styles["item-line"]}>
								<span className={styles["item-label"]}>
									Relay:
								</span>
								<span className={classNames(styles["item-value"], styles["input"])}>
									<input value={editValues.relay} onChange={(e) => setEditValues(state => ({ ...state, relay: e.target.value }))} />
								</span>
							</div>
							{
								sourceToEdit.type === "payTo"
								&&
								<div className={styles["item-line"]}>
									<span className={styles["item-label"]}>
										Name Service:
									</span>
									<span className={classNames(styles["item-value"], styles["input"])}>
										<input value={editValues.nameService} onChange={(e) => setEditValues(state => ({ ...state, nameService: e.target.value }))} />
									</span>
								</div>
							}
							{
								(sourceToEdit.type === "payTo" && sourceToEdit.source.vanityName)
								&&
								<span>{sourceToEdit.source.vanityName.split("@")[0]}</span>
							}
						</>


					}
				</div>
				<div className={styles["buttons-container"]}>
					<button onClick={() => dispatch(setSourceToEdit(null))}>
						<>
							<CrossIcon />
							CANCEL
						</>
					</button>
					<button onClick={handleSave}>
						<>
							<ShieldIcon />
							SAVE
						</>
					</button>
				</div>
			</div>

		</div>
	) : <></>;



	return (
		<>
			<Modal isShown={!!sourceToEdit && !isPromptConfirmDelete} hide={() => dispatch(setSourceToEdit(null))} modalContent={modalContent} headerText={''} />
			{
				isPromptConfirmDelete
				&&
				<PromptForActionModal
					descriptionText="Are you sure you want to delete this source?"
					title="Delete Source" actionType={ActionType.DANGER}
					closeModal={() => setIsPromptConfirmDelete(false)}
					action={handleSourceDelete}
					actionText="Delete"
				/>

			}
		</>
	)
}

