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

    const urlParts = useMemo(() => {
        const sections: { startIncl: number, endIncl: number }[] = []
        let percentIndex = -2
        for (let i = 0; i < existingCbUrl.length; i++) {
            const char = existingCbUrl.charAt(i)
            switch (char) {
                case '%':
                    percentIndex = i
                    break
                case '[':
                    if (percentIndex === i - 1) {
                        // found the start of a variable
                    } else {
                        percentIndex = -2
                    }
                    break
                case ']':
                    if (percentIndex > 0) {
                        // found the end of variable
                        sections.push({ startIncl: percentIndex, endIncl: i })
                        percentIndex = -2
                    }
                    break
            }
        }
        if (sections.length === 0) {
            return [<span>{existingCbUrl}</span>]
        }
        const formatted: JSX.Element[] = []
        if (sections[0].startIncl > 0) {
            formatted.push(<span key={"t_start"}>{existingCbUrl.substring(0, sections[0].startIncl)}</span>)
        }

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i]
            const variable = existingCbUrl.substring(section.startIncl + 2, section.endIncl)
            formatted.push(<i key={i} style={{ color: '#2aabe1' }}>{variable}</i>)
            if (sections[i + 1] && sections[i + 1].startIncl > section.endIncl + 1) {
                formatted.push(<span key={"t_" + i}>{existingCbUrl.substring(section.endIncl + 1, sections[i + 1].startIncl)}</span>)
            }
        }
        if (sections[sections.length - 1].endIncl < existingCbUrl.length - 1) {
            formatted.push(<span key={"t_end"}>{existingCbUrl.substring(sections[sections.length - 1].endIncl + 1)}</span>)
        }
        return formatted
    }, [existingCbUrl])

    return (
        <div style={{ textAlign: 'center', border: '1px solid grey', padding: '20px 10%', borderRadius: '10px' }}>
            <div>
                <p>WebHook {!editCbUrl && <span onClick={() => { setUpdatedCbUrl(existingCbUrl); setEditCbUrl(true) }}>{Icons.pencilIcons()}</span>}</p>
                <div style={{ height: 1, backgroundColor: 'grey', width: '100%', margin: '10px 0px' }} ></div>
                {!editCbUrl && <span>{urlParts}</span>}
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