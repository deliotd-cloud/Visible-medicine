const WORKBOOK_STAFF_ROLES = new Set([
  "administrator",
  "instructor",
  "examiner",
]);

export function hasWorkbookStaffAccess(roles: readonly string[]) {
  return roles.some((role) => WORKBOOK_STAFF_ROLES.has(role));
}
