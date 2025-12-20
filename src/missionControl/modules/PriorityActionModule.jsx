import QuickActions from "@/components/dashboard/QuickActions";
import MissionControlCard from "../components/MissionControlCard";

export default function PriorityActionModule({ module }) {
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
    <section className="mt-2 mb-6" id="mc-priority">
      <MissionControlCard className="bg-white/10 border-white/20 backdrop-blur-lg p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
          Mission Control
        </p>
        <h1 className="text-white text-3xl font-bold mt-3">{headline}</h1>
        <p className="text-white/70 text-base mt-3 max-w-xl">{subhead}</p>
        <div className="mt-5">
          <QuickActions />
        </div>
      </MissionControlCard>
    </section>
  );
}
