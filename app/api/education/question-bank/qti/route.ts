import {
  authenticateEducationApi,
  educationApiErrorResponse,
} from "@/lib/education-api";
import { getQuestionBank } from "@/lib/question-bank-repository";
import { exportQuestionBankQti } from "@/lib/question-bank";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bundle = await getQuestionBank(await authenticateEducationApi());
    return new Response(exportQuestionBankQti(bundle.items), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="visible-medicine-question-bank.xml"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}
