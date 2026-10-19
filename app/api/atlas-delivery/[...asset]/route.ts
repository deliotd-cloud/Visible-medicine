import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import inventory from '@/lib/atlas-model-inventory.json';
import { handleAtlasDelivery } from '@/lib/atlas-model-delivery';
import { authorizeAtlasDelivery } from '@/lib/atlas-delivery-access';
import { ATLAS_DELIVERY_POLICY } from '@/lib/atlas-delivery-policy';
import { AtlasModelError } from '@/lib/atlas-model-storage';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  return handleAtlasDelivery(request, inventory.models, env.FILES, async () => {
    const user = await getChatGPTUser();
    // A stale policy must not label a different catalogue revision as approved.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(inventory, null, 2) + '\n'));
    const revision = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (revision !== ATLAS_DELIVERY_POLICY.manifestRevision) throw new AtlasModelError('Atlas delivery policy does not match this release.', 503);
    await authorizeAtlasDelivery(env.DB, user?.userId ?? null, ATLAS_DELIVERY_POLICY);
  });
}
export { handle as GET, handle as HEAD };
