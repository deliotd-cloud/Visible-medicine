import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';
const compiled=await build({stdin:{contents:"export * from './content/thoracoabdominal-orientation';",resolveDir:process.cwd(),loader:'ts'},format:'esm',platform:'node',bundle:true,write:false});
const {thoracoabdominalOrientationGroups:groups,thoracoabdominalOrientationReferences:refs}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const words=text=>text.match(/\S+/g)?.length??0;
const budgets={};let topics=0;
for(const group of Object.values(groups))for(const topic of Object.values(group)){topics++;assert(topic.body&&topic.pitfall);assert.equal(new Set(topic.references).size,topic.references.length);
 for(const key of topic.references){assert.equal(new URL(refs[key]).protocol,'https:');if(key!=='mraLimits')budgets[key]=(budgets[key]??0)+words(topic.body+' '+topic.pitfall);}
}
// MRA is not the source of the anatomical course paragraphs. Only these exact
// visibility caveats derive from its general modality limits; the per-vessel
// application is explicitly qualified, not a vessel-specific validation study.
const arterial='Routine MRI does not guarantee this small artery is seen; even dedicated MRA may have limited small-vessel detail.';
const venous='Routine MRI or arterial MRA cannot guarantee this small vein is seen or provide a complete venous drainage map; check actual venous-sensitive images.';
const getterSource=await readFile('lib/thoracoabdominal-orientation.ts','utf8');
assert(getterSource.includes(arterial),'Arterial visibility attribution must match the delivered note');
assert(getterSource.includes(venous),'Venous visibility attribution must match the delivered note');
budgets.mraLimits=words(arterial)+words(venous);assert.equal(budgets.mraLimits,41);
for(const [key,n]of Object.entries(budgets))assert(n<=200,key+' claim-scoped new-batch attribution exceeds budget');
assert.equal(topics,6);assert.equal(Object.keys(groups).length,5);
assert.match(groups.mesoappendix.ct.pitfall,/does not establish a separately resolved/);assert.match(groups.mesoappendix.mri.body,/not to assert a visible membrane/);
assert.match(groups['linea-alba'].mri.pitfall,/exploded gap is not diastasis/);
console.log(JSON.stringify({originalFactTexts:topics,sourceWordCounts:budgets,scope:'This batch, unique source-attributed facts; MRA only supports visibility caveats, not the anatomy prose. Not a whole-repository cumulative licence audit.',copiedMedia:false,clinicalApproval:false}));
