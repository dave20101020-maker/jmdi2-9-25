import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PILLARS } from "@/config/pillars";
import CoachPanel from "@/components/ai/CoachPanel";
import AuthGuard from "@/components/shared/AuthGuard";
import { api } from "@/lib/apiClient";
import { sanitizeText } from "@/utils/security";

const safeText = (value, fallback = "") => sanitizeText(value, fallback);

function PillarInner({ user }) {
  const { pillarId } = useParams();
  const pillar = PILLARS.find((p) => p.id === pillarId);

  if (!pillar) return <div>Unknown pillar: {pillarId}</div>;

  const allowed = Array.isArray(user?.allowedPillars)
    ? user.allowedPillars
    : user?.selected_pillars || [];
  const hasAccess =
    allowed.includes(pillarId) ||
    user?.subscriptionTier === "premium" ||
    user?.subscriptionTier === "nhs_referred";

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center p-6 bg-[#0A1628]/60 border border-white/10 rounded-2xl">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-white/70 mb-4">
            Your current plan doesn't include access to the{" "}
            <strong>{pillar.name}</strong> pillar.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/pricing"
              className="px-4 py-2 bg-ns-gold text-black rounded-lg font-bold"
            >
              Upgrade
            </Link>
            <Link to="/dashboard" className="px-4 py-2 border rounded">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className={`${pillar.color} w-12 h-12 rounded`} />
        <div>
          <h1 style={{ margin: 0 }}>{pillar.label}</h1>
          <div style={{ color: "#64748b" }}>{pillar.description}</div>
        </div>
      </div>

      <section
        style={{
          marginTop: 20,
          background: "#fff",
          padding: 16,
          borderRadius: 8,
        }}
      >
        <h3>Insights & AI</h3>
        <p className="muted">
          Placeholder area for AI-driven insights and charts for this pillar.
        </p>
        <div className="mt-4">
          <CoachPanel
            label={`${pillar.name} Coach`}
            path="coach"
            body={{
              prompt: `Provide targeted coaching and up to 3 action items for the ${pillar.name} pillar.`,
              pillarFocus: pillarId,
              userContext: {},
            }}
          />
        </div>
      </section>
      <section
        style={{
          marginTop: 20,
          background: "#fff",
          padding: 16,
          borderRadius: 8,
        }}
      >
        <h3>Daily Check-In</h3>
        <DailyCheckIn pillarId={pillarId} />
      </section>
      <section
        style={{
          marginTop: 20,
          background: "#fff",
          padding: 16,
          borderRadius: 8,
        }}
      >
        <h3>Your Current Plan</h3>
        <CurrentPlan pillarId={pillarId} hasAccess={hasAccess} />
      </section>
    </div>
  );
}

function CurrentPlan({ pillarId, hasAccess }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!hasAccess) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getLatestActionPlan(pillarId);
        if (!mounted) return;
        setPlan(res.plan || null);
      } catch (err) {
        console.debug("fetch plan error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [pillarId, hasAccess]);

  if (!hasAccess) return null;

  if (loading)
    return <div className="text-sm text-white/60">Loading plan...</div>;
  if (!plan)
    return (
      <div className="text-sm text-white/70">
        No active plan. Ask the soldier for suggested actions to create one.
      </div>
    );

  return (
    <div>
      <div className="mb-2 text-sm text-white/80">
        Created: {new Date(plan.createdAt).toLocaleString()}
      </div>
      <ul className="list-disc list-inside">
        {plan.actions.map((a, idx) => (
          <li
            key={idx}
            className={`text-sm ${
              a.completed ? "line-through text-white/50" : "text-white/70"
            }`}
          >
            {safeText(a.text)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DailyCheckIn({ pillarId }) {
  const [value, setValue] = useState(7);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.createPillarCheckIn({ pillarId, value, note });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setNote("");
    } catch (err) {
      console.error("checkin error", err);
      alert("Unable to save check-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="text-sm text-white/70">
          How are you today? (0 = poor, 10 = excellent)
        </div>
        <div className="ml-auto text-white font-bold">{value}</div>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <div>
        <label className="text-sm text-white/70" htmlFor="daily-checkin-notes">
          Notes (optional)
        </label>
        <textarea
          id="daily-checkin-notes"
          aria-label="Notes (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full mt-2 p-2 rounded bg-black/10"
          rows={3}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 bg-yellow-400 rounded font-bold"
        >
          {loading ? "Saving..." : "Save Check-In"}
        </button>
        {saved && <div className="text-sm text-green-400">Saved ✅</div>}
        <div className="ml-auto text-sm text-white/60">
          Trend: <span className="ml-1">(trend goes here)</span>
        </div>
      </div>
    </div>
  );
}

export default function Pillar() {
  return <AuthGuard>{(user) => <PillarInner user={user} />}</AuthGuard>;
}
