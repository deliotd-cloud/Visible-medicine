import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { planAtlasDelivery } from '../scripts/prepare-atlas-delivery.mjs';

test('preparation validates complete originals and notices before allowing build-only model omission', () => {
  const root = mkdtempSync(join(tmpdir(), 'visible-medicine-delivery-test-'));
  const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  const write = (path: string, bytes: Buffer | string) => { mkdirSync(dirname(path), {recursive:true}); writeFileSync(path,bytes); };
  try {
    const records = [['models/shoulder.glb', Buffer.from('retained original model')], ['LICENSES/THIRD_PARTY_NOTICES.md', Buffer.from('Original notice')], ['index.html', Buffer.from('Original runtime')]] as const;
    const manifest = { patientDataIncluded:false, sourceCommit:'1'.repeat(40), files:records.map(([path,bytes])=>({path,bytes:bytes.length,sha256:digest(bytes)})) };
    const manifestBytes = Buffer.from(JSON.stringify(manifest));
    for (const prefix of ['public','dist/client']) {
      for (const [path, bytes] of [...records, ['manifest.json',manifestBytes]] as const) write(join(root,prefix,'atlas-runtime/shoulder',path),bytes);
    }
    const inventory = { sources:[{module:'shoulder',sourceCommit:manifest.sourceCommit,manifestSha256:digest(manifestBytes)}], models:[{paths:['/atlas-runtime/shoulder/models/shoulder.glb'],sha256:digest(records[0][1]),bytes:records[0][1].length}] };
    assert.equal(planAtlasDelivery(root,inventory).planned.length,1);
    assert.equal(planAtlasDelivery(root,inventory).companions.length,3);
    const built = join(root,'dist/client/atlas-runtime/shoulder/models/shoulder.glb');
    write(built,'corrupt'); assert.throws(()=>planAtlasDelivery(root,inventory)); write(built,records[0][1]);
    const extra = join(root,'dist/client/unregistered.glb');
    write(extra,'unregistered'); assert.throws(()=>planAtlasDelivery(root,inventory)); rmSync(extra);
    assert.throws(()=>planAtlasDelivery(root,inventory,true),'Existing static models must reject omitted-mode verification');
    rmSync(built); assert.equal(planAtlasDelivery(root,inventory,true).planned.length,1);
    assert.deepEqual(readFileSync(join(root,'public/atlas-runtime/shoulder/models/shoulder.glb')),records[0][1]);
    const notice = join(root,'dist/client/atlas-runtime/shoulder/LICENSES/THIRD_PARTY_NOTICES.md');
    write(notice,'lost notice'); assert.throws(()=>planAtlasDelivery(root,inventory,true));
  } finally {
    assert.ok(root.startsWith(join(tmpdir(),'visible-medicine-delivery-test-')));
    rmSync(root,{recursive:true,force:true});
  }
});
