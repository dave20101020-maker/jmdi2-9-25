import "../styles/northstar-loader.css";
import StarIcon from "../assets/northstar-star.svg";

export default function NorthStarLoader({ visible }) {
  if (!visible) return null;

  return (
    <div className="northstar-loader">
      <img
        src={StarIcon}
        alt="NorthStar loading"
        className="northstar-star"
        draggable={false}
      />
    </div>
  );
}
