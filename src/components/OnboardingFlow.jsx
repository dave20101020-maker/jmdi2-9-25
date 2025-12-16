/**
 * OnboardingFlow Component
 *
 * Multi-step onboarding wizard:
 * 1. Demographics
 * 2. Goals Selection
 * 3. Health Screens
 * 4. Mental Health Screens
 * 5. Psychometric Assessments
 * 6. Psychology Intake
 * 7. Consent Review
 *
 * Usage:
 *   <OnboardingFlow onComplete={() => navigate('/dashboard')} />
 */

import React, { useState, useEffect, useMemo } from "react";
import { normalizeErrorMessage } from "@/utils/normalizeErrorMessage";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { api } from "@/utils/apiClient";
import { getAssessmentDefinitions, scoreAssessment } from "@/assessments";

const createDefaultPsychologyState = () => ({
  physiology: {
    heightCm: "",
    weightKg: "",
    age: "",
    sex: "",
  },
  sleepChronotype: {
    type: "",
    chronotypeScore: null,
    preferredSleepWindow: {
      start: "",
      end: "",
    },
    wakeTime: "",
    windDownTime: "",
  },
  comBProfile: {
    capability: null,
    opportunity: null,
    motivation: null,
    limitingBeliefs: [],
    accelerators: [],
    frictionPoints: [],
    narrativeSummary: "",
  },
  cognitiveDistortions: {
    totalScore: null,
    severity: "",
    endorsedPatterns: [],
    copingStatements: [],
    notes: "",
  },
  stressIndex: {
    score: null,
    severity: "",
    topTriggers: [],
    regulationCapacity: null,
    recoveryAssets: [],
    notes: "",
  },
  moodBaseline: {
    average: null,
    variability: null,
    descriptors: [],
    supportiveFactors: [],
    challengeAreas: [],
    notes: "",
  },
  habitAdherence: {
    profile: "",
    adherenceScore: null,
    consistency: null,
    frictionPoints: [],
    enablingFactors: [],
    notes: "",
  },
  dopamineReward: {
    calibrationScore: null,
    sensitivityLevel: "",
    rewardDrivers: [],
    cautionFlags: [],
    notes: "",
  },
  overwhelmThreshold: {
    thresholdScore: null,
    riskLevel: "",
    earlySignals: [],
    recoveryStrategies: [],
    notes: "",
  },
  responses: {},
});

const mergePsychologyState = (defaults, incoming) => {
  if (!incoming) {
    return defaults;
  }

  const mergeValue = (base, value) => {
    if (Array.isArray(value)) {
      return [...value];
    }
    if (value && typeof value === "object") {
      const next = Array.isArray(base) ? [] : { ...base };
      Object.entries(value).forEach(([key, nested]) => {
        next[key] = mergeValue(base?.[key], nested);
      });
      return next;
    }
    return value;
  };

  const result = mergeValue(defaults, incoming);
  return result;
};

const getNestedValue = (object, path) => {
  if (!object || !path) return undefined;
  return path.split(".").reduce((acc, segment) => {
    if (acc === undefined || acc === null) return undefined;
    return acc[segment];
  }, object);
};

const setNestedValue = (source, path, value) => {
  const segments = path.split(".");
  const clone = { ...source };
  let cursor = clone;
  let sourceCursor = source || {};

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = Array.isArray(value) ? [...value] : value;
      return;
    }

    const nextSource =
      sourceCursor && typeof sourceCursor === "object"
        ? sourceCursor[segment]
        : undefined;

    const nextValue = Array.isArray(nextSource)
      ? [...nextSource]
      : nextSource && typeof nextSource === "object"
      ? { ...nextSource }
      : {};

    cursor[segment] = nextValue;
    cursor = cursor[segment];
    sourceCursor =
      nextSource && typeof nextSource === "object" ? nextSource : {};
  });

  return clone;
};

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeOptions = (options = []) =>
  options.map((option) => {
    if (typeof option === "string") {
      return { value: option, label: option };
    }
    return {
      value: option?.value ?? option?.label ?? "",
      label: option?.label ?? option?.value ?? "",
    };
  });

const STEPS = [
  "Demographics",
  "Goals",
  "Health",
  "Mental Health",
  "Assessments",
  "Psychology",
  "Consents",
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
    consents: {},
  });
  const [psychologyData, setPsychologyData] = useState(() =>
    createDefaultPsychologyState()
  );
  const [tagInputs, setTagInputs] = useState({});
  const [consentWarning, setConsentWarning] = useState(false);

  const assessmentDefinitions = useMemo(() => getAssessmentDefinitions(), []);

  // ============================================================================
  // Load Template
  // ============================================================================

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const templatePromise = api.getOnboardingTemplate();
        const psychologyPromise = api.getPsychologyProfile().catch((error) => {
          if (error?.status === 451 && isMounted) {
            setConsentWarning(true);
            return null;
          }
          if (error?.status === 404) {
            return null;
          }
          throw error;
        });

        const [templatePayload, psychologyPayload] = await Promise.all([
          templatePromise,
          psychologyPromise,
        ]);

        if (!isMounted) return;

        if (templatePayload?.ok) {
          setTemplate(templatePayload.template);
        } else if (templatePayload && !templatePayload?.ok) {
          setError("Failed to load onboarding template");
        }

        if (psychologyPayload?.psychologyProfile) {
          setPsychologyData(
            mergePsychologyState(
              createDefaultPsychologyState(),
              psychologyPayload.psychologyProfile
            )
          );
        }
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Failed to load onboarding data");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const requirements = template?.consents?.requirements;
    if (!requirements?.length) {
      return;
    }

    setFormData((prev) => {
      const nextConsents = { ...(prev.consents || {}) };
      let mutated = false;

      requirements.forEach((requirement) => {
        if (!nextConsents[requirement.id]) {
          mutated = true;
          nextConsents[requirement.id] = {
            accepted: false,
            version: requirement.version,
            timestamp: null,
          };
        }
      });

      if (!mutated) {
        return prev;
      }

      return {
        ...prev,
        consents: nextConsents,
      };
    });
  }, [template]);

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

  const applyPsychologyUpdateInternal = (state, path, value) => {
    const nextState = setNestedValue(state, path, value);
    const responses = { ...(state.responses || {}) };
    responses[path] = Array.isArray(value) ? [...value] : value;
    nextState.responses = responses;
    return nextState;
  };

  const setPsychologyValue = (path, value) => {
    setPsychologyData((prev) =>
      applyPsychologyUpdateInternal(prev, path, value)
    );
  };

  const handleToggleMultiSelect = (path, optionValue) => {
    setPsychologyData((prev) => {
      const existing = getNestedValue(prev, path) || [];
      const nextArray = existing.includes(optionValue)
        ? existing.filter((item) => item !== optionValue)
        : [...existing, optionValue];
      return applyPsychologyUpdateInternal(prev, path, nextArray);
    });
  };

  const handleTagInputChange = (path, value) => {
    setTagInputs((prev) => ({ ...prev, [path]: value }));
  };

  const handleAddTag = (path) => {
    const candidate = (tagInputs[path] || "").trim();
    if (!candidate) return;

    setPsychologyData((prev) => {
      const existing = getNestedValue(prev, path) || [];
      if (existing.includes(candidate)) {
        return prev;
      }
      const nextArray = [...existing, candidate];
      return applyPsychologyUpdateInternal(prev, path, nextArray);
    });

    setTagInputs((prev) => ({ ...prev, [path]: "" }));
  };

  const handleRemoveTag = (path, tag) => {
    setPsychologyData((prev) => {
      const existing = getNestedValue(prev, path) || [];
      const nextArray = existing.filter((item) => item !== tag);
      return applyPsychologyUpdateInternal(prev, path, nextArray);
    });
  };

  const handleConsentToggle = (consentId, accepted, version) => {
    setFormData((prev) => {
      const consents = { ...(prev.consents || {}) };
      consents[consentId] = {
        ...(consents[consentId] || {}),
        accepted,
        version,
        timestamp: accepted ? new Date().toISOString() : null,
      };

      return {
        ...prev,
        consents,
      };
    });
  };

  const buildPsychologyPayload = () => {
    const preferredWindow =
      psychologyData.sleepChronotype?.preferredSleepWindow || {};

    return {
      physiology: {
        heightCm: toNumberOrNull(psychologyData.physiology?.heightCm),
        weightKg: toNumberOrNull(psychologyData.physiology?.weightKg),
        age: toNumberOrNull(psychologyData.physiology?.age),
        sex: psychologyData.physiology?.sex || null,
        notes: psychologyData.physiology?.notes || null,
      },
      sleepChronotype: {
        type: psychologyData.sleepChronotype?.type || null,
        chronotypeScore: toNumberOrNull(
          psychologyData.sleepChronotype?.chronotypeScore
        ),
        preferredSleepWindow: {
          start: preferredWindow.start || null,
          end: preferredWindow.end || null,
        },
        wakeTime: psychologyData.sleepChronotype?.wakeTime || null,
        windDownTime: psychologyData.sleepChronotype?.windDownTime || null,
        notes: psychologyData.sleepChronotype?.notes || null,
      },
      comBProfile: {
        capability: toNumberOrNull(psychologyData.comBProfile?.capability),
        opportunity: toNumberOrNull(psychologyData.comBProfile?.opportunity),
        motivation: toNumberOrNull(psychologyData.comBProfile?.motivation),
        limitingBeliefs: psychologyData.comBProfile?.limitingBeliefs || [],
        accelerators: psychologyData.comBProfile?.accelerators || [],
        frictionPoints: psychologyData.comBProfile?.frictionPoints || [],
        narrativeSummary: psychologyData.comBProfile?.narrativeSummary || null,
      },
      cognitiveDistortions: {
        totalScore: toNumberOrNull(
          psychologyData.cognitiveDistortions?.totalScore
        ),
        severity: psychologyData.cognitiveDistortions?.severity || null,
        endorsedPatterns:
          psychologyData.cognitiveDistortions?.endorsedPatterns || [],
        copingStatements:
          psychologyData.cognitiveDistortions?.copingStatements || [],
        notes: psychologyData.cognitiveDistortions?.notes || null,
      },
      stressIndex: {
        score: toNumberOrNull(psychologyData.stressIndex?.score),
        severity: psychologyData.stressIndex?.severity || null,
        topTriggers: psychologyData.stressIndex?.topTriggers || [],
        regulationCapacity: toNumberOrNull(
          psychologyData.stressIndex?.regulationCapacity
        ),
        recoveryAssets: psychologyData.stressIndex?.recoveryAssets || [],
        notes: psychologyData.stressIndex?.notes || null,
      },
      moodBaseline: {
        average: toNumberOrNull(psychologyData.moodBaseline?.average),
        variability: toNumberOrNull(psychologyData.moodBaseline?.variability),
        descriptors: psychologyData.moodBaseline?.descriptors || [],
        supportiveFactors: psychologyData.moodBaseline?.supportiveFactors || [],
        challengeAreas: psychologyData.moodBaseline?.challengeAreas || [],
        notes: psychologyData.moodBaseline?.notes || null,
      },
      habitAdherence: {
        profile: psychologyData.habitAdherence?.profile || null,
        adherenceScore: toNumberOrNull(
          psychologyData.habitAdherence?.adherenceScore
        ),
        consistency: toNumberOrNull(psychologyData.habitAdherence?.consistency),
        frictionPoints: psychologyData.habitAdherence?.frictionPoints || [],
        enablingFactors: psychologyData.habitAdherence?.enablingFactors || [],
        notes: psychologyData.habitAdherence?.notes || null,
      },
      dopamineReward: {
        calibrationScore: toNumberOrNull(
          psychologyData.dopamineReward?.calibrationScore
        ),
        sensitivityLevel:
          psychologyData.dopamineReward?.sensitivityLevel || null,
        rewardDrivers: psychologyData.dopamineReward?.rewardDrivers || [],
        cautionFlags: psychologyData.dopamineReward?.cautionFlags || [],
        notes: psychologyData.dopamineReward?.notes || null,
      },
      overwhelmThreshold: {
        thresholdScore: toNumberOrNull(
          psychologyData.overwhelmThreshold?.thresholdScore
        ),
        riskLevel: psychologyData.overwhelmThreshold?.riskLevel || null,
        earlySignals: psychologyData.overwhelmThreshold?.earlySignals || [],
        recoveryStrategies:
          psychologyData.overwhelmThreshold?.recoveryStrategies || [],
        notes: psychologyData.overwhelmThreshold?.notes || null,
      },
      responses: psychologyData.responses || {},
    };
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
    if (currentStep === 5) {
      const requiredFields = [
        "physiology.heightCm",
        "physiology.weightKg",
        "physiology.age",
        "physiology.sex",
        "comBProfile.capability",
        "comBProfile.opportunity",
        "comBProfile.motivation",
      ];

      return requiredFields.every((path) => {
        const value = getNestedValue(psychologyData, path);
        if (value === null || value === undefined) {
          return false;
        }
        if (typeof value === "string") {
          return value.trim() !== "";
        }
        return true;
      });
    }
    if (currentStep === 6) {
      const requirements = template?.consents?.requirements || [];
      if (!requirements.length) {
        return true;
      }
      return requirements.every(
        (requirement) => formData.consents?.[requirement.id]?.accepted
      );
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

      const psychologyPayload = buildPsychologyPayload();

      try {
        await api.submitPsychologyProfile(psychologyPayload);
      } catch (psychologyError) {
        if (psychologyError?.status === 451) {
          setConsentWarning(true);
          setError(
            "Please accept the GDPR and clinical acknowledgements before submitting sensitive assessments."
          );
          return;
        }
        throw psychologyError;
      }

      const payload = {
        demographics: formData.demographics,
        selectedGoals: formData.selectedGoals,
        healthScreens: formData.healthScreens,
        mentalHealthScreens: formData.mentalHealthScreens,
        assessments: formData.assessments,
        consents: formData.consents,
      };

      const response = await api.completeOnboarding(payload);

      if (response?.ok) {
        setConsentWarning(false);
        if (onComplete) {
          onComplete();
        }
      } else {
        setError(response?.error || "Failed to complete onboarding");
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Error submitting onboarding");
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
        {currentStep === 5 && renderPsychologyFlow()}
        {currentStep === 6 && renderConsents()}
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
          const domainLabel = (assessment.domain || "").replace(/[-_]/g, " ");

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

  const renderPsychologyField = (field) => {
    if (!field?.name) return null;

    const { name, label, type, helperText, min, max, unit, required } = field;

    const normalizedOptions = normalizeOptions(field.options || []);
    const rawValue = getNestedValue(psychologyData, name);

    if (type === "number") {
      return (
        <div key={name} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={rawValue ?? ""}
              min={min}
              max={max}
              onChange={(event) => setPsychologyValue(name, event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        </div>
      );
    }

    if (type === "slider") {
      const sliderMin = typeof min === "number" ? min : 0;
      const sliderMax = typeof max === "number" ? max : 100;
      const numericValue =
        typeof rawValue === "number"
          ? rawValue
          : toNumberOrNull(rawValue) ?? sliderMin;

      return (
        <div key={name} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              value={numericValue}
              onChange={(event) =>
                setPsychologyValue(name, Number(event.target.value))
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-sm text-gray-600 w-10 text-right">
              {numericValue}
            </span>
          </div>
          {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        </div>
      );
    }

    if (type === "select") {
      return (
        <div key={name} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
          <select
            value={rawValue || ""}
            onChange={(event) => setPsychologyValue(name, event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">Select option</option>
            {normalizedOptions.map((option) => (
              <option key={`${name}-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        </div>
      );
    }

    if (type === "multi-select") {
      const selections = Array.isArray(rawValue) ? rawValue : [];
      return (
        <div key={name} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="flex flex-wrap gap-2">
            {normalizedOptions.map((option) => {
              const active = selections.includes(option.value);
              return (
                <button
                  type="button"
                  key={`${name}-${option.value}`}
                  onClick={() => handleToggleMultiSelect(name, option.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition ${
                    active
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        </div>
      );
    }

    if (type === "tags") {
      const tags = Array.isArray(rawValue) ? rawValue : [];
      const inputValue = tagInputs[name] || "";

      return (
        <div key={name} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={`${name}-${tag}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(name, tag)}
                  className="text-indigo-500 hover:text-indigo-700"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(event) =>
                handleTagInputChange(name, event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  handleAddTag(name);
                }
              }}
              placeholder="Type and press Enter"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              type="button"
              onClick={() => handleAddTag(name)}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
          {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        </div>
      );
    }

    if (type === "time") {
      return (
        <div key={name} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <input
            type="time"
            value={rawValue || ""}
            onChange={(event) => setPsychologyValue(name, event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        </div>
      );
    }

    return null;
  };

  const renderPsychologyFlow = () => {
    const sections = template?.psychologyFlow?.sections || [];

    if (!sections.length) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm">
          Psychology intake configuration is unavailable. Please contact
          support.
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-indigo-900">
          <p className="font-semibold">
            {template?.psychologyFlow?.title || "Psychology"}
          </p>
          <p className="text-sm text-indigo-700 mt-1">
            {template?.psychologyFlow?.description}
          </p>
          {consentWarning && (
            <p className="text-xs text-red-600 mt-3">
              Accept the GDPR and clinical acknowledgements to store this
              intake.
            </p>
          )}
        </div>

        {sections.map((section) => (
          <div
            key={section.id}
            className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {section.label}
              </h3>
              {section.helperText && (
                <p className="text-sm text-gray-600 mt-1">
                  {section.helperText}
                </p>
              )}
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {section.fields.map((field) => renderPsychologyField(field))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderConsents = () => {
    const requirements = template?.consents?.requirements || [];

    if (!requirements.length) {
      return (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 p-4 rounded-lg text-sm">
          No additional consents required.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-indigo-900">
          <p className="font-semibold">Legal acknowledgements</p>
          <p className="text-sm text-indigo-700 mt-1">
            Review and accept so NorthStar can activate personalized support.
          </p>
        </div>
        {requirements.map((requirement) => {
          const consentState = formData.consents?.[requirement.id] || {};
          const accepted = !!consentState.accepted;

          return (
            <div
              key={requirement.id}
              className={`border rounded-2xl p-5 shadow-sm transition ${
                accepted
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
                    {requirement.id}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {requirement.title}
                  </h3>
                  <p className="text-sm text-gray-600">{requirement.summary}</p>
                  {Array.isArray(requirement.bulletPoints) &&
                    requirement.bulletPoints.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {requirement.bulletPoints.map((bullet, index) => (
                          <li key={`${requirement.id}-bullet-${index}`}>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-900">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={accepted}
                    onChange={(event) =>
                      handleConsentToggle(
                        requirement.id,
                        event.target.checked,
                        requirement.version
                      )
                    }
                  />
                  I agree
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Version {requirement.version}
              </p>
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
              {normalizeErrorMessage(error, "Unable to continue onboarding")}
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
