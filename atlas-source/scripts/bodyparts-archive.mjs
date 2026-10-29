import fs from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
export const base =
  'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/';
export const cache = path.resolve('../work/bodyparts3d');
export async function sourceTable(name) {
  await fs.mkdir(cache, { recursive: true });
  try {
    return await fs.readFile(path.join(cache, name), 'utf8');
  } catch {
    const response = await fetch(base + name);
    if (!response.ok) throw new Error(`Source table ${response.status}`);
    const value = await response.text();
    await fs.writeFile(path.join(cache, name), value);
    return value;
  }
}
export async function conceptMap(tree) {
  const map = new Map();
  for (const row of (await sourceTable(`${tree}_element_parts.txt`))
    .trim()
    .split(/\r?\n/)
    .slice(1)) {
    const [id, name, file] = row.split('\t');
    if (!map.has(id)) map.set(id, { id, name, files: [] });
    map.get(id).files.push(file);
  }
  return map;
}
function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}
export async function archiveReader(
  tree,
  source = base + `${tree}_BP3D_4.0_obj_99.zip`,
) {
  async function range(start, end) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const r = await fetch(source, {
          headers: {
            Range: start < 0 ? `bytes=${start}` : `bytes=${start}-${end}`,
          },
          signal: AbortSignal.timeout(55000),
        });
        if (r.status !== 206) throw new Error(`Range status ${r.status}`);
        return Buffer.from(await r.arrayBuffer());
      } catch (e) {
        if (attempt === 3) throw e;
      }
    }
  }
  const tail = await range(-65536),
    eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 5, 6]));
  if (eocd < 0) throw new Error('Missing ZIP end record');
  const start = tail.readUInt32LE(eocd + 16),
    size = tail.readUInt32LE(eocd + 12);
  const directory = await range(start, start + size - 1),
    entries = new Map();
  for (let i = 0; i < directory.length;) {
    if (directory.readUInt32LE(i) !== 0x02014b50)
      throw new Error('Invalid directory');
    const nl = directory.readUInt16LE(i + 28),
      el = directory.readUInt16LE(i + 30),
      cl = directory.readUInt16LE(i + 32);
    const name = path.posix.basename(
      directory
        .subarray(i + 46, i + 46 + nl)
        .toString()
        .replaceAll('\\', '/'),
    );
    entries.set(name, {
      crc: directory.readUInt32LE(i + 16),
      size: directory.readUInt32LE(i + 20),
      unpacked: directory.readUInt32LE(i + 24),
      offset: directory.readUInt32LE(i + 42),
      method: directory.readUInt16LE(i + 10),
    });
    i += 46 + nl + el + cl;
  }
  const folder = path.join(cache, tree);
  await fs.mkdir(folder, { recursive: true });
  return {
    source,
    entries,
    async get(file) {
      const entry = entries.get(`${file}.obj`);
      if (!entry) throw new Error(`${tree}: missing ${file}`);
      const destination = path.join(folder, `${file}.obj`);
      let bytes;
      try {
        bytes = await fs.readFile(destination);
      } catch {
        const block = await range(
          entry.offset,
          entry.offset + entry.size + 511,
        );
        const payload = 30 + block.readUInt16LE(26) + block.readUInt16LE(28);
        if (payload + entry.size > block.length)
          throw new Error('ZIP header exceeds fetched prefix');
        const compressed = block.subarray(payload, payload + entry.size);
        bytes = entry.method === 8 ? inflateRawSync(compressed) : compressed;
      }
      if (bytes.length !== entry.unpacked || crc32(bytes) !== entry.crc)
        throw new Error(`CRC/size failure ${tree}/${file}`);
      await fs.writeFile(destination, bytes);
      return bytes;
    },
  };
}
export async function parallelMap(items, limit, fn) {
  let cursor = 0;
  const output = Array.from({ length: items.length });
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        output[i] = await fn(items[i], i);
      }
    }),
  );
  return output;
}
