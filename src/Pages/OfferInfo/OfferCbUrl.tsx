import * as Icons from "../../Assets/SvgIconLibrary";
import { useMemo, useState } from "react";
type OfferItemType = {
    title: string;
    value: string;
    type: string;
};
type Props = { expectedData: string[], existingCbUrl: string, updateCbUrl: (s: string) => void }
export const OfferCbUrl = ({ expectedData, existingCbUrl, updateCbUrl }: Props) => {
    const [editCbUrl, setEditCbUrl] = useState<boolean>(false)
    const [updatedCbUrl, setUpdatedCbUrl] = useState<string>("")
    const [usefulInfo, setUsefulInfo] = useState<boolean>(false)
    const dataQuery = useMemo(() => {
        if (expectedData.length === 0) {
            return ""
        }
        return "&" + expectedData.map(e => `${e}=%[${e}]`).join('&')

    }, [expectedData])

    return (
        <div style={{ textAlign: 'center', border: '1px solid grey', padding: '20px 10%', borderRadius: '10px' }}>
            <div>
                <p>WebHook {!editCbUrl && <span onClick={() => { setUpdatedCbUrl(existingCbUrl); setEditCbUrl(true) }}>{Icons.pencilIcons()}</span>}</p>
                <div style={{ height: 1, backgroundColor: 'grey', width: '100%', margin: '10px 0px' }} ></div>
                {!editCbUrl && <span>{existingCbUrl}</span>}
                {editCbUrl &&
                    <>
                        <label>New Url: </label>
                        <input type="text" style={{ color: 'black' }} value={updatedCbUrl} onChange={e => setUpdatedCbUrl(e.target.value)} placeholder="https://example.com?i=%[invoice]" />
                        <span onClick={() => { updateCbUrl(updatedCbUrl); setEditCbUrl(false) }}>✔️</span>
                        <span onClick={() => { setUpdatedCbUrl(existingCbUrl); setEditCbUrl(false) }}>❌</span>
                    </>
                }
            </div>
            <div style={{ color: 'grey' }}>
                <p>Useful Info! <div onClick={() => setUsefulInfo(!usefulInfo)} style={arrowStyle(!usefulInfo)}>{Icons.arrow()}</div></p>
                {usefulInfo && <>
                    <p>The service provides <strong style={{ color: 'white' }}>invoice</strong> and <strong style={{ color: 'white' }}>amount</strong> by default, use them the same way as the other data, with <strong style={{ color: 'white' }}>%[invoice]</strong> and <strong style={{ color: 'white' }}>%[amount]</strong></p>
                    <p>Here is a full example that uses both <strong style={{ color: 'white' }}>invoice</strong>, <strong style={{ color: 'white' }}>amount</strong> and all your custom defined attributes!</p>
                    <p style={{ color: 'white' }}>{'https://example.com?i=%[invoice]&a=%[amount]' + dataQuery}</p>
                </>}
            </div>
        </div>
    );
};

const arrowStyle = (right: boolean) => {
    return {
        display: "inline-block",
        transform: `rotate(${right ? 0 : 90}deg)`,
        transition: "0.3s",
    }
}