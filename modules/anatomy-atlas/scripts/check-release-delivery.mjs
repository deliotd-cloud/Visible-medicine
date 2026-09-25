#!/usr/bin/env node
// Read-only comparison with an explicit website checkout and saved native response.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateReleaseReadiness } from './release-readiness.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function checkReleaseDelivery({ milestone, websiteRevision, manifestBytes, inventoryBytes, publication }) {
  const schema = evaluateReleaseReadiness(milestone);
  assert(schema.valid, schema.errors.join('\n'));
  const candidate = milestone.candidate;
  const { website, sharedViewer } = candidate.delivery;
  const { deployment, version } = publication;
  assert.equal(websiteRevision, candidate.websiteRevision, 'Website checkout differs from recorded candidate');
  assert.equal(version.source.commit_sha, websiteRevision, 'Saved version source differs');
  assert.equal(version.version_number, website.versionNumber, 'Saved version number differs');
  assert.equal(version.id, website.versionId, 'Saved version ID differs');
  assert.equal(deployment.id, website.deploymentId, 'Deployment ID differs');
  assert.equal(version.deployment_id, deployment.id, 'Version deployment differs');
  assert.equal(deployment.version_id, version.id, 'Deployment version differs');
  assert.equal(typeof version.project_id, 'string', 'Sites project must be present');
  assert(version.project_id.trim(), 'Sites project must be nonempty');
  assert.equal(deployment.project_id, version.project_id, 'Sites project differs');
  assert.equal(deployment.status, 'succeeded', 'Deployment did not succeed');
  assert.equal(sha(manifestBytes), sharedViewer.manifestSha256, 'Viewer manifest bytes differ');
  assert.equal(sha(inventoryBytes), sharedViewer.inventorySha256, 'Model inventory bytes differ');
  const manifest = JSON.parse(manifestBytes);
  const inventory = JSON.parse(inventoryBytes);
  assert.equal(manifest.sourceCommit, candidate.atlasRevision, 'Embedded Atlas source differs');
  const sources = inventory.sources.filter(source => source.module === 'head-neck');
  assert.equal(sources.length, 1, 'Shared viewer inventory source must be unique');
  assert.equal(sources[0].sourceCommit, candidate.atlasRevision, 'Inventory Atlas source differs');
  assert.equal(sources[0].manifestSha256, sharedViewer.manifestSha256, 'Inventory manifest fingerprint differs');
  assert.equal(inventory.models.length, sharedViewer.modelCount, 'Model count differs');
  const paths = inventory.models.flatMap(model => model.paths);
  assert.equal(new Set(paths).size, paths.length, 'Duplicate protected model paths');
  assert.equal(paths.length, sharedViewer.pathCount, 'Protected path count differs');
  return { matched: true, releaseReady: schema.ready };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [websitePath, publicationPath, ...extra] = process.argv.slice(2);
    assert(websitePath && publicationPath && !extra.length,
      'Usage: node scripts/check-release-delivery.mjs <website-checkout> <publication-json>');
    const git = (...args) => execFileSync('git', ['-C', resolve(websitePath), ...args], { maxBuffer: 16 * 1024 * 1024 });
    assert.equal(git('status', '--porcelain').toString().trim(), '', 'Website checkout must be clean');
    const checked = checkReleaseDelivery({
      milestone: JSON.parse(readFileSync(new URL('../content/first-release-milestone.json', import.meta.url))),
      websiteRevision: git('rev-parse', 'HEAD').toString().trim(),
      manifestBytes: git('show', 'HEAD:public/atlas-runtime/head-neck/manifest.json'),
      inventoryBytes: git('show', 'HEAD:lib/atlas-model-inventory.json'),
      publication: JSON.parse(readFileSync(resolve(publicationPath))),
    });
    console.log('PASS candidate matches clean website Git source, viewer/inventory and saved publication response.');
    console.log(`Gate record ready: ${checked.releaseReady}. Snapshot consistency only: no live cloud, model-payload, audience, identity or clinical approval verification.`);
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  }
}
