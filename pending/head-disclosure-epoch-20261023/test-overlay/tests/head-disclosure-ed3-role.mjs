// One exact test-source projection, never production/delivery/approval data.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export const disclosureTestRoles=Object.freeze({current:'5322367638025a91ee6836ac645c714ec5498af8e47b971327c35d817dc0943b',tools:'999704133a16bff87fb69948a0ef67ba3b5973218235ee3b99ef2d455cbfe58d'});
const sourceLine=(source,tree)=>` assert.equal(now.source,'${source}');assert.equal(now.sourceTree,'${tree}');assert.notEqual(now.source,old.source);assert.notEqual(now.sourceTree,old.sourceTree);`;
const bindingLine=(sources,inputs,digest)=>` assert.equal(now.reviewSourceFiles,${sources});assert.equal(binding.inputs.length,${inputs});assert.equal(binding.sha256,'${digest}');assert.equal(binding.sha256,now.reviewIntegration);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);`;
const currentLine=digest=>` assert.equal(current.reviewIntegration,'${digest}');`;
const currentBinding='fc7ad671e664f4169f035790486a1b699ddc4e2f431ba1d7daafb5b572b402ab',toolsBinding='3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a';
const seams=[
 ["test('current Review binds the actual disclosure helper and viewer with emitted runtime and model evidence',()=>{","test('current 190 Review binds the actual disclosure helper and viewer with emitted runtime and model evidence',()=>{"],
 [sourceLine('ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f','0305c15be5fb58ea7729a3849bbbdb6e1e40649d'),sourceLine('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1','e9165d7122361f809a267af1414b337b69097fe2')],
 [bindingLine(1569,1737,currentBinding),bindingLine(1558,1724,toolsBinding)],
 [currentLine(currentBinding),currentLine(toolsBinding)],
];
const once=(value,from,to)=>{assert.equal(value.split(from).length,2,'Only the exact unique declared current-role line');return value.replace(from,to);};
export function restoreEd3DisclosureToToolsEpoch(bytes){
 assert(Buffer.isBuffer(bytes),'Exact source bytes required');assert.equal(sha(bytes),disclosureTestRoles.current,'Only authenticated complete ed3 disclosure test source');
 const current=bytes.toString('utf8');assert.deepEqual(Buffer.from(current),bytes,'Lossless full source');let prior=current;
 for(const [from,to]of seams)prior=once(prior,from,to);const restored=Buffer.from(prior);assert.equal(sha(restored),disclosureTestRoles.tools,'Authenticated complete tools-epoch source');
 let forward=prior;for(const [from,to]of seams.toReversed())forward=once(forward,to,from);assert.equal(forward,current,'Every assertion and byte round-trips across three identity lines and one historic test title');return restored;
}
