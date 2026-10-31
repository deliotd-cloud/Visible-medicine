import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const baseline='G:/VisibleMedicine-temp/staging/20261031-release20-final/website';
const root='G:/VisibleMedicine-temp/proposals/20261031-atlas-hub-compact';
const sha=b=>createHash('sha256').update(b).digest('hex');
const edits=[
 ['components/AtlasModalityCards.tsx',[
  ["{layout==='list'?modality.overview:modality.description}",'{modality.description}'],
  ['<p>{atlasImagingScope}</p>','<p>{atlasImagingScope}</p>{atlasModalities.map(modality=><p key={modality.id}><strong>{modality.title}: </strong>{modality.overview}</p>)}']
 ]],
 ['tests/atlas-navigation.test.ts',[
  ["  assert.ok(cards.includes(\"layout==='list'?modality.overview:modality.description\"));\n",'']
 ]],
 ['tests/public-copy-review.test.ts',[
  ["  const cards = renderToStaticMarkup(loaded.exports.AtlasModalityCards({}));", "  const cards = renderToStaticMarkup(loaded.exports.AtlasModalityCards({}));\n  const list = renderToStaticMarkup(loaded.exports.AtlasModalityCards({layout:'list'}));\n  assert.match(notes, /<details class=\"atlas-hub-notes\"><summary>/, 'details start collapsed');\n  for (const modality of atlasNavigation.atlasModalities) {\n    assert(list.includes(modality.description), modality.id + ': concise description remains visible');\n    assert(!list.includes(modality.overview), modality.id + ': long guidance is outside the navigation cards');\n    assert(notes.includes(modality.overview), modality.id + ': complete guidance remains available');\n    assert(list.includes(modality.status), modality.id + ': availability remains visible');\n    assert(list.includes(modality.caption), modality.id + ': reference-image caption remains visible');\n  }"]
 ]]
];
const files=[];
for(const [relative,replacements] of edits){
 const before=fs.readFileSync(baseline+'/'+relative);let after=before.toString();
 for(const [a,b] of replacements){assert.equal(after.split(a).length,2,relative+': unique replacement');after=after.replace(a,b);}
 const dest=root+'/files/'+relative;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,after,{flag:'wx'});
 files.push({path:relative,beforeSha256:sha(before),afterSha256:sha(after)});
}
fs.writeFileSync(root+'/MANIFEST.json',JSON.stringify({schema:'vm-atlas-hub-compact/1',baseline,files,scope:'Concise descriptions on all five Atlas cards; complete existing guidance inside collapsed image sources and availability. Routes, status, image captions, clinical and registration disclosures retained. Local candidate only.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposal:root,files:files.length}));
