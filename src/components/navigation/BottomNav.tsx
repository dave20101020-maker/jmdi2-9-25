import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Layers, Sparkles, Target } from "lucide-react";
import { themeTokens } from "../ThemeProvider";
import PillarsMenu from "@/components/navigation/PillarsMenu";
import TodayFocusMenu from "@/components/navigation/TodayFocusMenu";
import { PILLARS } from "@/config/pillars";
import { getAiLaunchContext } from "@/ai/context";

type MenuKey = "pillars" | "focus" | null;

export default function BottomNav() {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);

  const isPillarsActive = useMemo(
    () => location.pathname.startsWith("/pillars"),
    [location.pathname]
  );

  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!openMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openMenu]);

  const buildAiDraft = () => {
    const path = location.pathname || "/";

    if (path === "/dashboard" || path === "/") {
      // "Mission" context = dashboard / mission control.
      return "I'm on Mission Control (dashboard). Help me pick the highest-impact next action across my pillars today, and tell me what to do first.";
    }

    if (path.startsWith("/pillars/")) {
      const pillarId = path.replace("/pillars/", "").split("/")[0] || "";
      const pillar = PILLARS.find((p) => p.id === pillarId);
      const label = pillar?.label || pillarId || "this";
      return `I'm viewing the ${label} pillar. Give me 1–3 concrete next actions for today, plus one quick win I can do in under 5 minutes.`;
    }

    return "I'm in the app right now. Based on where I am, suggest the best next step and one quick win.";
  };

  const openAiChat = () => {
    setOpenMenu(null);
    const draft = buildAiDraft();
    const aiLaunchContext = getAiLaunchContext(location);

    // Deterministic launch decision (route context only):
    // - Non-pillar route => NorthStar intro first.
    // - /pillars/:pillarId => open that pillar coach directly.
    if (aiLaunchContext.mode === "pillar_direct") {
      window.dispatchEvent(
        new CustomEvent("northstar:open", {
          detail: {
            mode: "pillar",
            agentId: aiLaunchContext.pillarId,
            aiContext: aiLaunchContext,
            draft,
          },
        })
      );
      return;
    }

    window.dispatchEvent(
      new CustomEvent("northstar:open", {
        detail: { draft, mode: "northstar", aiContext: aiLaunchContext },
      })
    );
  };

  const openAiChatWithDraft = (draft?: string) => {
    setOpenMenu(null);
    const aiLaunchContext = getAiLaunchContext(location);

    if (aiLaunchContext.mode === "pillar_direct") {
      window.dispatchEvent(
        new CustomEvent("northstar:open", {
          detail: {
            mode: "pillar",
            agentId: aiLaunchContext.pillarId,
            aiContext: aiLaunchContext,
            draft,
          },
        })
      );
      return;
    }

    window.dispatchEvent(
      new CustomEvent("northstar:open", {
        detail: { draft, mode: "northstar", aiContext: aiLaunchContext },
      })
    );
  };

  return (
    <>
      <PillarsMenu
        open={openMenu === "pillars"}
        onClose={() => setOpenMenu(null)}
      />

      <TodayFocusMenu
        open={openMenu === "focus"}
        onClose={() => setOpenMenu(null)}
        onOpenAi={openAiChatWithDraft}
      />

      <nav
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-[var(--ns-color-border)] bg-[var(--ns-color-background)]/90 backdrop-blur-md ${themeTokens.surface}`}
        aria-label="Bottom navigation"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-3 items-end px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] text-white/80">
          <button
            type="button"
            onClick={() =>
              setOpenMenu((v) => (v === "pillars" ? null : "pillars"))
            }
            className={`flex min-h-11 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${
              isPillarsActive || openMenu === "pillars"
                ? "bg-white/10 text-white"
                : "hover:bg-white/5"
            }`}
            aria-label="Pillars"
            aria-expanded={openMenu === "pillars"}
          >
            <Layers className="h-5 w-5" />
            <span>Pillars</span>
          </button>

          <button
            type="button"
            onClick={openAiChat}
            className="relative -mt-4 flex flex-col items-center justify-center rounded-2xl px-2 py-1 transition-transform duration-150 ease-out active:scale-95"
            aria-label="Open NorthStar AI"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -top-1 h-16 w-16 rounded-3xl bg-ns-gold/25 blur-xl"
            />
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-ns-gold text-ns-navy shadow-ns-card ring-2 ring-[var(--ns-color-border)] transition-transform duration-150 ease-out active:scale-[0.98]"
              aria-hidden
            >
              <Sparkles className="h-7 w-7" />
            </span>
            <span className="mt-1 text-[11px] font-semibold text-white/85">
              AI
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOpenMenu((v) => (v === "focus" ? null : "focus"))}
            className={`flex min-h-11 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${
              openMenu === "focus"
                ? "bg-white/10 text-white"
                : "hover:bg-white/5"
            }`}
            aria-label="Today"
            aria-expanded={openMenu === "focus"}
          >
            <Target className="h-5 w-5" />
            <span>Today</span>
          </button>
        </div>
      </nav>
    </>
  );
}
