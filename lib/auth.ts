import { getChatGPTUser } from "@/app/chatgpt-auth";

export type AuthContext = { userId: string; externalSubject: string; email: string; displayName: string };

export async function getAuthContext(): Promise<AuthContext | null> {
  // Real education records always require the hosting boundary's signed-in user.
  // Development/staging must not silently impersonate a shared demo account.
  const user = await getChatGPTUser();
  if (user) return { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
  return null;
}

export function hasRole(roles: string[], ...required: string[]): boolean { return required.some((role) => roles.includes(role)); }
