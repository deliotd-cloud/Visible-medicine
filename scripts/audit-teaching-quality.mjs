import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {buildTeachingQualityReport} from './teaching-quality-report.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const topics = ['anatomy','function','ct','mri','xray','ultrasound','pathology','clinical','quiz'];
const regionFile = /^[a-z]+(?:-[a-z]+)*\.json$/;
const compilerCompanion = /^[a-z]+(?:-[a-z]+)*\.d\.json\.ts$/;
const maxFileBytes = 16 * 1024 * 1024;

/** Audit exact generated teaching snapshots; this never runs or certifies the resolver. */
export function auditTeachingSnapshots(directory) {
  const root = path.resolve(directory);
  assert(fs.lstatSync(root).isDirectory() && !fs.lstatSync(root).isSymbolicLink(), 'Expected a regular snapshot directory');
  const names = fs.readdirSync(root).sort();
  const snapshots = names.filter(name => regionFile.test(name));
  const companions = names.filter(name => compilerCompanion.test(name));
  for (const name of names) {
    assert(regionFile.test(name) || compilerCompanion.test(name), 'Unexpected snapshot filename');
    if (compilerCompanion.test(name)) {
      assert(snapshots.includes(name.replace(/\.d\.json\.ts$/, '.json')), 'Orphan compiler companion');
      const stat = fs.lstatSync(path.join(root, name));
      assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= maxFileBytes, 'Expected bounded regular compiler companion');
    }
  }
  assert(snapshots.length > 0, 'No teaching snapshots found');
  const inputs = [], lessons = [], identities = new Set(), labels = {};
  for (const name of snapshots) {
    const file = path.join(root,name), stat = fs.lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= maxFileBytes, 'Expected bounded regular snapshot file');
    const bytes = fs.readFileSync(file), snapshot = JSON.parse(bytes);
    const region = name.slice(0,-5);
    assert(snapshot && snapshot.schemaVersion === 1 && snapshot.region === region &&
      Array.isArray(snapshot.entries) && Array.isArray(snapshot.undefinedPaths), 'Invalid teaching snapshot');
    // Restore explicit undefined fields with the same own-property safety boundary
    // as the learner reader. The parsed copy is private to this audit.
    for (const keys of snapshot.undefinedPaths) {
      assert(Array.isArray(keys) && keys.length && keys[0] === 'entries', 'Invalid optional-field path');
      let parent = snapshot;
      for (const [index,key] of keys.entries()) {
        assert((typeof key === 'string' || Number.isSafeInteger(key)) &&
          !['__proto__','prototype','constructor'].includes(String(key)) && parent &&
          typeof parent === 'object' && Object.hasOwn(parent,key), 'Invalid optional-field path');
        if (index === keys.length - 1) { assert.equal(parent[key],null,'Invalid optional-field marker');parent[key]=undefined; }
        else parent=parent[key];
      }
    }
    const digest = hash(bytes);
    inputs.push({file:name,bytes:bytes.length,sha256:digest});
    for (const [entryIndex,entry] of snapshot.entries.entries()) {
      assert(entry && typeof entry.identity === 'string' && entry.identity && entry.lessons &&
        typeof entry.lessons === 'object' && !Array.isArray(entry.lessons) &&
        Object.keys(entry.lessons).length === topics.length && topics.every(t=>Object.hasOwn(entry.lessons,t)), 'Invalid teaching entry');
      const identity = hash(entry.identity);
      assert(!identities.has(identity), 'Duplicate teaching identity across snapshots');identities.add(identity);
      let publicIdentity;
      try { const value=JSON.parse(entry.identity);if(value && typeof value.id==='string' && typeof value.name==='string')publicIdentity={id:value.id,name:value.name}; } catch { /* Identity remains an exact opaque fingerprint. */ }
      labels[identity]={...publicIdentity,region,file:name,snapshotSha256:digest,entryIndex};
      for (const topic of topics) lessons.push({identity,region,topic,lesson:entry.lessons[topic]});
    }
  }
  const sourceRevision=hash(JSON.stringify(inputs));
  const audit=buildTeachingQualityReport({lessons,sourceRevision});
  // Reject a mixed observation if a source changed while the audit ran.
  assert.deepEqual(fs.readdirSync(root).sort(),names,'Snapshot file inventory changed');
  for(const input of inputs)assert.equal(hash(fs.readFileSync(path.join(root,input.file))),input.sha256,'Snapshot changed during audit');
  return {schema:'vm-generated-teaching-quality/1',source:{kind:'generated-regional-teaching-snapshots',sourceRevision,inputs,structures:identities.size,lessons:lessons.length,resolverFreshnessVerified:false,
    // Exact, paired filenames only. These compiler files contain no teaching and
    // are never loaded or evaluated. Their freshness belongs to the generator check.
    excludedCompilerCompanions:companions},audit,labels,limitations:['Editorial triage only; findings are not clinical errors or approvals.','Citation syntax is checked; source content, link availability and commercial rights are not verified.','Repeated main teaching is a review prompt, not proof of a defect.','This audits exact snapshot bytes and does not claim they match pending resolver changes.','Listed compiler companions are excluded, not validated or executed.'],clinicalApproval:false};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);
  assert(args.length===4 && args[0]==='--snapshots' && args[2]==='--out','Usage: node scripts/audit-teaching-quality.mjs --snapshots <directory> --out <new-report.json>');
  const report=auditTeachingSnapshots(args[1]);
  fs.writeFileSync(path.resolve(args[3]),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({sourceRevision:report.source.sourceRevision,structures:report.source.structures,lessons:report.source.lessons,report:path.resolve(args[3]),clinicalApproval:false}));
}
