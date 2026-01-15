export const VAULT_RECORD_TYPES = {
  ASSESSMENT_RESULT: "assessment_result",
  CALENDAR_EVENT: "calendar_event",
  EMAIL_HEADER: "email_header",
  DRIVE_FILE: "drive_file",
  ONBOARDING_PROFILE: "onboarding_profile",
};

export const VAULT_RECORD_TYPE_SET = new Set(Object.values(VAULT_RECORD_TYPES));

export function isValidVaultRecordType(type) {
  return VAULT_RECORD_TYPE_SET.has(type);
}
