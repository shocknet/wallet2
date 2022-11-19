import { PageProps } from "../../globalTypes";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { Fragment } from "react";

export const Sources: React.FC<PageProps> = ({ state, dispatch }): JSX.Element => {
  const navigate: NavigateFunction = useNavigate()
  const handleClick = () => {
    navigate("/")
  }

  return(
    <Fragment>
      <section className="Sources">
        test
      </section>
    </Fragment>
  )
}