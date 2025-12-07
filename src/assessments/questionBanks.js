const FOUR_POINT_FREQUENCY = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

const FIVE_POINT_FREQUENCY = [
  { label: "Never", value: 0 },
  { label: "Rarely", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Often", value: 3 },
  { label: "Very often", value: 4 },
];

const AGREEMENT_OPTIONS = [
  { label: "Strongly disagree", value: 0 },
  { label: "Disagree", value: 1 },
  { label: "Neutral", value: 2 },
  { label: "Agree", value: 3 },
  { label: "Strongly agree", value: 4 },
];

const YES_NO = [
  { label: "No", value: 0 },
  { label: "Yes", value: 1 },
];

export const ASSESSMENT_IDS = {
  ADHD: "adhd",
  AQ10: "aq10",
  PHQ9: "phq9",
  GAD7: "gad7",
  SLEEP: "sleep_hygiene",
  DIET: "diet_quality",
  EXERCISE: "exercise_readiness",
  SOCIAL: "social_support",
};

const baseMeta = ({
  id,
  name,
  domain,
  description,
  responseOptions,
  length,
  notes,
}) => ({
  id,
  name,
  domain,
  description,
  responseOptions,
  length,
  notes,
});

const mapPrompts = (prefix, prompts) =>
  prompts.map((prompt, index) => ({ id: `${prefix}_${index + 1}`, prompt }));

export const QUESTION_BANKS = {
  [ASSESSMENT_IDS.PHQ9]: {
    ...baseMeta({
      id: ASSESSMENT_IDS.PHQ9,
      name: "PHQ-9 Mood Survey",
      domain: "mental_health",
      description: "Screens for depressive symptoms over the past two weeks.",
      responseOptions: FOUR_POINT_FREQUENCY,
      length: 9,
      notes: "Adapted for self-guided onboarding.",
    }),
    severityBands: [
      { label: "Minimal", range: [0, 4] },
      { label: "Mild", range: [5, 9] },
      { label: "Moderate", range: [10, 14] },
      { label: "Moderately severe", range: [15, 19] },
      { label: "Severe", range: [20, 27] },
    ],
    questions: mapPrompts("phq9_q", [
      "Little interest or pleasure in activities",
      "Feeling down, hopeless, or discouraged",
      "Sleep changes (too much or too little)",
      "Low energy or fatigue",
      "Appetite or weight changes",
      "Feeling like a failure or letting yourself down",
      "Trouble concentrating on reading, work, or screens",
      "Moving or speaking noticeably slower or faster",
      "Thoughts of self-harm or that you are better off gone",
    ]),
  },
  [ASSESSMENT_IDS.GAD7]: {
    ...baseMeta({
      id: ASSESSMENT_IDS.GAD7,
      name: "GAD-7 Anxiety",
      domain: "mental_health",
      description: "Measures the severity of core anxiety symptoms.",
      responseOptions: FOUR_POINT_FREQUENCY,
      length: 7,
    }),
    severityBands: [
      { label: "Minimal", range: [0, 4] },
      { label: "Mild", range: [5, 9] },
      { label: "Moderate", range: [10, 14] },
      { label: "Severe", range: [15, 21] },
    ],
    questions: mapPrompts("gad7_q", [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying about different situations",
      "Trouble relaxing",
      "Restlessness that makes it hard to sit still",
      "Becoming easily annoyed or irritated",
      "Feeling afraid that something awful might happen",
    ]),
  },
  [ASSESSMENT_IDS.ADHD]: {
    ...baseMeta({
      id: ASSESSMENT_IDS.ADHD,
      name: "ADHD Focus Screener",
      domain: "neurodiversity",
      description:
        "Brief screener for attention, regulation, and impulsivity patterns.",
      responseOptions: FIVE_POINT_FREQUENCY,
      length: 6,
    }),
    severityBands: [
      { label: "Low likelihood", range: [0, 11] },
      { label: "Possible traits", range: [12, 17] },
      { label: "Elevated traits", range: [18, 24] },
    ],
    questions: mapPrompts("adhd_q", [
      "How often do you have difficulty sustaining attention on boring or repetitive tasks?",
      "How often do you misplace things like keys, cards, or your phone?",
      "How often do you avoid or delay tasks that require sustained mental effort?",
      "How often do you feel fidgety or the need to move when you should stay seated?",
      "How often do you interrupt others before they finish speaking?",
      "How often do you leave projects unfinished because something else caught your interest?",
    ]),
  },
  [ASSESSMENT_IDS.AQ10]: {
    ...baseMeta({
      id: ASSESSMENT_IDS.AQ10,
      name: "Autism Spectrum Quotient (AQ-10)",
      domain: "neurodiversity",
      description:
        "Ten-item screener that highlights autistic traits in adults.",
      responseOptions: AGREEMENT_OPTIONS,
      length: 10,
      notes: "Agreement with the statements suggests autistic traits.",
    }),
    severityBands: [
      { label: "Typical range", range: [0, 5] },
      { label: "Elevated traits", range: [6, 10] },
    ],
    questions: mapPrompts("aq10_q", [
      "Keeping track of multiple conversations is difficult for me.",
      "I prefer to do things the same way every time.",
      "I frequently notice small sounds that others miss.",
      "I find social situations exhausting rather than energizing.",
      "I prefer to focus on the details rather than the big picture.",
      "I find it hard to shift my plans once I have committed to them.",
      "I would rather talk about my interests than make small talk.",
      "It is challenging to infer what someone is thinking or feeling.",
      "Maintaining eye contact during conversations feels uncomfortable.",
      "I rely on routines to feel calm and grounded.",
    ]),
  },
  [ASSESSMENT_IDS.SLEEP]: {
    ...baseMeta({
      id: ASSESSMENT_IDS.SLEEP,
      name: "Sleep Hygiene Index",
      domain: "sleep",
      description: "Evaluates behaviors that help or hinder restorative sleep.",
      responseOptions: FIVE_POINT_FREQUENCY,
      length: 6,
    }),
    severityBands: [
      { label: "Aligned routine", range: [0, 9] },
      { label: "Needs consistency", range: [10, 15] },
      { label: "Sleep hygiene risk", range: [16, 24] },
    ],
    questions: mapPrompts("sleep_q", [
      "I consume caffeine within six hours of bedtime.",
      "I use screens in bed right before trying to sleep.",
      "My sleep and wake times change by more than two hours on different days.",
      "I work, study, or eat in bed.",
      "I go to bed only when I feel exhausted.",
      "I wake up during the night and check my phone or messages.",
    ]),
  },
  [ASSESSMENT_IDS.DIET]: {
    ...baseMeta({
      id: ASSESSMENT_IDS.DIET,
      name: "Diet Quality Pulse",
      domain: "nutrition",
      description:
        "Quick look at nourishment, balance, and mindful eating habits.",
      responseOptions: FIVE_POINT_FREQUENCY,
      length: 6,
    }),
    severityBands: [
      { label: "Thriving", range: [18, 24] },
      { label: "Balanced", range: [12, 17] },
      { label: "Needs attention", range: [0, 11] },
    ],
    questions: mapPrompts("diet_q", [
      "I eat at least five servings of colorful fruits or vegetables each day.",
      "I include lean protein or plant protein with most meals.",
      "I drink water consistently throughout the day.",
      "I limit ultra-processed or fast foods.",
      "I eat mindfully without multitasking.",
      "I plan meals or snacks that keep me energized.",
    ]),
  },
  [ASSESSMENT_IDS.EXERCISE]: {
    ...baseMeta({
      id: ASSESSMENT_IDS.EXERCISE,
      name: "Exercise Readiness",
      domain: "fitness",
      description:
        "Assesses confidence, energy, and safety for physical training.",
      responseOptions: AGREEMENT_OPTIONS,
      length: 5,
    }),
    severityBands: [
      { label: "Ready to train", range: [15, 20] },
      { label: "Build momentum", range: [8, 14] },
      { label: "Start gently", range: [0, 7] },
    ],
    questions: mapPrompts("exercise_q", [
      "I feel physically safe increasing my activity level.",
      "I can set aside at least 20 focused minutes for movement most days.",
      "I recover well between workouts or busy days.",
      "I have access to the space or equipment I need.",
      "I have clear reasons that motivate me to stay active.",
    ]),
  },
  [ASSESSMENT_IDS.SOCIAL]: {
    ...baseMeta({
      id: ASSESSMENT_IDS.SOCIAL,
      name: "Social Support Index",
      domain: "relationships",
      description:
        "Measures perceived emotional, practical, and community support.",
      responseOptions: AGREEMENT_OPTIONS,
      length: 6,
    }),
    severityBands: [
      { label: "Strong network", range: [18, 24] },
      { label: "Developing support", range: [11, 17] },
      { label: "Isolated", range: [0, 10] },
    ],
    questions: mapPrompts("social_q", [
      "I have people who celebrate my wins with me.",
      "There is someone I can call in a crisis.",
      "I feel a sense of belonging in at least one community.",
      "I can ask for practical help when life gets busy.",
      "I feel understood when I share my worries.",
      "I have regular quality time with friends or loved ones.",
    ]),
  },
};

export const ASSESSMENT_SEQUENCE = [
  ASSESSMENT_IDS.PHQ9,
  ASSESSMENT_IDS.GAD7,
  ASSESSMENT_IDS.ADHD,
  ASSESSMENT_IDS.AQ10,
  ASSESSMENT_IDS.SLEEP,
  ASSESSMENT_IDS.DIET,
  ASSESSMENT_IDS.EXERCISE,
  ASSESSMENT_IDS.SOCIAL,
];

export function getAssessmentDefinitions() {
  return ASSESSMENT_SEQUENCE.map((id) => QUESTION_BANKS[id]);
}

export function getAssessmentDefinition(id) {
  return QUESTION_BANKS[id];
}
