import React from "react";
import { executeMissionControlAction } from "../actions/executeMissionControlAction";
import { emitMissionControlActionEvent } from "../persistence/missionControlPersistence";

export default function PrimaryActionCard({ module }) {
  const title = module?.title ?? "Today's Focus";
  const description =
    module?.description ?? "One step that will move the needle today.";
  const actionId = module?.actionId ?? "ASK_AI_COACH";
  const shownActionIdsRef = React.useRef(new Set());

  React.useEffect(() => {
    if (!actionId) return;
    if (shownActionIdsRef.current.has(actionId)) return;
    shownActionIdsRef.current.add(actionId);

    emitMissionControlActionEvent({
      type: "shown",
      actionId,
      ts: Date.now(),
      meta: { source: "mission-control", surface: "primary-action" },
    }).catch(() => {
      // Never block rendering due to persistence.
    });
  }, [actionId]);

  return (
    <section className="mt-2" id="mc-primary-action">
      <div className="primary-action-card">
        <div className="primary-action-eyebrow">MISSION CONTROL</div>
        <h2 className="primary-action-title">{title}</h2>
        <p className="primary-action-description">{description}</p>

        <button
          type="button"
          className="primary-action-button"
          onClick={() => executeMissionControlAction(actionId)}
        >
          Begin
        </button>
      </div>
    </section>
  );
}
