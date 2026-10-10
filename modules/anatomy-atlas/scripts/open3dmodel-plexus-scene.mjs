// Shared, fail-closed scope check for an offline source specimen, not atlas admission.
export const plexusContextNames = ['Humerus.r','Scapula.r.','Clavicle.r'];
export function validatePlexusScene(data) {
  const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  if (!data || data.schemaVersion !== 1 || data.purpose !== 'open3dmodel-plexus-source-review' ||
    data.units !== 'unknown-source-units' || data.coordinateFrame !== 'unaltered-source-OBJ' ||
    data.registered !== false || data.mirrored !== false || data.clinicalApproved !== false ||
    data.admissions !== 0 || data.license !== 'CC-BY-SA-4.0' ||
    !['sourceObjSha256','sourceInventorySha256','conversionReportSha256'].every(key=>hex(data[key])) ||
    !Array.isArray(data.objects) || !data.objects.some(item=>item?.core === true) || !Array.isArray(data.held))
    throw Error('Wrong candidate scope or revision');
  const context = data.contextObjects === undefined ? [] : data.contextObjects;
  if (!Array.isArray(context) || (data.contextObjects !== undefined && context.length !== 3) ||
    context.length && (new Set(context.map(item=>item?.sourceName)).size !== 3 ||
      !context.every(item=>plexusContextNames.includes(item?.sourceName) && item.role === 'bone-context' &&
        item.core === false && item.sourceNamedRight === true && item.groupedDivisions === false)))
    throw Error('Invalid bone context scope');
  const ids = new Set();
  for (const item of [...data.objects,...context]) {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) ||
      typeof item.sourceName !== 'string' || !item.sourceName || typeof item.core !== 'boolean' ||
      typeof item.sourceNamedRight !== 'boolean' || typeof item.groupedDivisions !== 'boolean' ||
      !Array.isArray(item.vertices) || !item.vertices.length ||
      !item.vertices.every(v=>Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)) ||
      !Array.isArray(item.faces) || !item.faces.length ||
      !item.faces.every(f=>Array.isArray(f) && f.length === 3 &&
        f.every(i=>Number.isInteger(i) && i >= 0 && i < item.vertices.length)))
      throw Error('Invalid source object');
    if (data.objects.includes(item) && (item.role === 'bone-context' || plexusContextNames.includes(item.sourceName)))
      throw Error('Bone context cannot become a neural selection');
    ids.add(item.id);
  }
  return context;
}
