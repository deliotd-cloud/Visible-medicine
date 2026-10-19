/** SiteFrame's narrow focus policy for ordinary public page links. */
export function isPublicFocusPath(pathname: string): boolean {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/atlas/") && pathname !== "/atlas/guided-learning") return false;
  if (pathname.startsWith("/studio/")) return false;
  if (pathname.endsWith("/builder")) return false;
  const privateRoots = [
    "/workspace", "/my-learning", "/learn", "/embed",
    "/account", "/account-entry", "/auth", "/login", "/sign-in", "/signin", "/signin-with-chatgpt", "/join", "/api",
  ];
  return !privateRoots.some(root => pathname === root || pathname.startsWith(`${root}/`));
}

export type PublicFocusDecision = {
  from: string | null;
  to: string;
  linkPath: string | null;
  ageMs: number;
  active: "body" | "origin" | "elsewhere";
};

export function shouldFocusPublicRoute({ from, to, linkPath, ageMs, active }: PublicFocusDecision): boolean {
  return from !== null && from !== to && linkPath === to &&
    ageMs >= 0 && ageMs < 10_000 &&
    isPublicFocusPath(from) && isPublicFocusPath(to) &&
    (active === "body" || active === "origin");
}
