import React, { Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const CopilotChatModal = React.lazy(() => import("./CopilotChatModal"));

export default function FloatingCopilotButton() {
  const [open, setOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [initialDraft, setInitialDraft] = useState("");
  const { user, initializing, demoMode } = useAuth();
  const isAuthenticated = Boolean(user) || demoMode;

  useEffect(() => {
    const handler = (e) => {
      const key = typeof e.key === "string" ? e.key.toLowerCase() : "";
      if ((e.ctrlKey || e.metaKey) && key === "k") {
        e.preventDefault();
        if (!isAuthenticated || initializing) {
          setShowAuthPrompt(true);
          return;
        }
        setShowAuthPrompt(false);
        setOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [initializing, isAuthenticated]);

  useEffect(() => {
    const onOpen = (e) => {
      const draft = e?.detail?.draft;
      setInitialDraft(typeof draft === "string" ? draft : "");

      if (!isAuthenticated || initializing) {
        setShowAuthPrompt(true);
        return;
      }

      setShowAuthPrompt(false);
      setOpen(true);
    };

    window.addEventListener("copilot:open", onOpen);
    return () => window.removeEventListener("copilot:open", onOpen);
  }, [initializing, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && open) {
      setOpen(false);
    }
  }, [isAuthenticated, open]);

  return (
    <>
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="mb-4 w-[min(480px,calc(100vw-1.5rem))] rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-800">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                  NorthStar AI
                </p>
                <p className="text-base font-semibold text-slate-100">
                  Sign in to use NorthStar AI
                </p>
                <p className="text-sm text-slate-300">
                  Secure Copilot chat is available only with a signed-in
                  session. We will not call AI endpoints until you are
                  authenticated.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthPrompt(false)}
                className="text-slate-300 hover:text-white"
                aria-label="Dismiss sign-in prompt"
              >
                X
              </button>
            </div>
            <div className="px-4 pb-4 pt-3 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-ns-gold px-4 py-2 text-sm font-semibold text-ns-navy shadow hover:brightness-95"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-500"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      )}

      {open && isAuthenticated && (
        <Suspense
          fallback={
            <div role="dialog" aria-modal="true">
              Loading AI...
            </div>
          }
        >
          <CopilotChatModal
            open={open}
            onClose={() => setOpen(false)}
            initialDraft={initialDraft}
          />
        </Suspense>
      )}
    </>
  );
}
