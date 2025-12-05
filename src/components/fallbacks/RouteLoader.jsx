import PropTypes from "prop-types";

export default function RouteLoader({
  message = "Syncing your dashboard...",
  "data-testid": dataTestId = "route-loader",
}) {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center bg-gradient-to-b from-[#050b18] to-[#0d1b3a]"
      role="status"
      aria-live="polite"
      data-testid={dataTestId}
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full border-4 border-white/10 border-t-[#D4AF37] animate-spin" />
        <div>
          <p className="text-white font-semibold tracking-wide">NorthStar</p>
          <p className="text-white/60 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}

RouteLoader.propTypes = {
  message: PropTypes.string,
  "data-testid": PropTypes.string,
};
