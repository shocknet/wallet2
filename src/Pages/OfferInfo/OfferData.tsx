import * as Icons from "../../Assets/SvgIconLibrary";
import { useState } from "react";

type Props = { expectedData: string[], removeFromExpected: (s: string) => void, addToExpected: (s: string) => void }
export const OfferData = ({ expectedData, removeFromExpected, addToExpected }: Props) => {
    const [addData, setAddData] = useState<boolean>(false)
    const [expectedDataToAdd, setExpectedDataToAdd] = useState<string>("")
    const [showExample, setShowExample] = useState<string>("")
    const [toDelete, setToDelete] = useState<string>("")

    return (
        <div style={{ textAlign: 'center', border: '1px solid grey', padding: '20px 10%', borderRadius: '10px' }}>
            <div>
                <p>Expected Data</p>
                <div style={{ height: 1, backgroundColor: 'grey', width: '100%', margin: '10px 0px' }} ></div>
                <div>
                    {expectedData.map((e, i) => <div style={{ color: 'grey' }} key={i}>
                        {toDelete !== e && <>
                            {showExample !== e && <p><span onClick={() => setToDelete(e)}>{Icons.TrashIcon()}</span>data name: <strong style={{ color: "white" }}>{e}</strong>, data type: <span style={{ color: "white" }}>string</span><div onClick={() => setShowExample(e)} style={arrowStyle(true)}>{Icons.arrow()}</div></p>}
                            {showExample === e && <div>
                                <div>data name: <strong style={{ color: "white" }}>{e}</strong>, data type: <span style={{ color: "white" }}>string</span><div onClick={() => setShowExample("")} style={arrowStyle(false)}>{Icons.arrow()}</div></div>
                                <p style={{ color: 'white' }}>Example Usage for: <strong>{e}</strong></p>
                                <p><span style={{ color: 'white' }}>Use as Path param</span> https://example.com/<strong style={{ color: 'white' }}>%[{e}]</strong>/sub_path</p>
                                <p><span style={{ color: 'white' }}>Use as Query param</span> https://example.com?any_param_name=<strong style={{ color: 'white' }}>%[{e}]</strong></p>
                            </div>}
                        </>}
                        {toDelete === e && <p>You sure you want to delete <strong style={{ color: 'white' }}>{e}</strong>? <span onClick={() => removeFromExpected(e)}>✔️</span><span onClick={() => setToDelete("")}>❌</span></p>}
                    </div>)}
                    {!addData && <span onClick={() => setAddData(true)}>➕</span>}
                    {addData && <div>
                        <label>New Data: </label>
                        <input type="text" style={{ color: 'black' }} value={expectedDataToAdd} onChange={e => { if (e.target.value === encodeURIComponent(e.target.value)) { setExpectedDataToAdd(e.target.value) } }} />
                        <span onClick={() => { addToExpected(expectedDataToAdd); setExpectedDataToAdd(""); setAddData(false) }}>✔️</span>
                        <span onClick={() => { setExpectedDataToAdd(""); setAddData(false) }}>❌</span>
                    </div>}
                </div>
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