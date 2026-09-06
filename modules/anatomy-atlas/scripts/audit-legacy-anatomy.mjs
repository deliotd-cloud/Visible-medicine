import fs from 'node:fs/promises';
import path from 'node:path';
import { archiveReader, cache, parallelMap } from './bodyparts-archive.mjs';
export const legacyBase =
  'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/';
export async function legacyTable(name) {
  const target = path.join(cache, 'legacy3', name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  try {
    return await fs.readFile(target, 'utf8');
  } catch {
    const r = await fetch(legacyBase + name);
    if (!r.ok) throw new Error(`${name}: ${r.status}`);
    const text = await r.text();
    await fs.writeFile(target, text);
    return text;
  }
}
export async function legacySource() {
  const [namesText, partsText, zip] = await Promise.all([
    legacyTable('parts_list_e.txt'),
    legacyTable('composite_parts.txt'),
    archiveReader('legacy3', legacyBase + 'BodyParts3D_3.0_obj_99.zip'),
  ]);
  const names = new Map(
    namesText
      .trim()
      .split(/\r?\n/)
      .map((r) => r.split('\t')),
  );
  const parts = new Map();
  for (const row of partsText.trim().split(/\r?\n/)) {
    const [id, , part] = row.split('\t');
    if (!parts.has(id)) parts.set(id, []);
    parts.get(id).push(part);
  }
  function resolve(id) {
    if (zip.entries.has(id + '.obj')) return [id];
    const files = [...new Set(parts.get(id) ?? [])];
    if (!files.length || files.some((f) => !zip.entries.has(f + '.obj')))
      throw new Error(`Unresolved legacy concept ${id}`);
    return files;
  }
  return { names, parts, zip, resolve };
}
export function objBounds(bytes) {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  let vertices = 0;
  for (const line of bytes.toString().split(/\r?\n/))
    if (line.startsWith('v ')) {
      const p = line.trim().split(/\s+/).slice(1, 4).map(Number);
      vertices++;
      for (let j = 0; j < 3; j++) {
        min[j] = Math.min(min[j], p[j]);
        max[j] = Math.max(max[j], p[j]);
      }
    }
  return { min, max, vertices };
}
if (process.argv[1]?.endsWith('audit-legacy-anatomy.mjs')) {
  const source = await legacySource();
  const catalog = JSON.parse(
    await fs.readFile(
      'public/models/bodyparts3d/full-body/catalog.json',
      'utf8',
    ),
  );
  const pattern =
    /rectus abdominis|internal oblique|transversus abdominis|latissimus dorsi|multifidus|intervertebral disk|pubococcygeus|puborectalis|iliococcygeus|tendinous arch|inguinal ligament|interosseous membrane|calcaneal tendon|fascia lata|interossei|optic nerve|spinal cord|central canal/;
  const candidates = [...source.names].filter(
    ([id, name]) =>
      pattern.test(name) && !catalog.structures.some((s) => s.fmaId === id),
  );
  console.log(
    JSON.stringify(
      candidates.map(([id, name]) => {
        try {
          return { id, name, files: source.resolve(id) };
        } catch {
          return { id, name, missing: true };
        }
      }),
      null,
      2,
    ),
  );
  const controls = catalog.structures.filter((s) =>
    /^(right scapula|left femur|third lumbar vertebra|atlas|sacrum|right hip bone|right tibia)$/.test(
      s.sourceName,
    ),
  );
  const report = await parallelMap(controls, 4, async (s) => {
    const files = source.resolve(s.fmaId),
      b = await Promise.all(
        files.map((f) => source.zip.get(f).then(objBounds)),
      );
    return { id: s.fmaId, name: s.name, legacy: b, currentScene: s.bounds };
  });
  console.log(JSON.stringify({ registrationControls: report }, null, 2));
}
