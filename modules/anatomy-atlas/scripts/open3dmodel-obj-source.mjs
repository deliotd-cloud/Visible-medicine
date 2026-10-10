import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';

/**
 * Read named OBJ objects without loading the source text or unselected geometry.
 * Face indices in returned objects are zero-based and local to their vertex array.
 * Cross-object position references are rejected, including in unselected objects.
 * Supported vertex records contain exactly three finite position coordinates.
 * Vertex records before a named object are rejected.
 */
export async function readNamedObjObjects(path, {selectName = () => true} = {}) {
  if (typeof selectName !== 'function') throw new TypeError('selectName must be a function');
  const objects = [];
  const inventory = [];
  const materialLibraries = [];
  const names = new Set();
  let totalVertices = 0;
  let totalFaces = 0;
  let current = null;
  let selected = null;
  let lineNumber = 0;
  const stream = createReadStream(path, {encoding: 'utf8'});
  const reader = createInterface({input: stream, crlfDelay: Infinity});
  const fail = message => { throw new Error(`${path}:${lineNumber}: ${message}`); };

  try {
    for await (const sourceLine of reader) {
      lineNumber++;
      const line = sourceLine.split('#', 1)[0].trim();
      if (!line) continue;
      const match = /^(\S+)(?:\s+(.*))?$/.exec(line);
      const directive = match[1];
      const value = match[2]?.trim() ?? '';

      if (directive === 'o') {
        if (!value) fail('empty object name');
        if (names.has(value)) fail(`duplicate object name "${value}"`);
        names.add(value);
        current = {
          name: value, startLine: lineNumber, vertices: 0, faces: 0,
          faceSizes: {}, crossObjectReferences: 0,
        };
        // OBJ position indices are global; this offset anchors local indices.
        current.firstGlobalVertex = totalVertices;
        inventory.push(current);
        selected = selectName(value) ? {name: value, vertices: [], faces: [], startLine: lineNumber} : null;
        if (selected) objects.push(selected);
      } else if (directive === 'v') {
        if (!current) fail('vertex before named object');
        const parts = value.split(/\s+/);
        if (parts.length !== 3 || parts.some(part => part === '' || !Number.isFinite(Number(part)))) {
          fail('vertex requires exactly three finite numeric coordinates');
        }
        const position = parts.map(Number);
        totalVertices++;
        if (current) current.vertices++;
        if (selected) selected.vertices.push(position);
      } else if (directive === 'f') {
        if (!current) fail('face before named object');
        const tokens = value ? value.split(/\s+/) : [];
        if (tokens.length < 3) fail('face has fewer than three vertices');
        const localFace = [];
        for (const token of tokens) {
          const rawIndex = token.split('/', 1)[0];
          if (!/^[+-]?\d+$/.test(rawIndex)) fail(`noninteger position index "${rawIndex}"`);
          const index = Number(rawIndex);
          if (!Number.isSafeInteger(index) || index === 0) fail(`invalid position index "${rawIndex}"`);
          const globalIndex = index > 0 ? index : totalVertices + index + 1;
          if (globalIndex < 1 || globalIndex > totalVertices) {
            fail(`position index "${rawIndex}" out of range (1..${totalVertices})`);
          }
          const localIndex = globalIndex - current.firstGlobalVertex - 1;
          if (localIndex < 0 || localIndex >= current.vertices) {
            fail(`face in object "${current.name}" references position ${globalIndex} outside that object`);
          }
          localFace.push(localIndex);
        }
        totalFaces++;
        current.faces++;
        current.faceSizes[tokens.length] = (current.faceSizes[tokens.length] ?? 0) + 1;
        if (selected) selected.faces.push(localFace);
      } else if (directive === 'mtllib') {
        if (value) materialLibraries.push(...value.split(/\s+/));
      }
      // vt, vn, materials, groups and other directives carry no position data.
    }
  } finally {
    reader.close();
    stream.destroy();
  }
  for (const row of inventory) delete row.firstGlobalVertex;
  return {objects, inventory, totalVertices, totalFaces, materialLibraries};
}
