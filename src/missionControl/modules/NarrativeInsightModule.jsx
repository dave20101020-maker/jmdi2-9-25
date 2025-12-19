export default function NarrativeInsightModule({ module }) {
  const title = module?.title || "Why this matters today";
  const body =
    module?.body ||
    "One clear insight to reduce decision fatigue and keep you aligned.";

  return (
    <section
      className="mt-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4"
      id="mc-narrative"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
        Insight
      </p>
      <h2 className="text-white text-lg font-semibold mt-2">{title}</h2>
      <p className="text-white/70 text-sm mt-2">{body}</p>
    </section>
  );
}
