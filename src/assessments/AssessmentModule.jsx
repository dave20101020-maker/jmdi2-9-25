import React, { useMemo, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { ASSESSMENT_REGISTRY } from "./registry";

export default function AssessmentModule({ assessmentId, onClose }) {
  const definition = ASSESSMENT_REGISTRY[assessmentId];
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const questions = definition?.questionSet?.questions || [];
  const responseOptions = definition?.questionSet?.responseOptions || [];

  const allAnswered = useMemo(
    () => questions.every((q) => responses[q.id] !== undefined),
    [questions, responses]
  );

  if (!definition) {
    return (
      <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 text-slate-100">
        <p className="text-sm text-slate-300">Assessment unavailable.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
        >
          Close
        </button>
      </div>
    );
  }

  const handleChange = (questionId, value) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const result = definition.score(responses);
      const payload = {
        assessmentId: definition.id,
        schemaVersion: definition.schemaVersion,
        timestamp: new Date().toISOString(),
        responses,
        result,
      };

      await apiClient.request("/assessments/complete", {
        method: "POST",
        body: payload,
      });

      setSubmitted(true);
    } catch (err) {
      setError("Unable to save assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 text-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Assessment
          </p>
          <h2 className="text-lg font-semibold text-slate-100">
            {definition.name}
          </h2>
          <p className="text-sm text-slate-400">{definition.description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200"
          aria-label="Close assessment"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        {definition.disclaimer}
      </div>

      {submitted ? (
        <div className="mt-6 text-sm text-slate-200">
          <p className="font-semibold">Assessment saved.</p>
          <p className="text-slate-400">
            You can review this result in your Vault when it&apos;s available.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-ns-gold px-4 py-2 text-sm font-semibold text-ns-navy"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-lg border border-slate-800 p-3"
            >
              <p className="text-sm font-medium text-slate-100">
                {index + 1}. {question.prompt}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {responseOptions.map((option) => {
                  const selected = responses[question.id] === option.value;
                  return (
                    <button
                      key={`${question.id}-${option.value}`}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        selected
                          ? "border-ns-gold bg-ns-gold text-ns-navy"
                          : "border-slate-700 text-slate-200 hover:border-slate-500"
                      }`}
                      onClick={() => handleChange(question.id, option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {error ? <p className="text-xs text-rose-200">{error}</p> : null}

          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={handleSubmit}
            className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
              allAnswered && !submitting
                ? "bg-ns-gold text-ns-navy"
                : "cursor-not-allowed bg-slate-800 text-slate-400"
            }`}
          >
            {submitting ? "Saving..." : "Submit assessment"}
          </button>
        </div>
      )}
    </div>
  );
}
