import { env } from "cloudflare:workers";

type TeachingLiveEnvironment = {
  TEACHING_LIVE?: DurableObjectNamespace;
};

export function teachingLiveNamespace() {
  return (env as unknown as TeachingLiveEnvironment).TEACHING_LIVE ?? null;
}

export async function notifyTeachingLiveWorkbook(workbookId: string) {
  const namespace = teachingLiveNamespace();
  if (!namespace || !workbookId) return false;
  const stub = namespace.get(namespace.idFromName(workbookId));
  const response = await stub.fetch("https://didanix-education.internal/notify", {
    method: "POST",
  });
  return response.ok;
}
