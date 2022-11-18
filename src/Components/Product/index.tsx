import { ButtonSmall } from "../ButtonSmall";
import Trash from "../../Assets/Icons/trash.svg";
import { ProductProps } from "./types";

export const Product: React.FC<ProductProps> = ({ 
  title,
  price,
  quantity,
  img,
  dispatch,
  id,
}): JSX.Element => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: "CHANGE_QUANTITY",
      payload: { id: id, quantity: Number(e.target.value) } 
    })
  }

  return(
    <div className="Product">
      <div className="Product__thumbnail">
        <img src={img} alt={title} />
      </div>

      <div className="Product__content">
        <div>
          <h2>{title}</h2>
          <span>${price}</span>
          <select defaultValue={quantity} onChange={(e) => handleChange(e)}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>

        <ButtonSmall source={Trash} onclick={() => dispatch({ type: "REMOVE", payload: id })} />
      </div>
    </div>
  )
}