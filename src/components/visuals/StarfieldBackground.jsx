import "./StarfieldBackground.css";

export default function StarfieldBackground() {
  return (
    <div className="ns-starfield" aria-hidden="true">
      <div className="ns-starfield__gradient" />
      <div className="ns-starfield__stars" />
    </div>
  );
}
