import { installRootEducationApi } from '../../lib/root-education-api';
import { shoulderLinkEntries } from '../../lib/anatomy-link-registry';
import { structures } from '../../app/anatomy-data';
import manifest from '../../public/models/bodyparts3d/manifest.json';

/** Same-origin, in-memory integration only. No postMessage receiver or remote
 * configuration is installed. The host is responsible for actual media access. */
export function installShoulderEducationApi(target:Window) {
  const anatomy=shoulderLinkEntries(manifest,structures).map(entry=>({scope:'shoulder-pilot' as const,structureId:entry.id,sources:entry.sources}));
  return installRootEducationApi(target,'shoulder-pilot',anatomy).dispose;
}
