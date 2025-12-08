/**
 * Daily Checkin Modal
 *
 * Lightweight micro-questionnaire modal for daily progress tracking.
 * Pillar-specific questions, conditional logic, smart UI.
 *
 * Usage:
 *   <DailyCheckinModal
 *     isOpen={isOpen}
 *     pillar="sleep"
 *     onClose={() => setIsOpen(false)}
 *     onSubmit={(responses) => handleCheckinSubmit(responses)}
 *   />
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import aiClient from "@/api/aiClient";

export default function DailyCheckinModal({
  isOpen,
  pillar,
  onClose,
  onSubmit,
}) {
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================================
  // Load Questions on Mount
  // ============================================================================

  useEffect(() => {
    if (!isOpen || !pillar) return;

    const loadQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/checkin/${pillar}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (data.completed) {
          // Already completed today
          return;
        }

        if (data.questions) {
          setQuestions(data.questions);
          setResponses({});
          setCurrentStep(0);
        }
      } catch (err) {
        setError("Failed to load checkin questions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [isOpen, pillar]);

  // ============================================================================
  // Filter Visible Questions Based on Conditions
  // ============================================================================

  const getVisibleQuestions = () => {
    return questions.filter((q) => {
      if (!q.conditional) return true;
      const conditionalResponse = responses[q.conditional];
      if (typeof conditionalResponse === "boolean") {
        return conditionalResponse === true;
      }
      return true;
    });
  };

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentStep];
  const progress = ((currentStep + 1) / visibleQuestions.length) * 100;

  // ============================================================================
  // Handle Response
  // ============================================================================

  const handleResponse = (questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // ============================================================================
  // Navigation
  // ============================================================================

  const handleNext = () => {
    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // ============================================================================
  // Submit
  // ============================================================================

  const handleSubmit = async () => {
    if (!currentQuestion) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/checkin/${pillar}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ responses }),
      });

      const data = await response.json();

      if (data.ok) {
        // Call parent callback
        if (onSubmit) {
          onSubmit(data);
        }
        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(data.error || "Failed to submit checkin");
      }
    } catch (err) {
      setError("Error submitting checkin");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Render Question Input
  // ============================================================================

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const value = responses[currentQuestion.id];

    switch (currentQuestion.type) {
      case "number":
        return (
          <div className="space-y-4">
            {currentQuestion.range && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>{currentQuestion.range[0]}</span>
                <span>{currentQuestion.range[1]}</span>
              </div>
            )}
            <input
              type="range"
              min={currentQuestion.range?.[0] || 0}
              max={currentQuestion.range?.[1] || 100}
              value={value || currentQuestion.range?.[0] || 0}
              onChange={(e) =>
                handleResponse(currentQuestion.id, parseInt(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="text-center text-2xl font-bold text-indigo-600">
              {value || currentQuestion.range?.[0] || 0}
            </div>
          </div>
        );

      case "boolean":
        return (
          <div className="flex gap-3">
            <button
              onClick={() => handleResponse(currentQuestion.id, true)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                value === true
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => handleResponse(currentQuestion.id, false)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                value === false
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              No
            </button>
          </div>
        );

      case "select":
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option) => (
              <button
                key={option}
                onClick={() => handleResponse(currentQuestion.id, option)}
                className={`w-full py-2 px-3 text-left rounded-lg border transition ${
                  value === option
                    ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case "text":
      default:
        return (
          <input
            type="text"
            placeholder="Your answer..."
            value={value || ""}
            onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        );
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Daily Check-in
                  </h2>
                  <p className="text-sm text-gray-500 capitalize mt-1">
                    {pillar.replace("-", " ")}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Progress Bar */}
              {!loading && visibleQuestions.length > 0 && (
                <div className="px-6 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">
                      Question {currentStep + 1} of {visibleQuestions.length}
                    </span>
                    <span className="text-xs font-medium text-gray-600">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        Loading questions...
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-600">
                    <p>{error}</p>
                  </div>
                ) : visibleQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">
                      You've already completed your check-in today!
                    </p>
                    <p className="text-sm text-gray-500">
                      Great job staying consistent.
                    </p>
                  </div>
                ) : currentQuestion ? (
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-base font-medium text-gray-900 mb-4">
                      {currentQuestion.question}
                    </h3>
                    {renderQuestionInput()}
                  </motion.div>
                ) : null}
              </div>

              {/* Actions */}
              {!loading && visibleQuestions.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === 0 || submitting}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>

                  {currentStep === visibleQuestions.length - 1 ? (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Complete
                          <ChevronRight size={18} />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      Next
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
