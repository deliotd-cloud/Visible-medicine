import assert from 'node:assert/strict';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import {createTestEvidenceDirectory} from '../scripts/test-evidence-directory.mjs';
const fixture=()=>{const root=mkdtempSync(join(tmpdir(),'vm-evidence-location-')),site=join(root,'website'),external=join(root,'evidence');mkdirSync(site);return{root,site,external};};

test('external evidence is unique, remains local and does not write into the website',()=>{
  const {site,external}=fixture();
  const first=createTestEvidenceDirectory(site,'viewer-notice-role-runs',{evidenceRoot:external,label:'admission'});
  writeFileSync(join(first,'preserved.txt'),'existing evidence',{flag:'wx'});
  const second=createTestEvidenceDirectory(site,'viewer-notice-role-runs',{evidenceRoot:external,label:'admission'});
  assert.notEqual(first,second);assert(first.startsWith(external+sep));assert(second.startsWith(external+sep));
  assert.equal(readFileSync(join(first,'preserved.txt'),'utf8'),'existing evidence');assert(!existsSync(join(site,'.local')));
});

test('default output retains the existing .local group contract',()=>{
  const {site}=fixture();const output=createTestEvidenceDirectory(site,'website-test-runs');
  assert(output.startsWith(join(site,'.local','website-test-runs')+sep));
});

test('invalid or source-directory destinations fail before writing evidence',()=>{
  const {root,site}=fixture();
  for(const value of ['', 'relative', '../escape', site, join(site,'scripts'), '//server/share/private', '\\\\server\\share\\private'])
    assert.throws(()=>createTestEvidenceDirectory(site,'website-test-runs',{evidenceRoot:value}));
  for(const group of ['..','../escape','a/b','a\\b','A',''])assert.throws(()=>createTestEvidenceDirectory(site,group));
  assert.throws(()=>createTestEvidenceDirectory(site,'runs',{label:'../escape'}));
  assert(!existsSync(join(site,'.local')));assert.deepEqual(readdirSync(root),['website']);
});

test('directory links, linked ancestors and regular files cannot redirect evidence writes',()=>{
  const {root,site}=fixture(),target=join(root,'target'),link=join(root,'linked');mkdirSync(target);symlinkSync(target,link,'junction');
  for(const dest of [link,join(link,'child')])assert.throws(()=>createTestEvidenceDirectory(site,'runs',{evidenceRoot:dest}),/regular local directory/);
  assert.deepEqual(readdirSync(target),[]);
  const file=join(root,'file');writeFileSync(file,'keep');assert.throws(()=>createTestEvidenceDirectory(site,'runs',{evidenceRoot:file}));assert.equal(readFileSync(file,'utf8'),'keep');
});

test('the actual runner honors its external evidence root without changing discovery or execution claims',()=>{
  const {external}=fixture(),site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const before=existsSync(join(site,'.local','website-test-runs'))?readdirSync(join(site,'.local','website-test-runs')):[];
  const env={...process.env,VM_TEST_EVIDENCE_ROOT:external};delete env.NODE_TEST_CONTEXT;
  const result=spawnSync(process.execPath,['scripts/run-website-tests.mjs','--list'],{cwd:site,env,windowsHide:true,encoding:'utf8',timeout:60000});
  assert.equal(result.status,0,result.stderr);const summary=JSON.parse(result.stdout.trim());assert(summary.output.startsWith(external+sep));
  const receipt=JSON.parse(readFileSync(join(summary.output,'receipt.json'))),manifest=JSON.parse(readFileSync(join(summary.output,'manifest.json')));
  assert.equal(receipt.launched,false);assert.equal(manifest.mode,'list');assert(manifest.entries.includes('tests/test-evidence-directory.test.mjs'));
  const after=existsSync(join(site,'.local','website-test-runs'))?readdirSync(join(site,'.local','website-test-runs')):[];assert.deepEqual(after,before);
});
