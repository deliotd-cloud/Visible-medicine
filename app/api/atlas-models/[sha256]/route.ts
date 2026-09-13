import { env } from 'cloudflare:workers';
import inventory from '@/lib/atlas-model-inventory.json';
import { handleAtlasModel } from '@/lib/atlas-model-storage';
import { authorizeAtlasModelStaging } from '@/lib/atlas-model-authorization';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ sha256: string }> };
async function handle(request: Request, context: Context) {
  return handleAtlasModel(request, (await context.params).sha256, inventory.models, env.FILES, authorizeAtlasModelStaging);
}
export { handle as GET, handle as HEAD, handle as PUT };
