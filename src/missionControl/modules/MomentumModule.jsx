import HabitChecklist from "@/components/dashboard/HabitChecklist";
import MultiPillarStreaks from "@/components/dashboard/MultiPillarStreaks";
import MissionControlCard from "../components/MissionControlCard";

export default function MomentumModule() {
  return (
    <section className="mt-6" id="mc-momentum">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MissionControlCard className="bg-transparent border-0 p-0 backdrop-blur-none">
          <MultiPillarStreaks />
        </MissionControlCard>
        <MissionControlCard className="bg-transparent border-0 p-0 backdrop-blur-none">
          <HabitChecklist />
        </MissionControlCard>
      </div>
    </section>
  );
}
