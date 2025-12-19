import { getMissionControlModules } from "./engine/getMissionControlModules";
import MissionControlRenderer from "./renderer/MissionControlRenderer";

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
  // Phase 1.6: Mission Control must render even when unauthenticated

  // Phase 0.5: always render legacy dashboard
  // Phase 1+: this flag will enable Mission Control V2

  // Temporary mock user state (Phase 1.2)
  const mockUserState = {
    hasAnyData: true,
    momentum: { checkIns: 3 },
    distressSignals: false,
  };

  const modules = getMissionControlModules(mockUserState);

  return (
    <div className="min-h-screen bg-navy text-white">
      {/* Mission Control is the OS surface */}
      {/* Dashboard is a state machine, not a page */}
      {/* One priority, one insight, one action */}
      <MissionControlRenderer modules={modules} />
    </div>
  );
}
