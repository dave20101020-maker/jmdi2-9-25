import DailyReadinessCard from "@/components/dashboard/DailyReadinessCard";
import WeeklyTrendsCard from "@/components/dashboard/WeeklyTrendsCard";
import MissionControlCard from "../components/MissionControlCard";

export default function OverallScoreModule() {
  return (
    <section id="mc-score">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MissionControlCard className="bg-transparent border-0 p-0 backdrop-blur-none">
          <DailyReadinessCard />
        </MissionControlCard>
        <MissionControlCard className="bg-transparent border-0 p-0 backdrop-blur-none">
          <WeeklyTrendsCard />
        </MissionControlCard>
      </div>
    </section>
  );
}
