import React from "react";
import { executeMissionControlAction } from "@/missionControl/actions/executeMissionControlAction";
import PillarCurtainLayout from "@/pillars/components/PillarCurtainLayout";
import PillarActionCard from "@/pillars/components/PillarActionCard";
import DisclosureSection from "../../shared/components/DisclosureSection";

export default function SleepPillar() {
  return (
    <PillarCurtainLayout
      pillarId="sleep"
      title="Sleep"
      insight="Your sleep consistency is improving, but late nights are still fragmenting recovery."
      action={
        <PillarActionCard
          title="Stabilise bedtime tonight"
          description="A single adjustment can improve tomorrow’s recovery score."
          onClick={() => executeMissionControlAction("START_SLEEP_PROTOCOL")}
        />
      }
    >
      <DisclosureSection title="Recent sleep patterns">
        {/* existing charts / notes / summaries go here */}
      </DisclosureSection>
    </PillarCurtainLayout>
  );
}
