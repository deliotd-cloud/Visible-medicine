export type EducationSnapshotPermissions = {
  staffWorkspace: boolean;
  contentSafety: boolean;
  learnerAdministration: boolean;
  assessmentScripts: boolean;
  auditTrail: boolean;
  analytics: boolean;
  accommodations: boolean;
};

export function educationSnapshotPermissions(
  roles: readonly string[],
): EducationSnapshotPermissions {
  const has = (...required: string[]) =>
    required.some((role) => roles.includes(role));
  const administrator = has("administrator");
  const instructor = has("instructor");
  const examiner = has("examiner");
  return {
    staffWorkspace: administrator || instructor || examiner,
    contentSafety: administrator || instructor,
    learnerAdministration: administrator || instructor,
    assessmentScripts: administrator || examiner,
    auditTrail: administrator,
    analytics: administrator || instructor || examiner,
    accommodations: administrator || instructor || examiner,
  };
}
