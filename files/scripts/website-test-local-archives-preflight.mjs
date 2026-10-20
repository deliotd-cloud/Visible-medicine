import { createHash } from 'node:crypto';
import { createReadStream, lstatSync } from 'node:fs';
import { join } from 'node:path';

// Historical test evidence held only in the local checkout. These JSON archives
// are deliberately excluded from public source exports.
export const requiredLocalTestArchives = Object.freeze([
  { path: 'tests/fixtures/hand-vessel-xray-589-delivery-archive-v3.json', sha256: '422e4ccfeb1f440a31fb6a1cf218c9171b0cc0471d66911d2cafdb51e7934904' },
  { path: 'tests/fixtures/head-pilot-9fba-epoch.json', sha256: '644bae978dcd4e2a167e119788fdf7d8e7ce32052b375e431159405a766b87c0' },
  { path: 'tests/fixtures/historical-inline-45-epoch.json', sha256: '6f64fd26f4608c813aeb9c08bb98e3c3293f593fd2675b4c27f39350c2f3ba8e' },
  { path: 'tests/fixtures/historical-inline-46-epoch.json', sha256: '75281702b12599ee02c2d15c2996bea149062a4ad509040baf381eb1d190c9c3' },
  { path: 'tests/fixtures/intracranial-us-589-delivery-archive.json', sha256: '650ceba861ab61694d07a8bd8c0b7736b70149d7bf565f853e7aed3dc06c543b' },
]);

const remedy = 'Restore trusted local test evidence at these exact paths; do not add these archives to public source exports. This runner does not fetch, repair, or copy them.';

function regularDirectory(path) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('nonregular or symlink directory');
}

async function digestFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function assertWebsiteLocalTestArchives(root, archives = requiredLocalTestArchives) {
  const failures = [];
  for (const { path, sha256 } of archives) {
    if (!/^tests\/fixtures\/[A-Za-z0-9._/-]+\.json$/.test(path) || path.split('/').includes('..') || !/^[a-f0-9]{64}$/.test(sha256))
      throw new Error(`Website local test archive preflight: invalid required archive specification: ${path}`);
    try {
      regularDirectory(root);
      regularDirectory(join(root, 'tests'));
      regularDirectory(join(root, 'tests', 'fixtures'));
      const file = join(root, ...path.split('/'));
      const stat = lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('nonregular or symlink file');
      const actual = await digestFile(file);
      if (actual !== sha256) failures.push(`${path} (SHA-256 mismatch)`);
    } catch (error) {
      failures.push(`${path} (${error?.code === 'ENOENT' ? 'missing' : error?.message || 'unreadable'})`);
    }
  }
  if (failures.length) throw new Error(`Website local test archive preflight: ${failures.length}/${archives.length} required local archive(s) unavailable or changed: ${failures.join('; ')}. ${remedy}`);
  return { checkedLocalArchives: archives.length };
}
