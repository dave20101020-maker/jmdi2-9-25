import { useNavigate } from "react-router-dom";

export default function EmptyStateGuidance() {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
      <h3 className="text-lg font-semibold text-white">
        Let’s find your starting point
      </h3>
      <p className="mt-2 text-sm text-white/70 max-w-prose">
        NorthStar works best once it understands your baseline. A short check-in
        helps the system prioritise what matters most right now — without
        pressure or judgement.
      </p>
      <div className="mt-4">
        <button
          onClick={() => navigate("/onboarding")}
          className="rounded-xl px-4 py-2 text-sm bg-white/10 border border-white/10 text-white/80 hover:bg-white/15 transition"
        >
          Start with one simple check-in
        </button>
      </div>
    </div>
  );
}
