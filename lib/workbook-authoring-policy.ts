const EDUCATOR_ROLES = new Set(["instructor", "examiner", "administrator"]);

export type WorkbookAuthoringDecision =
  | { allowed: true; editable: boolean; reason: "editable" | "read-only" }
  | {
      allowed: false;
      editable: false;
      reason: "role-required" | "studio-disabled" | "not-owned";
    };

export function decideWorkbookAuthoringAccess(input: {
  roles: string[];
  studioAccess: boolean;
  activeOrganizationId: string;
  ownerOrganizationId: string;
  status: string;
}): WorkbookAuthoringDecision {
  if (!input.roles.some((role) => EDUCATOR_ROLES.has(role)))
    return { allowed: false, editable: false, reason: "role-required" };
  if (!input.studioAccess)
    return { allowed: false, editable: false, reason: "studio-disabled" };
  if (
    !input.activeOrganizationId ||
    input.activeOrganizationId !== input.ownerOrganizationId
  )
    return { allowed: false, editable: false, reason: "not-owned" };

  const editable = ["draft", "changes-requested"].includes(input.status);
  return {
    allowed: true,
    editable,
    reason: editable ? "editable" : "read-only",
  };
}
