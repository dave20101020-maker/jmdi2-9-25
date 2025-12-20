import PillarProgressGrid from "@/components/dashboard/PillarProgressGrid";
import MissionControlCard from "../components/MissionControlCard";

export default function PillarOverviewModule() {
  return (
    <section className="mt-6" id="mc-pillars">
      <MissionControlCard className="bg-transparent border-0 p-0 backdrop-blur-none">
        <PillarProgressGrid />
      </MissionControlCard>
    </section>
  );
}
