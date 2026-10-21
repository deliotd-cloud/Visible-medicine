/** Presentation only. The review layout and APIs independently authorize requests. */
export async function optionalReviewAvailability(signedIn: boolean, authorize: () => Promise<unknown>) {
  if (signedIn !== true) return false;
  try {
    await authorize();
    return true;
  } catch {
    return false;
  }
}

export function reviewDestination(signedIn: boolean, reviewAvailable: boolean) {
  return signedIn === true && reviewAvailable === true
    ? { href: '/workspace/clinical-review-inbox', label: 'Clinical Review', description: 'Outstanding anatomy and teaching reviews' }
    : { href: '/workspace', label: 'Workspace', description: 'Institution tools, when authorized' };
}

export function reviewDestinationActive(pathname: string, href: string): boolean {
  if (href === '/workspace/clinical-review-inbox')
    return pathname === href || pathname.startsWith('/workspace/clinical-review-inbox/') ||
      pathname === '/workspace/atlas-review' || pathname.startsWith('/workspace/atlas-review/') ||
      pathname === '/workspace/review-candidates' || pathname.startsWith('/workspace/review-candidates/');
  return (pathname === href || pathname.startsWith(`${href}/`)) &&
    !reviewDestinationActive(pathname, '/workspace/clinical-review-inbox');
}
