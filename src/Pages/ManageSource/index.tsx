import { PageProps } from "../../globalTypes";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { Fragment } from "react";

export const ManageSource: React.FC<PageProps> = ({ state, dispatch }): JSX.Element => {
  const navigate: NavigateFunction = useNavigate()
  const handleClick = () => {
    navigate("/")
  }

  return(
    <Fragment>
      <section className="Menu">
        <article className="Menu__bar" onClick={handleClick}>
          <h2 className="Menu__title">test</h2>
        </article>
      </section>
    </Fragment>
  )
}