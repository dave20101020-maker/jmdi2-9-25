import { MODULE_TYPES } from "../engine/moduleTypes";

export default function MissionControlRenderer({ modules }) {
  return (
    <>
      {modules.map((module, index) => {
        switch (module.type) {
          case MODULE_TYPES.PRIORITY_ACTION:
            return <div key={index} id="mc-priority" />;

          case MODULE_TYPES.NARRATIVE_INSIGHT:
            return <div key={index} id="mc-narrative" />;

          case MODULE_TYPES.OVERALL_SCORE:
            return <div key={index} id="mc-score" />;

          case MODULE_TYPES.PILLAR_OVERVIEW:
            return <div key={index} id="mc-pillars" />;

          case MODULE_TYPES.AI_ENTRY:
            return <div key={index} id="mc-ai-entry" />;

          default:
            return null;
        }
      })}
    </>
  );
}
