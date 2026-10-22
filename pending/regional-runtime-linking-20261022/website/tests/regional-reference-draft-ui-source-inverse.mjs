// Pure exact-byte inverse: product runtime-revision fixture → navigation-harness predecessor.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const currentHash='4f4d1e918dfaf0393a346d713e124b2417301f45db915b5edadd2333ddbb3f8c';
const priorHash='87c59dc7bfab758df61a81646d95194037c44b76ad13381181232a11aa84ee18';
const oldLine="const context=()=>contract.parseRegionalReferenceDraftContext({schema:'vm-regional-reference-teaching-draft-context-1',atlasRevision:'a'.repeat(40),mappingRevision:'b'.repeat(64),teachingRevision:'c'.repeat(64),target:{id:'vm:reference:synthetic',kind:'body',label:'Synthetic right knee',side:'right',sourceHash:'d'.repeat(64),specimenRevision:null,relation:'same-structure'},checklistVersion:'regional-reference-teaching-v1',clinicalApproval:false,publicationApproval:false,patientRegistration:false});";
const newLine="const context=()=>contract.parseRegionalReferenceDraftContext({schema:'vm-regional-reference-teaching-draft-context-1',atlasRevision:'a'.repeat(40),mappingRevision:'b'.repeat(64),teachingRevision:'c'.repeat(64),target:{id:'vm:reference:synthetic',kind:'body',label:'Synthetic right knee',side:'right',sourceHash:'d'.repeat(64),runtimeRevision:'a'.repeat(40),specimenRevision:null,relation:'same-structure'},checklistVersion:'regional-reference-teaching-v1',clinicalApproval:false,publicationApproval:false,patientRegistration:false});";

export function restoreRegionalReferenceDraftUiPrior(currentBytes,{readPrior=readFileSync}={}){
 assert.equal(sha(currentBytes),currentHash,'exact current draft-UI source');
 const prior=readPrior(new URL('./fixtures/regional-reference-draft-ui-prior/regional-reference-draft-ui.test.ts.raw',import.meta.url));
 assert.equal(sha(prior),priorHash,'exact complete navigation-harness predecessor');
 const source=Buffer.from(currentBytes).toString('utf8');
 assert.deepEqual(Buffer.from(source),currentBytes,'lossless current UTF-8');
 assert.equal(source.split(newLine).length-1,1,'unique full-line runtime fixture seam');
 assert.equal(source.split(oldLine).length-1,0,'old fixture line absent from new source');
 const restored=Buffer.from(source.replace(newLine,oldLine));
 assert.deepEqual(restored,prior,'entire predecessor restored; only runtime fixture line changed');
 return restored;
}
