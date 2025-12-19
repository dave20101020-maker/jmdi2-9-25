import QuickActions from "@/components/dashboard/QuickActions";

export default function PriorityActionModule({ module }) {
  const headline = module?.headline || "One thing that moves the needle";
  const subhead =
    module?.subhead ||
    "A single priority action for today — chosen for impact across your pillars.";

  return (
    <section className="mt-2 mb-6" id="mc-priority">
      <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-lg p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
          Mission Control
        </p>
        <h1 className="text-white text-3xl font-bold mt-3">{headline}</h1>
        <p className="text-white/70 text-base mt-3 max-w-xl">{subhead}</p>
        <div className="mt-5">
          <QuickActions />
        </div>
      </div>
    </section>
  );
}
