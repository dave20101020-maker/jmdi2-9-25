import React, { Suspense, useEffect, useState } from "react";
import AssessmentModule from "@/assessments/AssessmentModule";
import { resolveAssessmentIdFromPayload } from "@/ai/modules/assessmentModuleAdapter";

const CopilotChatModal = React.lazy(() =>
  import("@/components/CopilotChatModal")
);

export default function AIChatSurface() {
  const [open, setOpen] = useState(false);
  const [initialDraft, setInitialDraft] = useState("");
  const [aiLaunchContext, setAiLaunchContext] = useState(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState(null);

  useEffect(() => {
    const onOpen = (event) => {
      const detail = event?.detail || {};
      const draft = detail?.draft;
      const launch = detail?.aiContext;

      setInitialDraft(typeof draft === "string" ? draft : "");
      setAiLaunchContext(launch && typeof launch === "object" ? launch : null);
      setOpen(true);
    };

    window.addEventListener("northstar:open", onOpen);
    return () => window.removeEventListener("northstar:open", onOpen);
  }, []);

  if (!open) return null;

  return (
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
        aiLaunchContext={aiLaunchContext}
        onAssessmentStart={(payload) => {
          const resolved = resolveAssessmentIdFromPayload(payload);
          if (resolved) {
            setActiveAssessmentId(resolved);
          }
        }}
      />

      {activeAssessmentId ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-[min(720px,calc(100vw-1.5rem))]">
            <AssessmentModule
              assessmentId={activeAssessmentId}
              onClose={() => setActiveAssessmentId(null)}
            />
          </div>
        </div>
      ) : null}
    </Suspense>
  );
}
