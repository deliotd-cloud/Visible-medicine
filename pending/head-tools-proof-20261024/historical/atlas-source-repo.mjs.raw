import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {realpathSync} from 'node:fs';

export function checkedAtlasSourceRepo(expectedRevision) {
  const configured = process.env.VM_ATLAS_SOURCE_REPO ?? 'F:/VisibleMedicine/atlas';
  const root = execFileSync('git', ['-C', configured, 'rev-parse', '--show-toplevel'], {encoding: 'utf8', windowsHide: true}).trim();
  assert.equal(realpathSync(configured), realpathSync(root), 'Atlas source must be its repository root');
  const revision = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {encoding: 'utf8', windowsHide: true}).trim();
  assert.equal(revision, expectedRevision, 'Atlas source revision changed');
  return root;
}

/** Locate an immutable commit for historical Git-only replay, never current delivery. */
export function checkedAtlasHistoryRepo(expectedRevision) {
  assert.match(expectedRevision, /^[a-f0-9]{40}$/, 'Historical Atlas revision must be a full commit SHA');
  const configured = process.env.VM_ATLAS_SOURCE_REPO ?? 'F:/VisibleMedicine/atlas';
  const options = {encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
  const root = execFileSync('git',['-C',configured,'rev-parse','--show-toplevel'],options).trim();
  assert.equal(realpathSync(configured),realpathSync(root),'Atlas history must be its repository root');
  const revision = execFileSync('git',['-C',root,'rev-parse',expectedRevision+'^{commit}'],options).trim();
  assert.equal(revision,expectedRevision,'Historical Atlas commit identity changed');
  return root;
}
