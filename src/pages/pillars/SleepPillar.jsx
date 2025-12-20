import React from "react";
import { executeMissionControlAction } from "@/missionControl/actions/executeMissionControlAction";
import PillarCurtainLayout from "@/pillars/components/PillarCurtainLayout";
import PillarActionCard from "@/pillars/components/PillarActionCard";

export default function SleepPillar() {
  return (
    <PillarCurtainLayout
      title="Sleep"
      insight="Your sleep consistency is improving, but late nights are still fragmenting recovery."
      action={
        <PillarActionCard
          title="Stabilise bedtime tonight"
          description="A single adjustment can improve tomorrow’s recovery score."
          onClick={() => executeMissionControlAction("START_SLEEP_PROTOCOL")}
        />
      }
    />
  );
}
