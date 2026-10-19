import source from '../public/models/bodyparts3d/brachial-veins/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const canonical = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canonical).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v)
          .sort()
          .map(
            (k) =>
              `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`,
          )
          .join(',')}}`
      : JSON.stringify(v);
const additions = source.structures as unknown as BodyStructure[];

/** Atomic, source-bound addition. Archival ingestion data remains unchanged. */
export function addBrachialVeins(catalog: BodyCatalog): BodyCatalog {
  const touched =
    catalog.structures.some((s) =>
      [...source.contextRecords, ...additions].some(
        (p) => p.id === s.id || p.fmaId === s.fmaId,
      ),
    ) || catalog.bundles.some((b) => b.id === source.bundles[0].id);
  if (!touched) return catalog;
  const reject = () => {
    throw new Error('Brachial vein source binding changed; review required');
  };
  if (
    catalog.sourceVersion !== source.sourceVersion ||
    catalog.license !== source.license ||
    canonical(catalog.coordinateSystem) !== canonical(source.coordinateSystem)
  )
    reject();
  for (const record of source.contextRecords) {
    const matches = catalog.structures.filter(
      (s) => s.id === record.id || s.fmaId === record.fmaId,
    );
    if (matches.length !== 1 || canonical(matches[0]) !== canonical(record))
      reject();
  }
  for (const bundle of source.contextBundles) {
    const matches = catalog.bundles.filter((b) => b.id === bundle.id);
    if (matches.length !== 1 || canonical(matches[0]) !== canonical(bundle))
      reject();
  }
  const existing = catalog.structures.filter(
    (s) =>
      additions.some((p) => p.id === s.id || p.fmaId === s.fmaId) ||
      s.bundle === source.bundles[0].id,
  );
  const bundles = catalog.bundles.filter(
    (b) =>
      b.id === source.bundles[0].id ||
      b.url.split('?')[0] === source.bundles[0].url.split('?')[0],
  );
  if (existing.length || bundles.length) {
    if (
      existing.length !== additions.length ||
      bundles.length !== 1 ||
      canonical(bundles[0]) !== canonical(source.bundles[0])
    )
      reject();
    for (const record of additions) {
      const matches = existing.filter((s) => s.id === record.id);
      if (matches.length !== 1 || canonical(matches[0]) !== canonical(record))
        reject();
    }
    return catalog;
  }
  return {
    ...catalog,
    structures: [...catalog.structures, ...JSON.parse(JSON.stringify(additions))],
    bundles: [...catalog.bundles, ...JSON.parse(JSON.stringify(source.bundles))],
  };
}

export function brachialVeinLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    !additions.some((p) => p.id === s.id && canonical(p) === canonical(s)) ||
    !['anatomy', 'function'].includes(tab)
  )
    return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Deep arm vein' : 'Venous return'} · draft`,
    body:
      tab === 'anatomy'
        ? 'One source-labelled medial brachial vein in the arm, distinct from the superficial basilic vein. Brachial veins and the basilic contribution join towards the axillary vein.'
        : 'Part of the deep venous return of the upper limb towards the axillary system. This surface does not measure blood flow or establish the donor’s complete tributary pattern.',
    bullets: [
      'Use Venous drainage to compare the same-side axillary outlet, or remove surrounding layers to inspect this original source surface.',
      'Only one medial brachial vein per side is supplied. Companion veins, venous valves and a connected lumen are not reconstructed.',
    ],
    note: 'Anatomical and clinical review pending. Mesh contact is not proof of a vascular junction, patency or a safe procedural route.',
    citations: [
      'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-upper-limb/',
      'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html',
    ],
  };
}
