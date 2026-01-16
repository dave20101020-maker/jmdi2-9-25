import MissionControlCard from "../components/MissionControlCard";

export default function AIEntryModule({ module }) {
  // AI entry is currently provided via the floating AI button elsewhere in the shell.
  // Keep this module as a structural placeholder for later "AI command entry" rendering.
  const isLoading = module?.loading || module?.isLoading;

  return (
    <div className="mt-6 mc-module" id="mc-ai-entry" aria-hidden="true">
      <MissionControlCard
        disabled
        className="bg-transparent border-0 p-0 backdrop-blur-none"
      >
        {isLoading ? (
          <div className="mc-skeleton mc-skeleton--panel" aria-hidden="true" />
        ) : null}
      </MissionControlCard>
    </div>
  );
}
