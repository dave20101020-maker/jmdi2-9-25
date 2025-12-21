import MissionControlCard from "../components/MissionControlCard";

export default function NarrativeInsightModule({ module }) {
  const title = module?.title || "Why this matters today";
  const body =
    module?.body ||
    "One clear insight to reduce decision fatigue and keep you aligned.";

  return (
    <section className="narrative-insight mc-readable" id="mc-narrative">
      <MissionControlCard>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Insight
        </p>
        <h2 className="text-white text-lg font-semibold mt-2">{title}</h2>
        <p className="text-white/70 text-sm mt-2">{body}</p>
      </MissionControlCard>
    </section>
  );
}
