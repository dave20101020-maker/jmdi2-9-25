import { MODULE_TYPES } from "../engine/moduleTypes";

import PriorityActionModule from "../modules/PriorityActionModule";
import EmptyStateGuidance from "../modules/EmptyStateGuidance";
import NarrativeInsightModule from "../modules/NarrativeInsightModule";
import OverallScoreModule from "../modules/OverallScoreModule";
import PillarOverviewModule from "../modules/PillarOverviewModule";
import SupportModule from "../modules/SupportModule";
import MomentumModule from "../modules/MomentumModule";
import AIEntryModule from "../modules/AIEntryModule";
import PrimaryActionCard from "../modules/PrimaryActionCard";
import DisclosureSection from "../../shared/components/DisclosureSection";

export default function MissionControlRenderer({ modules = [] }) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return <EmptyStateGuidance />;
  }

  const overallScoreModule = modules.find(
    (module) => module?.type === MODULE_TYPES.OVERALL_SCORE
  );
  const priorityActionModule = modules.find(
    (module) => module?.type === MODULE_TYPES.PRIORITY_ACTION
  );
  const primaryActionModule = modules.find(
    (module) => module?.type === "primaryAction"
  );
  const narrativeInsightModule = modules.find(
    (module) => module?.type === MODULE_TYPES.NARRATIVE_INSIGHT
  );

  const renderModule = (module, index) => {
    switch (module.type) {
      case "primaryAction":
        return <PrimaryActionCard key={module?.id || index} module={module} />;

      case MODULE_TYPES.PRIORITY_ACTION:
        return (
          <PriorityActionModule key={module?.id || index} module={module} />
        );

      case "EMPTY_STATE_GUIDANCE":
        return <EmptyStateGuidance key={module?.id || index} />;

      case MODULE_TYPES.NARRATIVE_INSIGHT:
        return (
          <NarrativeInsightModule key={module?.id || index} module={module} />
        );

      case MODULE_TYPES.OVERALL_SCORE:
        return <OverallScoreModule key={module?.id || index} />;

      case MODULE_TYPES.PILLAR_OVERVIEW:
        return <PillarOverviewModule key={module?.id || index} />;

      case MODULE_TYPES.MOMENTUM:
        return <MomentumModule key={module?.id || index} />;

      case MODULE_TYPES.SUPPORT:
        return <SupportModule key={module?.id || index} />;

      case MODULE_TYPES.AI_ENTRY:
        return <AIEntryModule key={module?.id || index} module={module} />;

      default:
        return null;
    }
  };

  const supportingModules = modules.filter((module) => {
    if (!module?.type) return false;
    if (module.type === MODULE_TYPES.OVERALL_SCORE) return false;
    if (module.type === MODULE_TYPES.PRIORITY_ACTION) return false;
    if (module.type === MODULE_TYPES.NARRATIVE_INSIGHT) return false;
    if (module.type === "primaryAction") return false;
    if (module.type === MODULE_TYPES.AI_ENTRY) return false;
    return true;
  });

  const titleForSupportingModule = (module) => {
    switch (module?.type) {
      case MODULE_TYPES.MOMENTUM:
        return "Progress & momentum";
      case MODULE_TYPES.PILLAR_OVERVIEW:
        return "Pillars";
      case MODULE_TYPES.SUPPORT:
        return "Support";
      default:
        return module?.title || "More context";
    }
  };

  const openNorthStar = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("northstar:open", {
        detail: {
          draft: "Help me decide what matters most today.",
        },
      })
    );
  };

  return (
    <div className="mission-control">
      <section className="mc-spine">
        <div className="mc-section" id="mc-score">
          <div className="mc-section-label">Overall score</div>
          {overallScoreModule ? renderModule(overallScoreModule, 0) : null}
        </div>

        <div className="mc-section" id="mc-action">
          <div className="mc-section-label">Priority</div>
          {priorityActionModule
            ? renderModule(priorityActionModule, 1)
            : primaryActionModule
            ? renderModule(primaryActionModule, 1)
            : null}
        </div>

        <div className="mc-section" id="mc-ai">
          <div className="mc-section-label">AI</div>
          <div className="ai-anchor">
            <button
              type="button"
              className="ai-anchor__button"
              onClick={openNorthStar}
            >
              NorthStar command
            </button>
          </div>
        </div>

        <div className="mc-section" id="mc-insight">
          <div className="mc-section-label">Narrative insight</div>
          {narrativeInsightModule
            ? renderModule(narrativeInsightModule, 2)
            : null}
        </div>
      </section>

      <div>
        {supportingModules.map((module, index) => {
          const rendered = renderModule(module, index);
          if (!rendered) return null;

          return (
            <div
              className="mc-section"
              key={module?.id || `${module?.type || "module"}-${index}`}
            >
              <div className="mc-section-label">
                {titleForSupportingModule(module)}
              </div>
              <DisclosureSection title={titleForSupportingModule(module)}>
                {rendered}
              </DisclosureSection>
            </div>
          );
        })}
      </div>
    </div>
  );
}
