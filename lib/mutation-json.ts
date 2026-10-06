import { isSameOriginMutation } from "@/lib/request-security";

type MutationJsonOptions = {
  maxBytes: number;
  error: (message: string, status: number) => Error;
  crossOriginMessage: string;
  jsonMessage: string;
};

/** Streams UTF-8 bytes before parsing; caller supplies its existing domain error. */
export async function readBoundedMutationJson(
  request: Request,
  { maxBytes, error, crossOriginMessage, jsonMessage }: MutationJsonOptions,
): Promise<Record<string, unknown>> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1)
    throw error("The request size configuration is invalid.", 500);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let refusal: Error | undefined;
  const refuse = (message: string, status: number): never => {
    refusal = error(message, status);
    throw refusal;
  };
  try {
    reader = request.body?.getReader();
    if (!isSameOriginMutation(request)) refuse(crossOriginMessage, 403);
    const mediaType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (mediaType !== "application/json") refuse(jsonMessage, 415);
    // This header is an early hint only. Actual streamed bytes enforce the limit.
    if (Number(request.headers.get("content-length") ?? 0) > maxBytes)
      refuse("The request is too large.", 413);
    if (!reader) refuse("A valid JSON object is required.", 422);
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bytes = 0;
    let text = "";
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) refuse("The request is too large.", 413);
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const input: unknown = JSON.parse(text);
    if (!input || typeof input !== "object" || Array.isArray(input))
      refuse("A valid JSON object is required.", 422);
    return input as Record<string, unknown>;
  } catch (cause) {
    if (reader) {
      try { await reader.cancel(); } catch { /* Preserve refusal if cancellation fails. */ }
    }
    if (refusal && cause === refusal) throw cause;
    throw error("A valid JSON object is required.", 422);
  } finally {
    reader?.releaseLock();
  }
}
