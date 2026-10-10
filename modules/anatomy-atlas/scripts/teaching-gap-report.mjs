// Pure root-body editorial coverage inventory. A readiness state is not clinical approval.
export const teachingReadiness = Object.freeze([
  'draft',
  'identity-only',
  'pending',
  'generated-identification',
]);

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const nonempty = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${label} must be a nonempty string`);
  }
  return value;
};
const emptyCounts = () => Object.fromEntries(teachingReadiness.map(state => [state, 0]));
const validReadiness = new Set(teachingReadiness);

/**
 * Inventory actual root-body lesson readiness without copying teaching text or assets.
 * `lessonFor(structure, topic)` must return the current resolver's lesson object.
 */
export function buildTeachingGapReport({structures, topics, lessonFor, sourceRevision}) {
  if (!Array.isArray(structures) || !Array.isArray(topics)) {
    throw new TypeError('structures and topics must be arrays');
  }
  if (typeof lessonFor !== 'function') {
    throw new TypeError('lessonFor must be a function');
  }
  nonempty(sourceRevision, 'sourceRevision');

  const seenIds = new Set();
  for (const structure of structures) {
    if (!structure || typeof structure !== 'object') {
      throw new TypeError('structure must be an object');
    }
    for (const field of ['id', 'name', 'region', 'system', 'fmaId']) {
      nonempty(structure[field], `structure.${field}`);
    }
    if (seenIds.has(structure.id)) throw new Error(`duplicate structure id: ${structure.id}`);
    seenIds.add(structure.id);
  }
  const seenTopics = new Set();
  for (const topic of topics) {
    nonempty(topic, 'topic');
    if (seenTopics.has(topic)) throw new Error(`duplicate topic: ${topic}`);
    seenTopics.add(topic);
  }

  const sortedStructures = [...structures].sort((a, b) =>
    compare(a.region, b.region) || compare(a.name, b.name) || compare(a.id, b.id));
  const sortedTopics = [...topics].sort(compare);
  const totals = emptyCounts();
  const byRegion = Object.fromEntries(
    [...new Set(sortedStructures.map(structure => structure.region))]
      .sort(compare).map(region => [region, emptyCounts()]));
  const byTopic = Object.fromEntries(sortedTopics.map(topic => [topic, emptyCounts()]));
  const rows = [];

  for (const structure of sortedStructures) {
    for (const topic of sortedTopics) {
      const readiness = lessonFor(structure, topic)?.readiness;
      if (!validReadiness.has(readiness)) {
        throw new Error(`unknown or missing readiness for ${structure.id} / ${topic}: ${String(readiness)}`);
      }
      totals[readiness]++;
      byRegion[structure.region][readiness]++;
      byTopic[topic][readiness]++;
      if (readiness !== 'draft') {
        rows.push({
          id: structure.id,
          name: structure.name,
          region: structure.region,
          system: structure.system,
          fmaId: structure.fmaId,
          topic,
          readiness,
        });
      }
    }
  }
  rows.sort((a, b) =>
    compare(a.region, b.region) || compare(a.topic, b.topic) ||
    compare(a.name, b.name) || compare(a.id, b.id));

  return {
    schemaVersion: 1,
    scope: 'root-body',
    sourceRevision,
    structureCount: structures.length,
    placementCount: structures.length * topics.length,
    topics: sortedTopics,
    totals,
    byRegion,
    byTopic,
    rows,
    limitation: 'Editorial readiness for displayed root-body selections only; not anatomy completeness, imaging correspondence or clinical approval.',
  };
}
