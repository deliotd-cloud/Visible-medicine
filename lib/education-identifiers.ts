const LEGACY_CASE_IDENTIFIERS: Readonly<Record<string, string>> = {
  case_chest: "case-chest",
};

export function normalizeEducationCaseId(value: string) {
  return LEGACY_CASE_IDENTIFIERS[value] ?? value;
}
