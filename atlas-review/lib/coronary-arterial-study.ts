import pins from '../content/coronary-arterial-study-pins.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions.ts';

const source = pins as unknown as Pick<BodyCatalog,
  'sourceVersion' | 'license' | 'credit' | 'coordinateSystem' | 'bundles'
> & { entries: BodyStructure[] };
const fmaIds = ['FMA3802', 'FMA3855', 'FMA3862', 'FMA3895', 'FMA7088'] as const;
const same = (a: unknown, b: unknown) => sourceCanonical(a) === sourceCanonical(b);

export const coronaryArterialStudyId = 'coronary-arterial-surfaces';
export const coronaryArterialStudyCopy = {
  title: 'Coronary artery surfaces',
  description: 'Compare the labelled right and left coronary trunks and two labelled left branches on the existing thoracic source surfaces.',
  inspect: 'Select each artery and rotate the view to compare its visible course. At 0%, the heart is muted, nonselectable canvas context. During separation it is hidden; returning to 0% restores it only if still enabled and not removed. Use Both sides for this complete comparison. Source surfaces and boundaries require revision-bound radiologist review; labels do not verify a continuous lumen, an ostium, dominance, flow or patient registration.',
  references: [
    'https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html',
  ],
} as const;

type Study = {
  targets: BodyStructure[];
  context: BodyStructure[];
  bundles: BodyCatalog['bundles'];
  copy: typeof coronaryArterialStudyCopy;
};

/** Exact source admission only. No inferred nested branches or joined vessel geometry. */
export function coronaryArterialStudyFor(
  catalog: BodyCatalog | null,
  scope?: BodyStructure[],
): Study | null {
  if (!catalog || source.entries.length !== fmaIds.length ||
      !same(source.entries.map((s) => s.fmaId), fmaIds) ||
      catalog.sourceVersion !== source.sourceVersion ||
      catalog.license !== source.license ||
      catalog.credit !== source.credit ||
      !same(catalog.coordinateSystem, source.coordinateSystem)) return null;

  const admitted: BodyStructure[] = [];
  for (const pin of source.entries) {
    const matches = catalog.structures.filter((s) => s.id === pin.id || s.fmaId === pin.fmaId);
    if (matches.length !== 1 || !same(matches[0], pin)) return null;
    if (scope) {
      const inScope = scope.filter((s) => s.id === pin.id || s.fmaId === pin.fmaId);
      if (inScope.length !== 1 || !same(inScope[0], pin)) return null;
    }
    admitted.push(matches[0]);
  }
  if (new Set(admitted.map((s) => s.id)).size !== fmaIds.length) return null;
  const files = admitted.flatMap((s) => s.sources.map((file) => file.file));
  if (files.length !== new Set(files).size) return null;

  const bundleIds = new Set(admitted.map((s) => s.bundle));
  if (source.bundles.length !== bundleIds.size ||
      new Set(source.bundles.map((b) => b.id)).size !== bundleIds.size ||
      source.bundles.some((b) => !bundleIds.has(b.id))) return null;
  for (const pin of source.bundles) {
    const matches = catalog.bundles.filter((b) =>
      b.id === pin.id || b.url.split('?')[0] === pin.url.split('?')[0]);
    if (matches.length !== 1 || !same(matches[0], pin)) return null;
  }
  return {
    targets: structuredClone(admitted.slice(0, 4)),
    context: structuredClone(admitted.slice(4)),
    bundles: structuredClone(source.bundles),
    copy: structuredClone(coronaryArterialStudyCopy),
  };
}

type SceneOptions = {
  region: string;
  focusId: string | null;
  exam: boolean;
  explode: number;
  visibleIds: string[];
  scope: BodyStructure[];
};
type ScenePlan = {
  active: boolean;
  contextIds: string[];
  omitIds: string[];
  appearance: Record<string, { color: string; opacity: number }>;
};

/** Presentation only: never adds an item to visibility or recolours an artery. */
export function coronaryArterialScenePlan(
  catalog: BodyCatalog | null,
  options: SceneOptions,
): ScenePlan {
  const inactive = (): ScenePlan => ({ active: false, contextIds: [], omitIds: [], appearance: {} });
  if (!options || !['thorax', 'whole-body'].includes(options.region) ||
      options.focusId !== coronaryArterialStudyId || options.exam ||
      !Number.isFinite(options.explode) || options.explode < 0 || options.explode > 100 ||
      !Array.isArray(options.visibleIds) || !Array.isArray(options.scope)) return inactive();
  const study = coronaryArterialStudyFor(catalog, options.scope);
  if (!study) return inactive();
  const heartId = study.context[0].id;
  if (options.explode > 0) return {
    active: true, contextIds: [], omitIds: [heartId], appearance: {},
  };
  if (!options.visibleIds.includes(heartId)) return {
    active: true, contextIds: [], omitIds: [], appearance: {},
  };
  return {
    active: true,
    contextIds: [heartId],
    omitIds: [],
    appearance: { [heartId]: { color: '#b8a69e', opacity: 0.2 } },
  };
}
