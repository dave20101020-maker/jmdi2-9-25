/**
 * OnboardingFlow Component
 *
 * Multi-step onboarding wizard:
 * 1. Demographics
 * 2. Goals Selection
 * 3. Health Screens
 * 4. Mental Health Screens
 *
 * Usage:
 *   <OnboardingFlow onComplete={() => navigate('/dashboard')} />
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import api from "../api/client";
import { getAssessmentDefinitions, scoreAssessment } from "@/assessments";

const STEPS = [
  "Demographics",
  "Goals",
  "Health",
  "Mental Health",
  "Assessments",
];

export default function OnboardingFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    demographics: {},
    selectedGoals: [],
    healthScreens: {},
    mentalHealthScreens: {},
    assessments: {
      responses: {},
      results: {},
    },
  });

  const assessmentDefinitions = useMemo(() => getAssessmentDefinitions(), []);

  // ============================================================================
  // Load Template
  // ============================================================================

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await fetch("/api/onboarding/template", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (data.ok) {
          setTemplate(data.template);
        }
      } catch (err) {
        setError("Failed to load onboarding template");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, []);

  // ============================================================================
  // Update Form Data
  // ============================================================================

  const updateDemographic = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        [field]: value,
      },
    }));
  };

  const toggleGoal = (pillar, goal) => {
    setFormData((prev) => {
      const currentGoals = prev.selectedGoals;
      const existing = currentGoals.find(
        (g) => g.pillar === pillar && g.goal === goal
      );

      if (existing) {
        return {
          ...prev,
          selectedGoals: currentGoals.filter(
            (g) => !(g.pillar === pillar && g.goal === goal)
          ),
        };
      } else {
        if (currentGoals.length < 3) {
          return {
            ...prev,
            selectedGoals: [...currentGoals, { pillar, goal }],
          };
        }
        return prev;
      }
    });
  };

  const updateHealthScreen = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      healthScreens: {
        ...prev.healthScreens,
        [field]: value,
      },
    }));
  };

  const updateMentalHealthScreen = (screenType, index, value) => {
    setFormData((prev) => ({
      ...prev,
      mentalHealthScreens: {
        ...prev.mentalHealthScreens,
        [screenType]: [
          ...(prev.mentalHealthScreens[screenType] || []).slice(0, index),
          value,
          ...(prev.mentalHealthScreens[screenType] || []).slice(index + 1),
        ],
      },
    }));
  };

  const updateAssessmentResponse = (assessmentId, questionId, rawValue) => {
    setFormData((prev) => {
      const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
      const existingResponses = prev.assessments.responses[assessmentId] || {};
      const updatedResponses = {
        ...prev.assessments.responses,
        [assessmentId]: {
          ...existingResponses,
          [questionId]: value,
        },
      };
      const updatedResults = {
        ...prev.assessments.results,
        [assessmentId]: scoreAssessment(
          assessmentId,
          updatedResponses[assessmentId]
        ),
      };

      return {
        ...prev,
        assessments: {
          responses: updatedResponses,
          results: updatedResults,
        },
      };
    });
  };

  // ============================================================================
  // Validation
  // ============================================================================

  const canProceed = () => {
    if (currentStep === 0) {
      const { age, gender, location, timezone } = formData.demographics;
      return age && gender && location && timezone;
    }
    if (currentStep === 1) {
      return formData.selectedGoals.length > 0;
    }
    if (currentStep === 2) {
      return Object.keys(formData.healthScreens).length === 4;
    }
    if (currentStep === 3) {
      return Object.keys(formData.mentalHealthScreens).length === 3;
    }
    if (currentStep === 4) {
      return assessmentDefinitions.every((assessment) => {
        const responses = formData.assessments.responses[assessment.id] || {};
        return assessment.questions.every(
          (question) =>
            responses[question.id] !== undefined &&
            responses[question.id] !== null
        );
      });
    }
    return true;
  };

  // ============================================================================
  // Submit
  // ============================================================================

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.ok) {
        if (onComplete) {
          onComplete();
        }
      } else {
        setError(data.error || "Failed to complete onboarding");
      }
    } catch (err) {
      setError("Error submitting onboarding");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Render Steps
  // ============================================================================

  const renderStep = () => {
    if (!template) return null;

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {STEPS[currentStep]}
          </h2>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>

        {/* Step Content */}
        {currentStep === 0 && renderDemographics()}
        {currentStep === 1 && renderGoals()}
        {currentStep === 2 && renderHealthScreens()}
        {currentStep === 3 && renderMentalHealthScreens()}
        {currentStep === 4 && renderAssessments()}
      </motion.div>
    );
  };

  const renderDemographics = () => {
    const fields = template?.demographics?.fields || [];

    return (
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === "number" && (
              <input
                type="number"
                min={field.min}
                max={field.max}
                value={formData.demographics[field.name] || ""}
                onChange={(e) =>
                  updateDemographic(field.name, parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            )}
            {field.type === "text" && (
              <input
                type="text"
                placeholder={field.placeholder}
                value={formData.demographics[field.name] || ""}
                onChange={(e) => updateDemographic(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            )}
            {field.type === "select" && (
              <select
                value={formData.demographics[field.name] || ""}
                onChange={(e) => updateDemographic(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderGoals = () => {
    const pillars = template?.goals?.pillars || [];

    return (
      <div className="space-y-6">
        <p className="text-gray-600">{template?.goals?.description}</p>
        <div className="space-y-4">
          {pillars.map((pillar) => (
            <div key={pillar.name}>
              <h3 className="font-semibold text-gray-900 mb-3 capitalize">
                {pillar.label}
              </h3>
              <div className="space-y-2">
                {pillar.goals.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(pillar.name, goal)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                      formData.selectedGoals.some(
                        (g) => g.pillar === pillar.name && g.goal === goal
                      )
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          formData.selectedGoals.some(
                            (g) => g.pillar === pillar.name && g.goal === goal
                          )
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.selectedGoals.some(
                          (g) => g.pillar === pillar.name && g.goal === goal
                        ) && <Check size={16} className="text-white" />}
                      </div>
                      <span className="text-gray-700">{goal}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500">
          Selected: {formData.selectedGoals.length}/3 goals
        </p>
      </div>
    );
  };

  const renderHealthScreens = () => {
    const questions = template?.healthScreens?.questions || [];

    return (
      <div className="space-y-6">
        <p className="text-gray-600">{template?.healthScreens?.description}</p>
        {questions.map((question) => (
          <div key={question.id}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {question.question}
            </label>
            {question.type === "number" && (
              <div className="space-y-2">
                <input
                  type="range"
                  min={question.range?.[0]}
                  max={question.range?.[1]}
                  value={
                    formData.healthScreens[question.id] ||
                    question.range?.[0] ||
                    1
                  }
                  onChange={(e) =>
                    updateHealthScreen(question.id, parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{question.labels?.[0]}</span>
                  <span className="font-semibold text-indigo-600">
                    {formData.healthScreens[question.id] || question.range?.[0]}
                  </span>
                  <span>{question.labels?.[question.range?.[1] - 1]}</span>
                </div>
              </div>
            )}
            {question.type === "boolean" && (
              <div className="flex gap-3">
                {[true, false].map((val) => (
                  <button
                    key={val}
                    onClick={() => updateHealthScreen(question.id, val)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                      formData.healthScreens[question.id] === val
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            )}
            {question.type === "select" && (
              <select
                value={formData.healthScreens[question.id] || ""}
                onChange={(e) =>
                  updateHealthScreen(question.id, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="">Select option</option>
                {question.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderMentalHealthScreens = () => {
    const screens = template?.mentalHealthScreens || {};

    return (
      <div className="space-y-8">
        {Object.entries(screens).map(([screenType, screen]) => (
          <div key={screenType} className="border-b pb-6 last:border-b-0">
            <h3 className="font-semibold text-gray-900 mb-4">{screen.label}</h3>
            <div className="space-y-4">
              {screen.questions.map((question, index) => (
                <div key={index}>
                  <label className="block text-sm text-gray-700 mb-2">
                    {question}
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() =>
                          updateMentalHealthScreen(screenType, index, val)
                        }
                        className={`flex-1 py-2 rounded-lg font-medium transition ${
                          formData.mentalHealthScreens[screenType]?.[index] ===
                          val
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAssessments = () => {
    const assessmentState = formData.assessments || {
      responses: {},
      results: {},
    };

    return (
      <div className="space-y-8">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-indigo-900">
          <p className="font-semibold">Psychometric snapshot</p>
          <p className="text-sm text-indigo-700 mt-1">
            These short, clinically-aligned questionnaires help NorthStar
            personalize recommendations.
          </p>
        </div>

        {assessmentDefinitions.map((assessment) => {
          const responses = assessmentState.responses[assessment.id] || {};
          const result = assessmentState.results[assessment.id];
          const completionRatio =
            assessment.questions.length > 0
              ? Math.round(
                  (Object.keys(responses).length /
                    assessment.questions.length) *
                    100
                )
              : 0;
          const domainLabel = assessment.domain.replace(/[-_]/g, " ");

          return (
            <div
              key={assessment.id}
              className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
                    {domainLabel}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {assessment.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {assessment.description}
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  {completionRatio === 100 && result ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                      <span className="font-semibold">{result.score}</span>
                      <span>/ {result.totalPossible}</span>
                      {result.severity && (
                        <span className="text-xs uppercase tracking-wide">
                          {result.severity}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                      Progress {completionRatio}%
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {assessment.questions.map((question) => {
                  const options =
                    question.responseOptions || assessment.responseOptions;
                  const selectedValue = responses[question.id];
                  return (
                    <div key={question.id}>
                      <p className="text-sm font-medium text-gray-800 mb-2">
                        {question.prompt}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {options.map((option) => {
                          const isSelected = selectedValue === option.value;
                          return (
                            <button
                              key={`${question.id}-${option.value}`}
                              type="button"
                              onClick={() =>
                                updateAssessmentResponse(
                                  assessment.id,
                                  question.id,
                                  option.value
                                )
                              }
                              className={`px-3 py-2 text-sm rounded-lg border transition text-left ${
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "bg-white border-gray-200 hover:border-gray-400"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
              Back
            </button>

            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Complete Onboarding
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                Next
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          {/* Step Indicator */}
          <div className="flex gap-2 mt-6 justify-center">
            {STEPS.map((step, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition ${
                  index < currentStep
                    ? "bg-indigo-600"
                    : index === currentStep
                    ? "bg-indigo-400"
                    : "bg-gray-300"
                }`}
                style={{
                  width:
                    index < currentStep
                      ? "20px"
                      : index === currentStep
                      ? "24px"
                      : "16px",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
