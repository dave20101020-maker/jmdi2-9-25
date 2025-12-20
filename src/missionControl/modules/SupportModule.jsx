import MissionControlCard from "../components/MissionControlCard";

export default function SupportModule() {
  return (
    <section className="mt-6" id="mc-support">
      <MissionControlCard to="/neuroshield">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Support
        </p>
        <h3 className="text-white text-lg font-semibold mt-2">Quick help</h3>
        <p className="text-white/70 text-sm mt-2">
          If you’re feeling overwhelmed, use a short grounding protocol and get
          back to baseline.
        </p>
        <div className="mt-4 inline-flex items-center justify-center rounded-xl px-4 py-2 bg-white/10 text-white text-sm border border-white/10">
          Open toolkit
        </div>
      </MissionControlCard>
    </section>
  );
}
