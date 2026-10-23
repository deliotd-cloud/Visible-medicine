import registry from './clinical-review-reference-assets.json';
import {privateReferenceBase, validatePrivateReferenceRegistry} from './clinical-review-reference-registry';
import {parseFdaReferenceSelection} from '../atlas-review/lib/fda-reference-links';
import {fdaShoulderSourceCommit} from '../atlas-review/lib/fda-shoulder-reference';
import catalogue from '../atlas-review/public/models/fda-shoulder-draft/catalog.json';

type Params = Record<string, string | string[] | undefined>;
const fields = ['kind', 'region', 'referenceRevision', 'structure'];

/** Exact source selection plus the separately registered, local-only delivery identity. */
export function parseWebsiteFdaSelection(params: Params): {
  selectedId: string; expectedRevision: string; assetBase: string;
} | null {
  if (Object.keys(params).length !== fields.length ||
      fields.some(key => !Object.hasOwn(params, key) || typeof params[key] !== 'string') ||
      params.kind !== 'fda-shoulder' || params.region !== 'shoulder') return null;
  const selection = parseFdaReferenceSelection({
    referenceRevision: params.referenceRevision,
    structure: params.structure,
  });
  if (!selection?.selectedId) return null;
  const references = validatePrivateReferenceRegistry(registry).references.filter(reference =>
    reference.id === 'fda-shoulder-fc9f3e56' && reference.revision === selection.expectedRevision &&
    reference.sourceCommit === fdaShoulderSourceCommit &&
    reference.files.some(file => file.path === catalogue.bundle.url.slice(1) &&
      file.sha256 === catalogue.bundle.sha256 && file.bytes === catalogue.bundle.bytes) &&
    reference.files.some(file => file.path === 'models/fda-shoulder-draft/catalog.json'));
  if (references.length !== 1) return null;
  return {
    selectedId: selection.selectedId,
    expectedRevision: selection.expectedRevision,
    assetBase: privateReferenceBase(references[0]),
  };
}
