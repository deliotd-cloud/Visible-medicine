import { authenticateEducationApi, EducationApiError } from '@/lib/education-api';
import { enforceRateLimit, InstitutionOperationsError } from '@/lib/institution-operations';
import { readBoundedMutationJson } from '@/lib/mutation-json';
import {
  WorkbookCorrectionError, workbookCorrectionId, parseWorkbookCorrectionRequest,
  parseWorkbookCorrectionReceipt, parseWorkbookCorrectionSource,
} from '@/lib/workbook-correction-contract';
import { createStudioWorkbookCorrection, getWorkbookCorrectionSource } from '@/lib/workbook-correction-repository';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
type Context = {params: Promise<{workbook_id: string}>};

function failure(error: unknown) {
  if (error instanceof WorkbookCorrectionError || error instanceof EducationApiError || error instanceof InstitutionOperationsError)
    return Response.json({error:error.message},{status:error.status,headers});
  console.error('Visible Medicine Studio correction error',{type:error instanceof Error ? error.name : 'unknown'});
  return Response.json({error:'Studio could not confirm this change. Refresh and check the workbook before retrying.'},{status:500,headers});
}

async function routeId(context: Context) {
  const id = (await context.params).workbook_id;
  if (!workbookCorrectionId(id)) throw new WorkbookCorrectionError('A valid workbook ID is required.',422);
  return id;
}

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await authenticateEducationApi();
    await enforceRateLimit(auth.userId,'studio-write',45,60);
    const id = await routeId(context);
    const source = await getWorkbookCorrectionSource(auth,id);
    const version = source && typeof source === 'object' ? Object.getOwnPropertyDescriptor(source,'workbookVersion')?.value : undefined;
    const mode = source && typeof source === 'object' ? Object.getOwnPropertyDescriptor(source,'mode')?.value : undefined;
    const verified = parseWorkbookCorrectionSource(source,{id,version,mode});
    if (!verified) throw new Error('Invalid correction source response');
    return Response.json(verified,{headers});
  } catch (error) { return failure(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const auth = await authenticateEducationApi();
    await enforceRateLimit(auth.userId,'studio-write',45,60);
    const input = await readBoundedMutationJson(request,{maxBytes:8_000,
      error:(message,status)=>new WorkbookCorrectionError(message,status),
      crossOriginMessage:'Cross-origin Studio changes are not allowed.',jsonMessage:'Send Studio changes as JSON.'});
    const id = await routeId(context);
    const parsed = parseWorkbookCorrectionRequest(input,id);
    if (!parsed) throw new WorkbookCorrectionError('Confirm the current published version, source and a reason of up to 1,000 characters.',422);
    const receipt = parseWorkbookCorrectionReceipt(await createStudioWorkbookCorrection(auth,id,parsed),parsed);
    if (!receipt) throw new Error('Invalid correction receipt');
    return Response.json(receipt,{headers});
  } catch (error) { return failure(error); }
}
