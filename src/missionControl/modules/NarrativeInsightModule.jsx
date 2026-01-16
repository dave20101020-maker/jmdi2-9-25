import MissionControlCard from "../components/MissionControlCard";

export default function NarrativeInsightModule({ module }) {
  const isLoading = module?.loading || module?.isLoading;
  const title = module?.title || "Why this matters today";
  const body =
    module?.body ||
    "One clear insight to reduce decision fatigue and keep you aligned.";

  return (
    <section
      className="narrative-insight mc-readable mc-module"
      id="mc-narrative"
    >
      <MissionControlCard className="mc-narrative-card mc-card--subtle">
        {isLoading ? (
          <div className="mc-skeleton-stack" aria-hidden="true">
            <div className="mc-skeleton mc-skeleton--eyebrow" />
            <div className="mc-skeleton mc-skeleton--title" />
            <div className="mc-skeleton mc-skeleton--text" />
            <div className="mc-skeleton mc-skeleton--text mc-skeleton--text-short" />
          </div>
        ) : (
          <>
            <p className="mc-narrative-eyebrow">Insight</p>
            <h2 className="mc-narrative-title">{title}</h2>
            <p className="mc-narrative-body">{body}</p>
          </>
        )}
      </MissionControlCard>
    </section>
  );
}
