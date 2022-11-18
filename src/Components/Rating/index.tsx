import Star from "../../Assets/Icons/star.svg";
import { RatingProps } from "./types";

export const Rating: React.FC<RatingProps> = ({ content }): JSX.Element => {
  return(
    <div className="Rating">
      <p className="Rating__grade">{content}</p>
      <img src={Star} alt="" className="Rating__logo" />
    </div>
  )
}