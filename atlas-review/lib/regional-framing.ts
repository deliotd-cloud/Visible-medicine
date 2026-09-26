import { handFramingBounds } from './hand-framing';
import { selectionBounds } from './selection-visibility';

const pelvisSacrumId = 'vm:anatomy:body:spine:midline:bone:sacrum';
const neutralLateralities = new Set(['midline', 'unpaired', 'unspecified']);
// These supplied whole veins reach into the upper arm. This is only a camera
// exception, not a claim that their distal parts are outside the forearm.
const forearmLongVeins = new Set(['FMA13325', 'FMA13326', 'FMA22909', 'FMA22910']);

export function regionalFramingRegion(region: string, side: string) {
  if (region === 'hand' && ['left', 'right'].includes(side)) return 'hand';
  if (region === 'foot' && ['left', 'right', 'both'].includes(side)) return 'foot';
  if (region === 'pelvis' && ['left', 'right', 'both'].includes(side)) return 'pelvis';
  if (region === 'thorax' && ['left', 'right', 'both'].includes(side)) return 'thorax';
  if (region === 'leg' && ['left', 'right', 'both'].includes(side)) return 'leg';
  if (region === 'forearm' && ['left', 'right', 'both'].includes(side)) return 'forearm';
  return null;
}

function pelvisFramingMember(
  structure: Parameters<typeof handFramingBounds>[0]['structures'][number],
  side: string,
) {
  if (!structure.regions.includes('pelvis')) return false;
  const primary = structure.region === 'pelvis';
  const sacrum = structure.id === pelvisSacrumId &&
    structure.fmaId === 'FMA16202' &&
    structure.system === 'skeleton' &&
    structure.laterality === 'midline';
  const onSide = side === 'both' || structure.laterality === side ||
    neutralLateralities.has(structure.laterality);
  return (primary || sacrum) && onSide;
}

/** Camera-only regional framing; never remove or reposition a source. */
export function regionalFramingBounds(input: Parameters<typeof handFramingBounds>[0]) {
  // Preserve the previously verified hand preset and unilateral landing policy.
  if (input.region === 'hand') return handFramingBounds(input);
  const { region, side, structures, visibleIds, selectedId, enabled } = input;
  const framingRegion = regionalFramingRegion(region, side);
  if (!enabled || !['foot', 'pelvis', 'thorax', 'leg', 'forearm'].includes(framingRegion ?? '')) return null;
  const visible = new Set(visibleIds);
  const selected = structures.find((s) => s.id === selectedId);
  if (region === 'forearm') {
    const member = (s: typeof structures[number]) =>
      s.region === 'forearm' && s.regions.includes('forearm') &&
      (side === 'both' || s.laterality === side || neutralLateralities.has(s.laterality)) &&
      !(s.system === 'vessels' && forearmLongVeins.has(s.fmaId));
    // Use complete tissue envelopes, including brachioradialis and distal
    // tendons. Never infer a cutting plane or alter the supplied geometry.
    // Keep smaller peripheral vessels in full, even outside muscle envelopes.
    // Long cephalic/basilic veins and shared arm sources remain loaded. A
    // selection outside this set restores the full-source camera fit.
    if (selectedId !== null &&
      (!selected || !visible.has(selected.id) || !member(selected))) return null;
    return selectionBounds(structures.filter(s => visible.has(s.id) && member(s)));
  }
  if (region === 'leg') {
    // Keep the full supplied lower-leg envelopes, including distal tendons.
    // Shared whole femora, thigh vessels and iliotibial tracts stay loaded;
    // selecting any of them restores their complete source-space fit.
    const member = (s: typeof structures[number]) =>
      s.region === 'leg' && s.regions.includes('leg') &&
      (side === 'both' || s.laterality === side || neutralLateralities.has(s.laterality));
    if (selectedId !== null &&
      (!selected || !visible.has(selected.id) || !member(selected))) return null;
    return selectionBounds(structures.filter((s) => visible.has(s.id) && member(s)));
  }
  if (region === 'thorax') {
    // Frame complete chest sources and all nonvascular context (including the
    // thoracic spine). Shared cervical/abdominal/shoulder vessels remain loaded
    // at their original positions; selecting one restores the full-source fit.
    const member = (s: typeof structures[number]) =>
      s.regions.includes('thorax') &&
      (s.region === 'thorax' || s.system !== 'vessels') &&
      (side === 'both' || s.laterality === side || neutralLateralities.has(s.laterality));
    if (selectedId !== null &&
      (!selected || !visible.has(selected.id) || !member(selected))) return null;
    return selectionBounds(structures.filter((s) => visible.has(s.id) && member(s)));
  }
  if (region === 'pelvis') {
    const core = selectionBounds(structures.filter((s) =>
      visible.has(s.id) && pelvisFramingMember(s, side),
    ));
    // Shared hip muscles can be catalogued primarily under thigh yet fit fully
    // inside this preset. Retain the exact existing camera bounds only when the
    // complete visible muscle envelope fits; never crop or expand a source.
    const containedMuscle = selected?.system === 'muscles' &&
      selected.regions.includes('pelvis') &&
      (side === 'both' || selected.laterality === side || neutralLateralities.has(selected.laterality)) &&
      core !== null && selected.bounds.min.length === 3 && selected.bounds.max.length === 3 &&
      selected.bounds.min.every((min, axis) => Number.isFinite(min) &&
        Number.isFinite(selected.bounds.max[axis]) && min <= selected.bounds.max[axis] &&
        min >= core.min[axis] && selected.bounds.max[axis] <= core.max[axis]);
    // Stale, hidden, contralateral or non-contained selections retain the
    // complete source-space fallback, including long vessels and whole femora.
    if (selectedId !== null &&
      (!selected || !visible.has(selected.id) ||
        (!pelvisFramingMember(selected, side) && !containedMuscle)))
      return null;
    return core;
  }
  // Calf vessels and the calcaneal tendon retain their full source extent when
  // selected. A foot-region membership does not turn those into cropped meshes.
  if (selectedId !== null &&
    (!selected || selected.region !== 'foot' ||
      (side !== 'both' && selected.laterality !== side) ||
      !visible.has(selected.id)))
    return null;
  return selectionBounds(structures.filter((s) =>
    s.region === 'foot' && (side === 'both' || s.laterality === side) && visible.has(s.id),
  ));
}
