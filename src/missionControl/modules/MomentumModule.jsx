import HabitChecklist from "@/components/dashboard/HabitChecklist";
import MultiPillarStreaks from "@/components/dashboard/MultiPillarStreaks";

export default function MomentumModule() {
  return (
    <section className="mt-6" id="mc-momentum">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MultiPillarStreaks />
        <HabitChecklist />
      </div>
    </section>
  );
}
