import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,realpathSync} from 'node:fs';
import {join} from 'node:path';

const identities=new Map([
 [56,{root:'F:/VisibleMedicine/staging/20261020-authenticated-old-websites/website56',variable:'VM_CLOSED_WEBSITE_56_ROOT',commit:'988e05317f5042afff5ac4e0369b683e264f7f33',tree:'750df1595536f9bcc5d8fdf5c45d9329e2edc452'}],
 [57,{root:'F:/VisibleMedicine/staging/20261020-authenticated-old-websites/website57',variable:'VM_CLOSED_WEBSITE_57_ROOT',commit:'446d3d75eca72c36a16efe387440c4a93ca4b480',tree:'6977905405a44f55903b542f41e0bdf3b933bbfc'}],
]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function checkedHistoricalWebsiteRoot(epoch,pin,{configured=process.env[identities.get(epoch)?.variable]??identities.get(epoch)?.root}={}){
 const expected=identities.get(epoch);
 assert(expected,'Unsupported historical Website epoch');
 assert(typeof configured==='string'&&configured.length>0,'Historical Website root required');
 const run=(...args)=>execFileSync('git',['-C',configured,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 const root=run('rev-parse','--show-toplevel');
 assert.equal(realpathSync(configured),realpathSync(root),'Historical Website must be its repository root');
 assert.equal(run('rev-parse','HEAD'),expected.commit,'Historical Website commit changed');
 assert.equal(run('rev-parse','HEAD^{tree}'),expected.tree,'Historical Website tree changed');
 assert.equal(run('status','--porcelain=v1','--untracked-files=all'),'','Historical Website worktree is dirty');
 assert.equal(pin.source,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd','Historical Atlas binding changed');
 const bytes=readFileSync(join(root,'atlas-review/integration-inputs.json'));
 assert.equal(sha(bytes),pin.documents['atlas-review/integration-inputs.json'],'Historical Website integration inputs changed');
 const inputs=JSON.parse(bytes);
 assert.equal(inputs.sourceCommit,pin.source,'Historical Website source binding changed');
 assert.equal(inputs.sha256,pin.reviewIntegration,'Historical Website integration digest changed');
 assert.equal(sha(JSON.stringify(inputs.inputs)),pin.reviewIntegration,'Historical Website integration rows changed');
 assert.equal(inputs.inputs.length,1661,'Historical Website input count changed');
 return root;
}
