import type { AuthContext } from "@/lib/auth";

export const NEW_EDUCATION_USER_ROLES = "learner";
export const LOCAL_DEMO_EDUCATION_ROLES =
  "administrator,instructor,examiner,learner";

export type EducationUserProvisioningDecision = {
  roles: string;
  localDemo: boolean;
};

export function isLocalDemoEducationIdentity(
  auth: Pick<AuthContext, "userId" | "externalSubject">,
  nodeEnvironment: string | undefined,
) {
  return (
    nodeEnvironment !== "production" &&
    auth.userId === "edu:local-demo-user" &&
    auth.externalSubject === "local:demo-user"
  );
}

export function decideEducationUserProvisioning(
  existingRoles: string | null | undefined,
  auth: Pick<AuthContext, "userId" | "externalSubject" | "email">,
  nodeEnvironment: string | undefined,
): EducationUserProvisioningDecision {
  const localDemo = isLocalDemoEducationIdentity(auth, nodeEnvironment);
  const evaluationAdministrators = (process.env.ELIVION_EVALUATION_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const evaluationAdministrator =
    nodeEnvironment === "production" &&
    evaluationAdministrators.includes(auth.email.trim().toLowerCase());
  return {
    roles:
      existingRoles ??
      (localDemo || evaluationAdministrator
        ? LOCAL_DEMO_EDUCATION_ROLES
        : NEW_EDUCATION_USER_ROLES),
    localDemo,
  };
}
