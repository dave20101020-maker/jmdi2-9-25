import { MODULE_TYPES } from "../engine/moduleTypes";

import PriorityActionModule from "../modules/PriorityActionModule";
import NarrativeInsightModule from "../modules/NarrativeInsightModule";
import OverallScoreModule from "../modules/OverallScoreModule";
import PillarOverviewModule from "../modules/PillarOverviewModule";
import MomentumModule from "../modules/MomentumModule";
import AIEntryModule from "../modules/AIEntryModule";
import SupportModule from "../modules/SupportModule";

export default function MissionControlRenderer({ modules }) {
  return (
    <>
      {modules.map((module, index) => {
        switch (module.type) {
          case MODULE_TYPES.PRIORITY_ACTION:
            return <PriorityActionModule key={index} module={module} />;

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
    </>
  );
}
