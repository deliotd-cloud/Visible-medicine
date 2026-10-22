import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const reviewDocuments=['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json'];
const deliveryDocuments=[...reviewDocuments,'lib/atlas-model-inventory.json','public/atlas-runtime/head-neck/manifest.json','public/atlas-runtime/head-neck/source-inputs.json'];
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,`Unique source seam: ${from}`);return text.replace(from,to);};

export function restorePreNeckPin2381(currentBytes,preNeckBytes){
 assert.equal(sha(currentBytes),'9313b2135cb50648751e50e49643479ec8bf83f2fe4f787bc2c25d4a632302a1','Exact 2381 current pin');
 assert.equal(sha(preNeckBytes),'a023587c2bfd645d92e809265b80c6fc24e4b17b6d973623eef110b7c25a340d','Exact 6d7 pre-neck pin');
 const current=JSON.parse(currentBytes),prior=JSON.parse(preNeckBytes),inverse=structuredClone(current);
 assert.deepEqual(Object.keys(current),Object.keys(prior),'All pin fields preserved');
 assert.deepEqual(Object.keys(current.documents),Object.keys(prior.documents),'All document roles preserved');
 assert.deepEqual(Object.keys(current).filter(k=>k!=='documents'&&JSON.stringify(current[k])!==JSON.stringify(prior[k])).sort(),
  ['source','sourceTree','runtimeSources','reviewIntegration','reviewSourceFiles'].sort());
 assert.deepEqual(Object.keys(current.documents).filter(path=>current.documents[path]!==prior.documents[path]).sort(),deliveryDocuments.sort());
 assert.equal(current.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');
 assert.equal(current.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');
 assert.equal(current.reviewIntegration,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc');
 assert.equal(current.reviewSourceFiles,1562);
 for(const key of ['source','sourceTree','runtimeSources','reviewIntegration','reviewSourceFiles'])inverse[key]=prior[key];
 for(const path of deliveryDocuments)inverse.documents[path]=prior.documents[path];
 assert.deepEqual(inverse,prior,'Complete current-to-6d7 pin inverse');
 return preNeckBytes;
}

export function restorePreNeckDelivery2381(currentBytes,preNeckBytes){
 assert.equal(sha(currentBytes),'7f745b24ac233d3d9fca6b80a54e5387f2dc50eafa45a372cdb615520473b8b8','Exact current delivery test');
 assert.equal(sha(preNeckBytes),'303a1ba566b8dbbac99e06206f92ad5df3634579fb29bb696a64f4c5a4529cea','Exact 6d7 delivery test');
 let source=currentBytes.toString('utf8');
 source=once(source,"assert.equal(CURRENT_ATLAS_REVISION,'2381efe43b75f8a7fb768a069eecd7268c508dac');","assert.equal(CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');");
 source=once(source,"assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');","assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');");
 source=once(source,"'head-neck':'2381efe43b75f8a7fb768a069eecd7268c508dac'","'head-neck':'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'");
 source=once(source,'assert.equal(sourceFiles,1562);assert.equal(inputs,1729);assert(artifacts>100);',
  'assert.equal(sourceFiles,1558);assert.equal(inputs,1724);assert(artifacts>100);');
 assert.deepEqual(Buffer.from(source),preNeckBytes,'Complete current delivery test inverse, all refusals retained');
 return preNeckBytes;
}

export function restorePreNeckHeadTeaching2381(currentBytes){
 assert.equal(sha(currentBytes),'574d55fe8bfdfdc0b6af35c2e1497162320a42e4190962795639667d72e240fd','Exact current neck teaching');
 const source=JSON.parse(currentBytes),priorXray={readiness:'pending',title:'X-ray teaching pending',
  body:'A source-specific X-ray lesson has not yet been authored for this selection. The coloured 3D surface is not a radiograph.',
  note:'No X-ray image, detector geometry or registered correspondence is loaded. Separate imaging-atlas and lecture access will be checked independently.'};
 for(const [index,title]of [[0,'Hyoid bone'],[128,'Cricoid cartilage'],[233,'Epiglottis']]){
  assert.equal(source.entries[index].lessons.xray.title,`${title} · Lateral neck radiograph orientation · draft`);
  source.entries[index].lessons.xray=priorXray;
 }
 const restored=Buffer.from(JSON.stringify(source)+'\n');
 assert.equal(sha(restored),'e6a486cc4ab9745eae110615b340fa1797bb0e6e0b72195f083bec766543da25','Entire pre-neck teaching source');
 return restored;
}

export function restorePrePresentationViewer2381(currentBytes,restorePracticeExitViewer){
 let source=restorePracticeExitViewer(currentBytes.toString('utf8'));
 source=once(source,'{count} listed annotations · per-structure scope varies · no diagnostic use',
  '{count} accepted annotations · no diagnostic use');
 source=once(source,'Approved cosmetics v1.0.2 (display only) · {count} listed annotations.</p><details onKeyDown={headDisclosureKeyDown}><summary>Annotation count and review scope</summary><p>This is the package’s fixed modality inventory. Entries may be masks or point/curve locators; review each selected representation and declared anatomical scope above. The total does not establish complete boundaries, teaching approval or clinical sign-off.</p></details>',
  'Approved cosmetics v1.0.2 · {count} accepted annotations.</p>');
 assert.equal(sha(source),'a9b7c4b3d8f4febab394e983ace55df020cbcc84dc33daa8b2af6e7abd90fd1b',
  'Exact pre-presentation viewer before head-toolbar history inverse');
 return Buffer.from(source);
}
