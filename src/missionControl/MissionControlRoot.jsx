import { getMissionControlModules } from "./engine/getMissionControlModules";
import MissionControlRenderer from "./renderer/MissionControlRenderer";
// Phase 13: Orbit/context returns via gestures (not default plane)
// import MissionControlOrbitalHeader from "./components/MissionControlOrbitalHeader";

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
    lifeScore: 72,
    pillars: {
      sleep: { score: 74 },
      nutrition: { score: 68 },
      exercise: { score: 61 },
      physical: { score: 70 },
      mental: { score: 66 },
      finances: { score: 58 },
      social: { score: 73 },
      purpose: { score: 64 },
    },
    momentum: { checkIns: 3 },
    distressSignals: false,
  };

  const userState = props?.userState ?? mockUserState;
  const modules = getMissionControlModules(userState) || [];

  return (
    <div className="min-h-screen bg-navy text-white">
      {/* Mission Control is the OS surface */}
      {/* Dashboard is a state machine, not a page */}
      {/* One priority, one insight, one action */}
      <MissionControlRenderer modules={modules} userState={userState} />
    </div>
  );
}
