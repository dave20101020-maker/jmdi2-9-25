import QuickActions from "@/components/dashboard/QuickActions";
import MissionControlCard from "../components/MissionControlCard";

export default function PriorityActionModule({ module }) {
  const isLoading = module?.loading || module?.isLoading;
  const pillar = module?.pillar;

  const copyByPillar = {
    sleep: "Stabilise your sleep timing tonight",
    nutrition: "Rebalance energy with a simple nutrition check-in",
    mental: "Reduce cognitive load with a short mental reset",
    exercise: "Activate your body with light movement",
  };

  const descriptionByPillar = {
    sleep: "Sleep quality influences every other system.",
    nutrition: "Energy stability improves focus and mood.",
    mental: "Lowering mental load increases capacity everywhere.",
    exercise: "Movement restores motivation and clarity.",
  };

  const headline = pillar ? copyByPillar[pillar] : "Your next best step";
  const subhead = pillar
    ? descriptionByPillar[pillar]
    : "NorthStar is finding what matters most.";

  return (
    <section id="mc-priority" className="mc-module">
      <MissionControlCard className="mc-priority-card" emphasis="primary">
        {isLoading ? (
          <div className="mc-skeleton-stack" aria-hidden="true">
            <div className="mc-skeleton mc-skeleton--eyebrow" />
            <div className="mc-skeleton mc-skeleton--title" />
            <div className="mc-skeleton mc-skeleton--text" />
            <div className="mc-skeleton mc-skeleton--text mc-skeleton--text-short" />
            <div className="mc-skeleton mc-skeleton--button" />
          </div>
        ) : (
          <>
            <p className="mc-priority-eyebrow">Mission Control</p>
            <h1 className="mc-priority-title">{headline}</h1>
            <p className="mc-priority-subhead">{subhead}</p>
            <div className="mt-5">
              <QuickActions />
            </div>
          </>
        )}
      </MissionControlCard>
    </section>
  );
}
