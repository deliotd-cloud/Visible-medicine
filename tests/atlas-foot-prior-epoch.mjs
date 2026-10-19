// Test-only replay of the complete website delivery immediately before foot ultrasound.
// Current foot delivery is checked separately; this epoch never becomes a runtime import.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync as liveReadFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';

export const preFootWebsiteEpoch = 'f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
export const spinalWebsiteEpoch = '92f5c1bf3a262699a7217454b9d5e5626e4f5659';
export const preSpinalWebsiteEpoch = 'd6c37e4df4065fb832bf89b3a1a825de0d3033ff';
const cache = new Map();
const prefixes = ['atlas-review/', 'public/atlas-runtime/', 'public/atlas-review-viewer/'];
const allowedEpochs = new Set([preFootWebsiteEpoch, spinalWebsiteEpoch, preSpinalWebsiteEpoch]);

function epochBytesAt(revision, path) {
  assert(allowedEpochs.has(revision), 'Unrecognised website history epoch');
  assert(typeof path === 'string' && prefixes.some(prefix => path.startsWith(prefix)));
  assert(!path.includes('..') && !path.includes('\\') && !path.startsWith('/'));
  const key = `${revision}:${path}`;
  if (!cache.has(key)) cache.set(key, execFileSync('git', ['show', key], {
    maxBuffer: 32e6, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
  }));
  return cache.get(key);
}
export const epochBytes = path => epochBytesAt(preFootWebsiteEpoch, path);
export const spinalEpochBytes = path => epochBytesAt(spinalWebsiteEpoch, path);

export function epochReadFileSync(revision) {
  assert(allowedEpochs.has(revision), 'Unrecognised website history epoch');
  return (path, encoding) => {
    if (typeof path === 'string' && prefixes.some(prefix => path.startsWith(prefix))) {
      const bytes = epochBytesAt(revision, path);
      return encoding ? bytes.toString(encoding) : bytes;
    }
    return liveReadFileSync(path, encoding);
  };
}
export const readFileSync = epochReadFileSync(preFootWebsiteEpoch);

export function epochImportPlugin(revision = preFootWebsiteEpoch) {
  assert(allowedEpochs.has(revision), 'Unrecognised website history epoch');
  return { name: 'saved-pre-foot-website-review', setup(api) {
    api.onLoad({ filter: /\.(?:ts|tsx|json)$/ }, args => {
      const path = relative(process.cwd(), args.path).replaceAll('\\', '/');
      if (!path.startsWith('atlas-review/')) return;
      return { contents: epochBytesAt(revision, path).toString(),
        loader: path.endsWith('.json') ? 'json' : path.endsWith('.tsx') ? 'tsx' : 'ts',
        resolveDir: dirname(args.path) };
    });
  } };
}
