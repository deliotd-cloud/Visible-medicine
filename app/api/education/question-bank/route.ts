import {
  authenticateEducationApi,
  educationApiErrorResponse,
  readEducationJson,
} from "@/lib/education-api";
import {
  archiveQuestionBankItem,
  createQuestionBankItem,
  getQuestionBank,
  importQuestionBank,
} from "@/lib/question-bank-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    return Response.json(
      await getQuestionBank(await authenticateEducationApi(), {
        modality: query.get("modality") ?? "",
        difficulty: query.get("difficulty") ?? "",
        tag: query.get("tag") ?? "",
      }),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readEducationJson(request, 160_000);
    const auth = await authenticateEducationApi();
    if (payload.action === "create")
      return Response.json(await createQuestionBankItem(auth, payload.item));
    if (payload.action === "archive")
      return Response.json(
        await archiveQuestionBankItem(auth, payload.id, payload.expectedVersion),
      );
    if (payload.action === "import-qti")
      return Response.json(await importQuestionBank(auth, payload.xml));
    return Response.json({ error: "Unknown question bank action." }, { status: 404 });
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}
