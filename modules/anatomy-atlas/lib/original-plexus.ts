/** Independently authored typical brachial plexus topology for a schematic lesson. */
export type PlexusStage = 'ramus' | 'trunk' | 'division' | 'cord' | 'median-root' | 'nerve';

export interface PlexusPart {
  key: string;
  id: string;
  name: string;
  stage: PlexusStage;
  summary: string;
  referenceIds: string[];
}

export interface PlexusConnection {
  from: string;
  to: string;
}

export interface PlexusStudy {
  id: string;
  schemaVersion: 1;
  side: 'right';
  frame: { kind: 'diagrammatic'; units: 'arbitrary'; patientRegistration: false };
  geometryKind: 'original-procedural-schematic';
  license: 'MIT';
  clinicalApproved: false;
  learnerCatalogAdmission: false;
  parts: PlexusPart[];
  connections: PlexusConnection[];
  references: { id: string; title: string; url: string }[];
  limitations: string[];
}

const STUDY_ID = 'vm:schematic:brachial-plexus:right';
const PART_PREFIX = `${STUDY_ID}:`;

const references: PlexusStudy['references'] = [
  {
    id: 'BP-TOPOLOGY',
    title: 'Anatomical Variations of Brachial Plexus in Adult Cadavers; normal anatomy section',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4969373/',
  },
  {
    id: 'BP-OVERVIEW',
    title: 'Anatomy, Shoulder and Upper Limb, Brachial Plexus',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK500016/',
  },
  {
    id: 'BP-BRANCHES',
    title: 'Anatomy, Head and Neck: Brachial Plexus',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK531473/',
  },
  {
    id: 'BP-VARIATION',
    title: 'Clinically Relevant Anatomical Variations in the Brachial Plexus',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10001373/',
  },
];

function part(
  key: string,
  name: string,
  stage: PlexusStage,
  summary: string,
  referenceIds: string[] = ['BP-TOPOLOGY', 'BP-OVERVIEW'],
): PlexusPart {
  return { key, id: `${PART_PREFIX}${key}`, name, stage, summary, referenceIds };
}

const canonicalParts: PlexusPart[] = [
  part('ramus.C5', 'C5 anterior ramus', 'ramus', 'One of five usual anterior spinal rami entering this plexus.'),
  part('ramus.C6', 'C6 anterior ramus', 'ramus', 'Joins C5 in the typical upper trunk.'),
  part('ramus.C7', 'C7 anterior ramus', 'ramus', 'Continues as the typical middle trunk.'),
  part('ramus.C8', 'C8 anterior ramus', 'ramus', 'Joins T1 in the typical lower trunk.'),
  part('ramus.T1', 'T1 anterior ramus', 'ramus', 'Joins C8 in the typical lower trunk.'),
  part('trunk.upper', 'Upper trunk', 'trunk', 'Usual union of the C5 and C6 anterior rami.'),
  part('trunk.middle', 'Middle trunk', 'trunk', 'Usual continuation of the C7 anterior ramus.'),
  part('trunk.lower', 'Lower trunk', 'trunk', 'Usual union of the C8 and T1 anterior rami.'),
  part('division.upper.anterior', 'Upper anterior division', 'division', 'Anterior division of the upper trunk.'),
  part('division.upper.posterior', 'Upper posterior division', 'division', 'Posterior division of the upper trunk.'),
  part('division.middle.anterior', 'Middle anterior division', 'division', 'Anterior division of the middle trunk.'),
  part('division.middle.posterior', 'Middle posterior division', 'division', 'Posterior division of the middle trunk.'),
  part('division.lower.anterior', 'Lower anterior division', 'division', 'Anterior division of the lower trunk.'),
  part('division.lower.posterior', 'Lower posterior division', 'division', 'Posterior division of the lower trunk.'),
  part('cord.lateral', 'Lateral cord', 'cord', 'Formed by the upper and middle anterior divisions.'),
  part('cord.medial', 'Medial cord', 'cord', 'Continuation of the lower anterior division.'),
  part('cord.posterior', 'Posterior cord', 'cord', 'Formed by all three posterior divisions.'),
  part('median_root.lateral', 'Lateral root of median nerve', 'median-root', 'Contribution from the lateral cord to the median nerve.'),
  part('median_root.medial', 'Medial root of median nerve', 'median-root', 'Contribution from the medial cord to the median nerve.'),
  part('nerve.musculocutaneous', 'Musculocutaneous nerve', 'nerve', 'A terminal branch of the lateral cord.'),
  part('nerve.median', 'Median nerve', 'nerve', 'Usually formed by lateral and medial cord contributions.'),
  part('nerve.ulnar', 'Ulnar nerve', 'nerve', 'A terminal branch of the medial cord.'),
  part('nerve.axillary', 'Axillary nerve', 'nerve', 'A terminal branch of the posterior cord.'),
  part('nerve.radial', 'Radial nerve', 'nerve', 'A terminal branch of the posterior cord.'),
  part('nerve.dorsal_scapular', 'Dorsal scapular nerve', 'nerve', 'Usually arises from the C5 anterior ramus.', ['BP-BRANCHES']),
  part('nerve.long_thoracic', 'Long thoracic nerve', 'nerve', 'Usually receives branches from the C5, C6 and C7 anterior rami.', ['BP-BRANCHES']),
  part('nerve.suprascapular', 'Suprascapular nerve', 'nerve', 'Usually branches from the upper trunk.', ['BP-BRANCHES']),
  part('nerve.to_subclavius', 'Nerve to subclavius', 'nerve', 'Usually branches from the upper trunk.', ['BP-BRANCHES']),
  part('nerve.lateral_pectoral', 'Lateral pectoral nerve', 'nerve', 'A collateral branch of the lateral cord.', ['BP-BRANCHES']),
  part('nerve.medial_pectoral', 'Medial pectoral nerve', 'nerve', 'A collateral branch of the medial cord.', ['BP-BRANCHES']),
  part('nerve.upper_subscapular', 'Upper subscapular nerve', 'nerve', 'A collateral branch of the posterior cord.', ['BP-BRANCHES']),
  part('nerve.lower_subscapular', 'Lower subscapular nerve', 'nerve', 'A collateral branch of the posterior cord.', ['BP-BRANCHES']),
  part('nerve.thoracodorsal', 'Thoracodorsal nerve', 'nerve', 'A collateral branch of the posterior cord.', ['BP-BRANCHES']),
  part('nerve.medial_cutaneous_arm', 'Medial cutaneous nerve of arm', 'nerve', 'A cutaneous branch of the medial cord.', ['BP-BRANCHES']),
  part('nerve.medial_cutaneous_forearm', 'Medial cutaneous nerve of forearm', 'nerve', 'A cutaneous branch of the medial cord.', ['BP-BRANCHES']),
];

const canonicalEdges: readonly (readonly [string, string])[] = [
  ['ramus.C5', 'trunk.upper'], ['ramus.C6', 'trunk.upper'],
  ['ramus.C7', 'trunk.middle'],
  ['ramus.C8', 'trunk.lower'], ['ramus.T1', 'trunk.lower'],
  ['trunk.upper', 'division.upper.anterior'], ['trunk.upper', 'division.upper.posterior'],
  ['trunk.middle', 'division.middle.anterior'], ['trunk.middle', 'division.middle.posterior'],
  ['trunk.lower', 'division.lower.anterior'], ['trunk.lower', 'division.lower.posterior'],
  ['division.upper.anterior', 'cord.lateral'], ['division.middle.anterior', 'cord.lateral'],
  ['division.lower.anterior', 'cord.medial'],
  ['division.upper.posterior', 'cord.posterior'],
  ['division.middle.posterior', 'cord.posterior'],
  ['division.lower.posterior', 'cord.posterior'],
  ['cord.lateral', 'median_root.lateral'], ['cord.medial', 'median_root.medial'],
  ['median_root.lateral', 'nerve.median'], ['median_root.medial', 'nerve.median'],
  ['cord.lateral', 'nerve.musculocutaneous'], ['cord.medial', 'nerve.ulnar'],
  ['cord.posterior', 'nerve.axillary'], ['cord.posterior', 'nerve.radial'],
  ['ramus.C5', 'nerve.dorsal_scapular'],
  ['ramus.C5', 'nerve.long_thoracic'], ['ramus.C6', 'nerve.long_thoracic'],
  ['ramus.C7', 'nerve.long_thoracic'],
  ['trunk.upper', 'nerve.suprascapular'], ['trunk.upper', 'nerve.to_subclavius'],
  ['cord.lateral', 'nerve.lateral_pectoral'],
  ['cord.medial', 'nerve.medial_pectoral'],
  ['cord.medial', 'nerve.medial_cutaneous_arm'],
  ['cord.medial', 'nerve.medial_cutaneous_forearm'],
  ['cord.posterior', 'nerve.upper_subscapular'],
  ['cord.posterior', 'nerve.thoracodorsal'],
  ['cord.posterior', 'nerve.lower_subscapular'],
];

const limitations = [
  'Typical adult pattern only; individual branching and root contributions vary.',
  'Schematic arrangement uses arbitrary units and contains no anatomical measurements.',
  'No fascicle tracing, terminal nerve root-value assignment, or innervation territories are claimed.',
  'Scalenes, clavicle, axillary artery and other neighbouring structures are not registered geometry.',
  'No scan or patient registration; this is not a clinical or diagnostic model.',
];

export const originalPlexusStudy: PlexusStudy = {
  id: STUDY_ID,
  schemaVersion: 1,
  side: 'right',
  frame: { kind: 'diagrammatic', units: 'arbitrary', patientRegistration: false },
  geometryKind: 'original-procedural-schematic',
  license: 'MIT',
  clinicalApproved: false,
  learnerCatalogAdmission: false,
  parts: canonicalParts.map((item) => ({ ...item, referenceIds: [...item.referenceIds] })),
  connections: canonicalEdges.map(([from, to]) => ({ from, to })),
  references: references.map((item) => ({ ...item })),
  limitations: [...limitations],
};

const edgeId = (from: string, to: string) => `${from}\u0000${to}`;

/** Validate the fixed teaching graph and its nonclinical identity before use. */
export function validateOriginalPlexusStudy(study: PlexusStudy): string[] {
  const errors: string[] = [];
  if (!study || typeof study !== 'object') return ['Study is missing.'];
  if (study.id !== STUDY_ID || study.schemaVersion !== 1 || study.side !== 'right')
    errors.push('Study identity, schema version, or side changed.');
  if (study.frame?.kind !== 'diagrammatic' || study.frame.units !== 'arbitrary' ||
      study.frame.patientRegistration !== false ||
      study.geometryKind !== 'original-procedural-schematic' || study.license !== 'MIT' ||
      study.clinicalApproved !== false || study.learnerCatalogAdmission !== false)
    errors.push('Schematic frame, provenance, or admission safety field changed.');

  const actualParts = Array.isArray(study.parts) ? study.parts : [];
  const expectedByKey = new Map(canonicalParts.map((item) => [item.key, item]));
  const seenKeys = new Set<string>();
  const seenIds = new Set<string>();
  for (const item of actualParts) {
    if (!item || typeof item.key !== 'string' || typeof item.id !== 'string') {
      errors.push('Malformed part.');
      continue;
    }
    if (seenKeys.has(item.key)) errors.push(`Duplicate part key: ${item.key}`);
    if (seenIds.has(item.id)) errors.push(`Duplicate part id: ${item.id}`);
    seenKeys.add(item.key);
    seenIds.add(item.id);
    const expected = expectedByKey.get(item.key);
    if (!expected) errors.push(`Unexpected part: ${item.key}`);
    else if (item.id !== expected.id || item.stage !== expected.stage || item.name !== expected.name)
      errors.push(`Changed sided identity or classification: ${item.key}`);
    if (!item.summary?.trim()) errors.push(`Missing summary: ${item.key}`);
    if (!Array.isArray(item.referenceIds) || item.referenceIds.length === 0 ||
        item.referenceIds.some((id) => !references.some((ref) => ref.id === id)))
      errors.push(`Missing or unknown reference: ${item.key}`);
  }
  for (const expected of canonicalParts)
    if (!seenKeys.has(expected.key)) errors.push(`Missing part: ${expected.key}`);
  if (actualParts.length !== canonicalParts.length)
    errors.push(`Expected ${canonicalParts.length} individually addressable parts.`);

  const actualRefs = Array.isArray(study.references) ? study.references : [];
  for (const expected of references)
    if (!actualRefs.some((item) => item?.id === expected.id && item.title === expected.title && item.url === expected.url))
      errors.push(`Missing or changed reference: ${expected.id}`);
  if (actualRefs.length !== references.length) errors.push('Reference set changed.');
  if (!Array.isArray(study.limitations) ||
      limitations.some((text) => !study.limitations.includes(text)))
    errors.push('Required schematic limitations changed.');

  const expectedEdges = new Set(canonicalEdges.map(([from, to]) => edgeId(from, to)));
  const actualEdges = Array.isArray(study.connections) ? study.connections : [];
  const seenEdges = new Set<string>();
  const adjacency = new Map<string, string[]>();
  for (const edge of actualEdges) {
    if (!edge || typeof edge.from !== 'string' || typeof edge.to !== 'string') {
      errors.push('Malformed connection.');
      continue;
    }
    const id = edgeId(edge.from, edge.to);
    if (seenEdges.has(id)) errors.push(`Duplicate connection: ${edge.from} -> ${edge.to}`);
    seenEdges.add(id);
    if (!seenKeys.has(edge.from) || !seenKeys.has(edge.to))
      errors.push(`Orphan connection: ${edge.from} -> ${edge.to}`);
    if (!expectedEdges.has(id)) errors.push(`Unexpected connection: ${edge.from} -> ${edge.to}`);
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
  }
  for (const [from, to] of canonicalEdges)
    if (!seenEdges.has(edgeId(from, to))) errors.push(`Missing connection: ${from} -> ${to}`);
  if (actualEdges.length !== canonicalEdges.length)
    errors.push(`Expected ${canonicalEdges.length} connections.`);

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (key: string): void => {
    if (visiting.has(key)) {
      errors.push(`Cycle involving ${key}`);
      return;
    }
    if (visited.has(key)) return;
    visiting.add(key);
    for (const next of adjacency.get(key) ?? []) visit(next);
    visiting.delete(key);
    visited.add(key);
  };
  for (const key of seenKeys) visit(key);
  return errors;
}

/** Find named paths through the graph; never infer fibre or clinical territory. */
export function plexusConnectivity(
  study: PlexusStudy,
  key: string,
): { ancestors: string[]; descendants: string[] } {
  const empty = { ancestors: [] as string[], descendants: [] as string[] };
  if (!study || !Array.isArray(study.parts) || !study.parts.some((part) => part?.key === key) ||
      !Array.isArray(study.connections)) return empty;
  const keys = new Set(study.parts.map((part) => part.key));
  const walk = (reverse: boolean): string[] => {
    const reached = new Set<string>([key]);
    const queue = [key];
    for (let index = 0; index < queue.length; index += 1) {
      for (const edge of study.connections) {
        const from = reverse ? edge.to : edge.from;
        const to = reverse ? edge.from : edge.to;
        if (from !== queue[index] || !keys.has(to) || reached.has(to)) continue;
        reached.add(to);
        queue.push(to);
      }
    }
    reached.delete(key);
    return [...reached].sort();
  };
  return { ancestors: walk(true), descendants: walk(false) };
}
