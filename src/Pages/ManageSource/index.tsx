import { PageProps } from "../../globalTypes";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { SocialMedia } from "../../Containers/SocialMedia";
import { Fragment } from "react";

export const ManageSource: React.FC<PageProps> = ({ state, dispatch }): JSX.Element => {
  const { shoppingCart } = state
  const navigate: NavigateFunction = useNavigate()
  const handleClick = () => {
    navigate("/")
    dispatch && dispatch({ 
      type: "MOVING",
      payload: {current: "/shopping-cart", history: "/menu"}
    })
  }

  return(
    <Fragment>
      <section className="Menu">
        <article className="Menu__bar" onClick={handleClick}>
          <h2 className="Menu__title">test</h2>
        </article>
      </section>
      <div className="Menu__footer">
        <SocialMedia />
      </div>
    </Fragment>
  )
}