import MissionControlCard from "../components/MissionControlCard";

export default function SupportModule({ module }) {
  const isLoading = module?.loading || module?.isLoading;

  if (isLoading) {
    return (
      <section className="mt-6 mc-module" id="mc-support">
        <MissionControlCard className="mc-support-card mc-card--subtle">
          <div className="mc-skeleton-stack" aria-hidden="true">
            <div className="mc-skeleton mc-skeleton--eyebrow" />
            <div className="mc-skeleton mc-skeleton--title" />
            <div className="mc-skeleton mc-skeleton--text" />
            <div className="mc-skeleton mc-skeleton--text mc-skeleton--text-short" />
            <div className="mc-skeleton mc-skeleton--button" />
          </div>
        </MissionControlCard>
      </section>
    );
  }

  return (
    <section className="mt-6 mc-module" id="mc-support">
      <MissionControlCard to="/neuroshield" className="mc-support-card">
        <p className="mc-support-eyebrow">Support</p>
        <h3 className="mc-support-title">Quick help</h3>
        <p className="mc-support-body">
          If you’re feeling overwhelmed, use a short grounding protocol and get
          back to baseline.
        </p>
        <div className="mc-support-cta">Open toolkit</div>
      </MissionControlCard>
    </section>
  );
}
