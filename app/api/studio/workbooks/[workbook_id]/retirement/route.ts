import { authenticateEducationApi, EducationApiError } from '@/lib/education-api';
import { enforceRateLimit, InstitutionOperationsError } from '@/lib/institution-operations';
import { readBoundedMutationJson } from '@/lib/mutation-json';
import { parseWorkbookRetirementRequest } from '@/lib/workbook-retirement-contract';
import { retireStudioWorkbook, WorkbookRetirementError } from '@/lib/workbook-retirement-repository';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request: Request, context: {params: Promise<{workbook_id: string}>}) {
  try {
    const auth = await authenticateEducationApi();
    await enforceRateLimit(auth.userId,'studio-write',45,60);
    const input = await readBoundedMutationJson(request, {maxBytes:8_000,
      error:(message,status) => new WorkbookRetirementError(message,status),
      crossOriginMessage:'Cross-origin Studio changes are not allowed.',jsonMessage:'Send Studio changes as JSON.'});
    const {workbook_id:id} = await context.params;
    const parsed = parseWorkbookRetirementRequest(input,id);
    if (!parsed) throw new WorkbookRetirementError('Confirm the current published version, disposition and a reason of up to 1,000 characters.',422);
    return Response.json(await retireStudioWorkbook(auth,id,parsed), {headers});
  } catch (error) {
    if (error instanceof WorkbookRetirementError || error instanceof EducationApiError || error instanceof InstitutionOperationsError)
      return Response.json({error:error.message},{status:error.status,headers});
    console.error('Visible Medicine Studio retirement error',{type:error instanceof Error ? error.name : 'unknown'});
    return Response.json({error:'Studio could not confirm this change. Refresh and check the workbook before retrying.'},{status:500,headers});
  }
}
