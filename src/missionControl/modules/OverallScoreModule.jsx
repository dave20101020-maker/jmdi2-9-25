import DailyReadinessCard from "@/components/dashboard/DailyReadinessCard";
import WeeklyTrendsCard from "@/components/dashboard/WeeklyTrendsCard";

export default function OverallScoreModule() {
  return (
    <section className="mt-6" id="mc-score">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailyReadinessCard />
        <WeeklyTrendsCard />
      </div>
    </section>
  );
}
