import React from "react";
import { createRoot } from "react-dom/client";
import MissionControlActionOverlay from "../components/MissionControlActionOverlay";

let overlayRoot = null;
let overlayApi = null;
let pendingOpenActionId = null;

function ensureOverlayMounted() {
  if (overlayRoot) return;

  const mountNode = document.createElement("div");
  mountNode.setAttribute("data-mc-overlay", "true");
  document.body.appendChild(mountNode);

  overlayRoot = createRoot(mountNode);
  overlayRoot.render(
    React.createElement(MissionControlActionOverlay, {
      registerApi: (api) => {
        overlayApi = api;
        if (pendingOpenActionId) {
          const actionId = pendingOpenActionId;
          pendingOpenActionId = null;
          overlayApi?.open?.(actionId);
        }
      },
    })
  );
}

export function openMissionControlOverlay(actionId) {
  if (typeof document === "undefined") return;

  ensureOverlayMounted();

  if (!overlayApi?.open) {
    pendingOpenActionId = actionId;
    return;
  }

  overlayApi.open(actionId);
}
