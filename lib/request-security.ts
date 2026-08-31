export function isSameOriginMutation(request: Pick<Request, "url" | "headers">) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function isJsonRequest(request: Pick<Request, "headers">) {
  return (request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}
