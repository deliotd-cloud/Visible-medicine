import type { AuthContext } from "@/lib/auth";

export const NEW_EDUCATION_USER_ROLES = "learner";
export const LOCAL_DEMO_EDUCATION_ROLES =
  "administrator,instructor,examiner,learner";

export type EducationUserProvisioningDecision = {
  roles: string;
  localDemo: boolean;
};

export function isLocalDemoEducationIdentity(
  _auth: Pick<AuthContext, "userId" | "externalSubject">,
  nodeEnvironment: string | undefined,
) {
  // Every local Sites identity is an isolated demonstration account. Granting
  // the full workspace locally keeps course, authoring and reporting previews
  // testable without weakening production provisioning.
  return nodeEnvironment !== "production";
}

export function decideEducationUserProvisioning(
  existingRoles: string | null | undefined,
  auth: Pick<AuthContext, "userId" | "externalSubject" | "email">,
  nodeEnvironment: string | undefined,
): EducationUserProvisioningDecision {
  const localDemo = isLocalDemoEducationIdentity(auth, nodeEnvironment);
  const evaluationAdministrators = (process.env.VISIBLE_MEDICINE_EVALUATION_ADMIN_EMAILS ?? process.env.ELIVION_EVALUATION_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const evaluationAdministrator =
    nodeEnvironment === "production" &&
    evaluationAdministrators.includes(auth.email.trim().toLowerCase());
  return {
    roles:
      localDemo || evaluationAdministrator
        ? LOCAL_DEMO_EDUCATION_ROLES
        : existingRoles ?? NEW_EDUCATION_USER_ROLES,
    localDemo,
  };
}
