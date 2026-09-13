import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATLAS_DELIVERY_POLICY } from '../lib/atlas-delivery-policy.ts';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function regularWithin(root, path) {
  const inside = relative(root, realpathSync(path));
  assert.ok(inside && !inside.startsWith(`..${sep}`) && inside !== '..', 'Outside the verified output directory');
  for (let current = path; current !== root; current = dirname(current)) {
    assert.ok(!lstatSync(current).isSymbolicLink(), 'Symlink in output path');
  }
  assert.ok(lstatSync(path).isFile(), 'Expected a regular file');
}
function files(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(root, entry.name);
    assert.ok(!entry.isSymbolicLink(), 'Symlink in build output');
    return entry.isDirectory() ? files(path) : [path];
  });
}

/** Validate everything before any single-file removal. Public/source originals
 * and notices are never removed. Rebuilding recreates the duplicate GLBs. */
export function planAtlasDelivery(project, inventory, omitted = false) {
  const client = realpathSync(resolve(project, 'dist/client'));
  assert.equal(client, resolve(project, 'dist/client'), 'Client root must not be redirected');
  const models = new Map(inventory.models.flatMap(model => model.paths.map(path => [path, model])));
  const planned = [], companions = [];
  for (const source of inventory.sources) {
    const manifestPath = `/atlas-runtime/${source.module}/manifest.json`;
    const manifestBytes = readFileSync(resolve(project, `public${manifestPath}`));
    assert.equal(hash(manifestBytes), source.manifestSha256);
    const manifest = JSON.parse(manifestBytes);
    assert.equal(manifest.patientDataIncluded, false);
    assert.equal(manifest.sourceCommit, source.sourceCommit);
    const manifestBuild = resolve(client, manifestPath.slice(1));
    regularWithin(client, manifestBuild);
    assert.deepEqual(readFileSync(manifestBuild), manifestBytes);
    companions.push({ path: manifestPath, sha256: hash(manifestBytes) });
    for (const file of manifest.files) {
      assert.match(file.path, /^[a-zA-Z0-9_./-]+$/);
      assert.ok(file.path.split('/').every(part => part && part !== '.' && part !== '..'));
      const path = `/atlas-runtime/${source.module}/${file.path}`;
      const original = resolve(project, `public${path}`);
      regularWithin(realpathSync(resolve(project, 'public')), original);
      assert.equal(readFileSync(original).length, file.bytes);
      assert.equal(hash(readFileSync(original)), file.sha256, `Original changed: ${path}`);
      const built = resolve(client, path.slice(1));
      if (file.path.endsWith('.glb')) {
        const model = models.get(path);
        assert.ok(model, `Unregistered model: ${path}`);
        assert.equal(model.sha256, file.sha256); assert.equal(model.bytes, file.bytes);
        planned.push({ path, sha256: model.sha256, bytes: model.bytes });
        if (omitted) { assert.ok(!existsSync(built), `Static bypass remains: ${path}`); continue; }
      } else companions.push({ path, sha256: file.sha256 });
      regularWithin(client, built);
      assert.equal(hash(readFileSync(built)), file.sha256, `Build changed: ${path}`);
      assert.equal(lstatSync(built).size, file.bytes);
    }
  }
  assert.equal(planned.length, models.size);
  assert.equal(new Set(planned.map(file => file.path)).size, planned.length);
  const glbs = files(client).filter(path => path.endsWith('.glb'));
  assert.equal(glbs.length, omitted ? 0 : planned.length, 'Unregistered static GLB would bypass delivery');
  for (const path of glbs) assert.ok(models.has('/' + relative(client, path).split(sep).join('/')));
  return { planned, companions };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  assert.ok(['--plan', '--apply', '--verify'].includes(mode), 'Use --plan, --apply or --verify');
  const project = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
  const git = (...args) => execFileSync('git', args, { cwd: project, encoding: 'utf8' }).trim();
  assert.equal(git('status', '--porcelain'), '', 'Commit exact source before preparing delivery');
  execFileSync(process.execPath, [resolve(project, 'scripts/atlas-model-inventory.mjs'), '--check'], { cwd: project });
  const inventoryBytes = readFileSync(resolve(project, 'lib/atlas-model-inventory.json'));
  assert.equal(hash(inventoryBytes), ATLAS_DELIVERY_POLICY.manifestRevision);
  assert.equal(ATLAS_DELIVERY_POLICY.audience, 'administrator-review', 'Learner activation requires a separate reviewed release workflow');
  const server = files(resolve(project, 'dist/server')).filter(path => path.endsWith('.js')).map(path => readFileSync(path, 'utf8')).join('\n');
  for (const required of ['registered-storage-v1', '/api/atlas-delivery/', ATLAS_DELIVERY_POLICY.manifestRevision]) assert.ok(server.includes(required), `Missing delivery implementation: ${required}`);
  const plan = planAtlasDelivery(project, JSON.parse(inventoryBytes), mode === '--verify');
  const receipt = { schemaVersion: 1, source: git('rev-parse', '--verify', 'HEAD'), sourceTree: git('rev-parse', 'HEAD^{tree}'), inventorySha256: hash(inventoryBytes), audience: ATLAS_DELIVERY_POLICY.audience, ...plan };
  const receiptPath = resolve(project, 'dist/.openai/atlas-model-delivery.json');
  if (mode === '--apply') {
    assert.ok(!existsSync(receiptPath), 'Existing preparation receipt; verify or rebuild instead');
    // Every target is an exact validated regular file within dist/client.
    for (const model of plan.planned) unlinkSync(resolve(project, `dist/client${model.path}`));
    planAtlasDelivery(project, JSON.parse(inventoryBytes), true);
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
  }
  if (mode === '--verify') assert.deepEqual(JSON.parse(readFileSync(receiptPath)), receipt);
  console.log(JSON.stringify({ mode, models: plan.planned.length, omittedBytes: plan.planned.reduce((sum, model) => sum + model.bytes, 0), companionFiles: plan.companions.length, source: receipt.source }));
}
