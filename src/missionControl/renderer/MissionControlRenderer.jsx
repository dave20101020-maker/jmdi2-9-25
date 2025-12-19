import { MODULE_TYPES } from "../engine/moduleTypes";

import PriorityActionModule from "../modules/PriorityActionModule";
import EmptyStateGuidance from "../modules/EmptyStateGuidance";
import NarrativeInsightModule from "../modules/NarrativeInsightModule";
import OverallScoreModule from "../modules/OverallScoreModule";
import PillarOverviewModule from "../modules/PillarOverviewModule";
import SupportModule from "../modules/SupportModule";
import MomentumModule from "../modules/MomentumModule";
import AIEntryModule from "../modules/AIEntryModule";

export default function MissionControlRenderer({ modules = [] }) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return <EmptyStateGuidance />;
  }

  return (
    <div className="space-y-6">
      {modules.map((module, index) => {
        switch (module.type) {
          case MODULE_TYPES.PRIORITY_ACTION:
            return <PriorityActionModule key={index} module={module} />;

          case "EMPTY_STATE_GUIDANCE":
            return <EmptyStateGuidance key={index} />;

          case MODULE_TYPES.NARRATIVE_INSIGHT:
            return <NarrativeInsightModule key={index} module={module} />;

          case MODULE_TYPES.OVERALL_SCORE:
            return <OverallScoreModule key={index} module={module} />;

          case MODULE_TYPES.PILLAR_OVERVIEW:
            return <PillarOverviewModule key={index} module={module} />;

          case MODULE_TYPES.MOMENTUM:
            return <MomentumModule key={index} module={module} />;

          case MODULE_TYPES.SUPPORT:
            return <SupportModule key={index} module={module} />;

          case MODULE_TYPES.AI_ENTRY:
            return <AIEntryModule key={index} module={module} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
