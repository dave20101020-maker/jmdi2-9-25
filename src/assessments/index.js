import {
  ASSESSMENT_IDS,
  QUESTION_BANKS,
  ASSESSMENT_SEQUENCE,
  getAssessmentDefinitions,
  getAssessmentDefinition,
} from "./questionBanks";
import { scoreAssessment, scoreAllAssessments } from "./scoring";

export {
  ASSESSMENT_IDS,
  QUESTION_BANKS,
  ASSESSMENT_SEQUENCE,
  getAssessmentDefinitions,
  getAssessmentDefinition,
  scoreAssessment,
  scoreAllAssessments,
};

export function getAssessmentMetadata() {
  return ASSESSMENT_SEQUENCE.map((id) => {
    const definition = QUESTION_BANKS[id];
    return {
      id: definition.id,
      name: definition.name,
      domain: definition.domain,
      length: definition.length,
      description: definition.description,
      notes: definition.notes,
    };
  });
}
