import PillarProgressGrid from "@/components/dashboard/PillarProgressGrid";
import MissionControlCard from "../components/MissionControlCard";

export default function PillarOverviewModule({ module }) {
  const isLoading = module?.loading || module?.isLoading;

  if (isLoading) {
    return (
      <section className="mt-6 mc-module" id="mc-pillars">
        <MissionControlCard className="bg-transparent border-0 p-0 backdrop-blur-none">
          <div className="mc-skeleton mc-skeleton--panel" aria-hidden="true" />
        </MissionControlCard>
      </section>
    );
  }

  return (
    <section className="mt-6 mc-module" id="mc-pillars">
      <MissionControlCard className="bg-transparent border-0 p-0 backdrop-blur-none">
        <PillarProgressGrid />
      </MissionControlCard>
    </section>
  );
}
