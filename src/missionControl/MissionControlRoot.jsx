import { featureFlags } from "../config/featureRuntime";

import { getMissionControlModules } from "./engine/getMissionControlModules";
import MissionControlRenderer from "./renderer/MissionControlRenderer";

// Existing dashboard (legacy, stable)
import Dashboard from "../pages/Dashboard";

// Future Mission Control V2 (not implemented yet)
// import MissionControlV2 from "./MissionControlV2";

/**
 * MissionControlRoot
 *
 * Single switch point for Mission Control.
 * This file must remain minimal and boring.
 * All future dashboard logic swaps happen here.
 */
export default function MissionControlRoot(props) {
  // Phase 0.5: always render legacy dashboard
  // Phase 1+: this flag will enable Mission Control V2

  // Temporary mock user state (Phase 1.2)
  const mockUserState = {
    hasAnyData: true,
    momentum: { checkIns: 3 },
    distressSignals: false,
  };

  const modules = getMissionControlModules(mockUserState);

  if (featureFlags.FEATURE_MISSION_CONTROL_V2) {
    return <MissionControlRenderer modules={modules} />;
  }

  return <Dashboard {...props} />;
}
