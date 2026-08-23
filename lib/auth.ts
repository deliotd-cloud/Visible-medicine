import { getChatGPTUser } from "@/app/chatgpt-auth";

export type AuthContext = { userId: string; externalSubject: string; email: string; displayName: string };

export async function getAuthContext(): Promise<AuthContext | null> {
  const user = await getChatGPTUser();
  if (user) return { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
  if (process.env.NODE_ENV !== "production") return { userId: "edu:local-demo-user", externalSubject: "local:demo-user", email: "avery.morgan@example.edu", displayName: "Avery Morgan" };
  return null;
}

export function hasRole(roles: string[], ...required: string[]): boolean { return required.some((role) => roles.includes(role)); }
