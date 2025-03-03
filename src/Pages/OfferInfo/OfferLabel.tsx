import * as Icons from "../../Assets/SvgIconLibrary";
import { useState } from "react";
type OfferItemType = {
    title: string;
    value: string;
    type: string;
};
type Props = { existingLabel: string, updateLabel: (s: string) => void }
export const OfferLabel = ({ existingLabel, updateLabel }: Props) => {
    const [editLabel, setEditLabel] = useState<boolean>(false)
    const [updatedLabel, setUpdatedLabel] = useState<string>("")

    return (
        <div style={{ textAlign: 'center', border: '1px solid grey', padding: '20px 10%', borderRadius: '10px' }}>
            <div>
                <p>Label {!editLabel && <span onClick={() => { setUpdatedLabel(existingLabel); setEditLabel(true) }}>{Icons.pencilIcons()}</span>}</p>
                <div style={{ height: 1, backgroundColor: 'grey', width: '100%', margin: '10px 0px' }} ></div>
                {!editLabel && <span>{existingLabel}</span>}
                {editLabel &&
                    <>
                        <label>New Label: </label>
                        <input type="text" style={{ color: 'black' }} value={updatedLabel} onChange={e => setUpdatedLabel(e.target.value)} />
                        <span onClick={() => { updateLabel(updatedLabel); setEditLabel(false) }}>✔️</span>
                        <span onClick={() => { setUpdatedLabel(existingLabel); setEditLabel(false) }}>❌</span>
                    </>
                }
            </div>
        </div>
    );
};
