import { Rating } from "../Rating";
import { ButtonCTA } from "../ButtonCTA";
import { ItemProps } from "./types";
import { NavigateFunction, useNavigate } from "react-router-dom";

export const Item: React.FC<ItemProps> = ({ 
  id, 
  name,
  category,
  price,
  rate,
  image,
  dispatch,
  added
}): JSX.Element => {
  const navigate: NavigateFunction = useNavigate()
  const handleNavigate = () => {
    dispatch({
      type: "MOVING",
      payload: {current: `/products/${name}`, history: window.location.pathname}
    })
    setTimeout(() => {
      window.scrollTo(0, 0)
    }, 0)
    navigate(`/products/${name}`)
  }

  return(
    <div className="Item">
      <div className="Item__thumbnail" onClick={handleNavigate}>
        <img src={image} alt={name} />
      </div>

      <div className="Item__body">
        <h2 onClick={handleNavigate}>{name}</h2>
        <span>${price}</span>
        <span className="Item__category">{category}</span>
      </div>

      <div className="Item__footer">
        <Rating content={rate} />
        <ButtonCTA ItemId={id} dispatch={dispatch} added={added} />
      </div>
    </div>
  )
}