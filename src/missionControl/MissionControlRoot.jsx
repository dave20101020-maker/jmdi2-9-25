import React from "react";
import { getMissionControlModules } from "./engine/getMissionControlModules";
import MissionControlRenderer from "./renderer/MissionControlRenderer";
// Phase 13: Orbit/context returns via gestures (not default plane)
// import MissionControlOrbitalHeader from "./components/MissionControlOrbitalHeader";

// Future Mission Control V2 (not implemented yet)
// import MissionControlV2 from "./MissionControlV2";

const EMPTY_USER_STATE = {
  hasAnyData: false,
  lifeScore: 0,
  pillars: {},
  momentum: { checkIns: 0 },
  distressSignals: false,
};

const mapMissionStateToUserState = (state) => {
  const pillars = state?.pillars || {};

  return {
    hasAnyData: Boolean(state),
    lifeScore: Number.isFinite(state?.lifeScore) ? state.lifeScore : 0,
    pillars: {
      sleep: { score: pillars.sleep },
      nutrition: { score: pillars.nutrition },
      exercise: { score: pillars.fitness },
      physical: { score: pillars.physical },
      mental: { score: pillars.mental },
      finances: { score: pillars.finances },
      social: { score: pillars.social },
      purpose: { score: pillars.spirituality },
    },
    momentum: { checkIns: 0 },
    distressSignals: false,
  };
};

const renderLoadingShell = () => (
  <div className="mx-auto max-w-5xl px-4 py-10 animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <div className="h-24 w-24 rounded-full bg-white/10 shadow-[0_0_28px_rgba(255,255,255,0.08)]" />
      <div className="h-3 w-56 rounded-full bg-white/10" />
    </div>
    <div className="mt-10 space-y-4">
      <div className="h-24 rounded-2xl bg-white/5" />
      <div className="h-36 rounded-2xl bg-white/5" />
      <div className="h-28 rounded-2xl bg-white/5" />
    </div>
  </div>
);

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
  const hasExternalState = Boolean(props?.userState);
  const [remoteState, setRemoteState] = React.useState(null);
  const [status, setStatus] = React.useState(
    hasExternalState ? "success" : "loading"
  );
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    if (hasExternalState) return undefined;
    let isActive = true;

    const loadState = async () => {
      setStatus("loading");
      setErrorMessage("");

      try {
        const response = await fetch("/api/mission-control/state");
        if (!response.ok) {
          throw new Error("mission_control_state_unavailable");
        }
        const payload = await response.json();
        if (!isActive) return;
        setRemoteState(payload);
        setStatus("success");
      } catch (error) {
        if (!isActive) return;
        setStatus("error");
        setErrorMessage(
          "We couldn't refresh Mission Control just now. You're still covered."
        );
      }
    };

    loadState();

    return () => {
      isActive = false;
    };
  }, [hasExternalState]);

  const mappedRemoteState = remoteState
    ? mapMissionStateToUserState(remoteState)
    : null;
  const userState = props?.userState ?? mappedRemoteState ?? EMPTY_USER_STATE;
  const modules = getMissionControlModules(userState) || [];

  return (
    <div className="min-h-screen bg-navy text-white">
      {/* Mission Control is the OS surface */}
      {/* Dashboard is a state machine, not a page */}
      {/* One priority, one insight, one action */}
      {status === "loading" && !hasExternalState && !mappedRemoteState
        ? renderLoadingShell()
        : null}
      {status !== "loading" || hasExternalState || mappedRemoteState ? (
        <MissionControlRenderer modules={modules} userState={userState} />
      ) : null}
      {errorMessage ? (
        <div className="mx-auto max-w-5xl px-4 pb-8 text-center text-xs text-white/60">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
