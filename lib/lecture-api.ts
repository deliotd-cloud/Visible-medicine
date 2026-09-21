import { EducationApiError } from "@/lib/education-api";
import { LectureError } from "@/lib/lecture-repository";
import { isSameOriginMutation } from "@/lib/request-security";

export async function readLectureRequest(request: Request): Promise<Record<string,unknown>> {
  if(!isSameOriginMutation(request)) throw new LectureError("Cross-origin lecture changes are not allowed.",403);
  if(request.headers.get("content-type")?.split(";",1)[0].trim().toLowerCase()!=="application/json")
    throw new LectureError("Use a JSON request.",415);
  if(Number(request.headers.get("content-length")??0)>64_000 || !request.body)
    throw new LectureError("The lecture request is empty or too large.",413);
  const reader=request.body.getReader(); const decoder=new TextDecoder("utf-8",{fatal:true});
  let bytes=0; let text="";
  try {
    while(true) {
      const {done,value}=await reader.read(); if(done) break;
      bytes+=value.byteLength;
      if(bytes>64_000) { await reader.cancel(); throw new LectureError("The lecture request is too large.",413); }
      text+=decoder.decode(value,{stream:true});
    }
    text+=decoder.decode();
    const input:unknown=JSON.parse(text);
    if(!input || typeof input!=="object" || Array.isArray(input)) throw new Error("object required");
    return input as Record<string,unknown>;
  } catch(error) {
    if(error instanceof LectureError) throw error;
    throw new LectureError("A valid JSON object is required.",422);
  } finally { reader.releaseLock(); }
}

export function lectureApiFailure(error: unknown) {
  const headers={"Cache-Control":"private, no-store"};
  if(error instanceof LectureError || error instanceof EducationApiError)
    return Response.json({error:error.message},{status:error.status,headers});
  console.error("Lecture request failed",{type:error instanceof Error?error.name:"unknown"});
  return Response.json({error:"The lecture service could not complete this request."},{status:500,headers});
}
