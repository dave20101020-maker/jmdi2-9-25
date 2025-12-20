import MissionControlCard from "../components/MissionControlCard";

export default function AIEntryModule() {
  // AI entry is currently provided via the floating AI button elsewhere in the shell.
  // Keep this module as a structural placeholder for later "AI command entry" rendering.
  return (
    <div className="mt-6" id="mc-ai-entry" aria-hidden="true">
      <MissionControlCard
        disabled
        className="bg-transparent border-0 p-0 backdrop-blur-none"
      />
    </div>
  );
}
