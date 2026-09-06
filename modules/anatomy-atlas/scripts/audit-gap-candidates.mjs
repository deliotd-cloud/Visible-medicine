import fs from 'node:fs/promises';
import {
  conceptMap,
  archiveReader,
  parallelMap,
} from './bodyparts-archive.mjs';
import { gapSelections } from './gap-recovery.mjs';
import { objBounds } from './audit-legacy-anatomy.mjs';
const [isa, zip] = await Promise.all([conceptMap('isa'), archiveReader('isa')]);
const catalog = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
);
const audit = await parallelMap(gapSelections(isa), 6, async (r) => {
  const bounds = await Promise.all(
    r.files.map((f) => zip.get(f).then(objBounds)),
  );
  return {
    id: r.fma,
    name: r.name,
    files: r.files,
    bounds,
    overlap: catalog.structures
      .filter((s) => s.sources.some((f) => r.files.includes(f.file)))
      .map((s) => s.name),
  };
});
await fs.writeFile(
  '../work/gap-candidate-audit.json',
  JSON.stringify(audit, null, 2),
);
console.log(
  JSON.stringify(
    audit.map((r) => ({
      id: r.id,
      name: r.name,
      x: r.bounds.map((b) => [(b.min[0] + b.max[0]) / 2]),
      z: r.bounds.map((b) => [(b.min[2] + b.max[2]) / 2]),
      overlap: r.overlap,
    })),
    null,
    2,
  ),
);
