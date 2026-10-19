import { getChatGPTUser } from '@/app/chatgpt-auth';
import { authorizeRoles, DomainError } from '@/lib/repository';
import { AtlasModelError } from '@/lib/atlas-model-storage';

export async function authorizeAtlasModelStaging() {
  // No development demo identity or client-provided role grants storage access.
  const user = await getChatGPTUser();
  if (!user) throw new AtlasModelError('Sign in to the education site to manage model staging.', 401);
  try {
    await authorizeRoles({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName }, 'administrator');
  } catch (error) {
    if (error instanceof DomainError) throw new AtlasModelError('An authorized education administrator is required.', error.status);
    throw error;
  }
}
