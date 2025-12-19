import { Link } from "react-router-dom";

export default function SupportModule() {
  return (
    <section className="mt-6" id="mc-support">
      <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Support
        </p>
        <h3 className="text-white text-lg font-semibold mt-2">Quick help</h3>
        <p className="text-white/70 text-sm mt-2">
          If you’re feeling overwhelmed, use a short grounding protocol and get
          back to baseline.
        </p>
        <div className="mt-4">
          <Link
            to="/neuroshield"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm border border-white/10"
          >
            Open toolkit
          </Link>
        </div>
      </div>
    </section>
  );
}
