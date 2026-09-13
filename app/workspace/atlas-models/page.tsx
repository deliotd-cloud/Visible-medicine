import type { Metadata } from 'next';
import { authorizeAtlasModelStaging } from '@/lib/atlas-model-authorization';
import { AtlasModelError } from '@/lib/atlas-model-storage';
import { AtlasModelStaging } from '@/components/AtlasModelStaging';
import inventory from '@/lib/atlas-model-inventory.json';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Atlas model staging', robots: { index: false, follow: false } };
export default async function AtlasModelStagingPage() {
  try { await authorizeAtlasModelStaging(); }
  catch (error) {
    return <main className="inner-page"><h1>Atlas model staging</h1><p>{error instanceof AtlasModelError ? error.message : 'Model staging is temporarily unavailable.'}</p><a href="/signin-with-chatgpt?return_to=%2Fworkspace%2Fatlas-models" target="_top">Sign in to Visible Medicine</a></main>;
  }
  return <main className="inner-page"><h1>Atlas model staging</h1><p>Prepare the exact licensed model files for independent delivery. This does not publish anatomy, grant clinical approval or change learner access.</p><AtlasModelStaging models={inventory.models} /></main>;
}
