import * as Icons from "../../Assets/SvgIconLibrary";
import { useState } from "react";
import Checkbox from "../../Components/Checkbox";
type OfferItemType = {
    title: string;
    value: string;
    type: string;
};
type Props = { existingPrice: number, updatePrice: (s: number) => void }
export const OfferPrice = ({ existingPrice, updatePrice }: Props) => {
    const [editPrice, setEditPrice] = useState<boolean>(false)
    const [spontPayment, setSpontPayment] = useState<boolean>(false)
    const [updatedPrice, setUpdatedPrice] = useState<number>(0)

    return (
        <div style={{ textAlign: 'center', border: '1px solid grey', padding: '20px 10%', borderRadius: '10px' }}>
            <div>
                <p>Price {!editPrice && <span onClick={() => { setUpdatedPrice(existingPrice); setEditPrice(true) }}>{Icons.pencilIcons()}</span>}</p>
                <div style={{ height: 1, backgroundColor: 'grey', width: '100%', margin: '10px 0px' }} ></div>
                {!editPrice && !existingPrice && <span>Spontaneous Payment</span>}
                {!editPrice && !!existingPrice && <span>{existingPrice}sats</span>}
                {editPrice &&
                    <>
                        <div /* style={{ display: 'flex', alignItems: 'center' }} */ >
                            <label>Spontaneous Payment </label>
                            <Checkbox id="spontPrice" state={spontPayment} setState={(e) => {
                                setSpontPayment(e.target.checked)
                                if (e.target.checked) {
                                    setUpdatedPrice(0)
                                }
                            }} inline={true} />
                        </div>
                        {!spontPayment && <>
                            <label>New Price: </label>
                            <input type="number" style={{ color: 'black' }} value={updatedPrice} onChange={e => setUpdatedPrice(+e.target.value)} />
                        </>}
                        <span onClick={() => { updatePrice(updatedPrice); setEditPrice(false) }}>✔️</span>
                        <span onClick={() => { setUpdatedPrice(existingPrice); setEditPrice(false) }}>❌</span>
                        {!spontPayment && (!updatedPrice || updatedPrice < 0) && <p style={{ color: 'red' }}>Amount is required!</p>}
                    </>
                }
            </div>
        </div>
    );
};
