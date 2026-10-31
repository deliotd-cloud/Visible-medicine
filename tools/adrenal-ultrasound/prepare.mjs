import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const base='G:/VisibleMedicine-temp/staging/20261031-visual-ct-guidance-ready/atlas',root='G:/VisibleMedicine-temp/proposals/20261031-adrenal-ultrasound-commercial';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const file='content/renal-teaching.ts',before=read(base+'/'+file).toString();
assert.equal(sha(Buffer.from(before)),'7512d9ce196363f9349e6740fd4a0fad9122f3677e468dfa9a411423ff5c8163');
const entries=[
 {id:'renal-inferior-suprarenal-artery',fmaIds:['FMA69265'],reference:'renalFetalAdrenalDoppler',url:'https://doi.org/10.1186/s12884-020-03480-z',title:'Xu et al. · Fetal adrenal artery Doppler (2020; CC BY 4.0)',
  body:'Fetal Doppler example: Xu and colleagues followed the inferior adrenal artery along the upper kidney pole using colour Doppler and recorded flow-velocity waveforms. Their low-risk pregnancy study does not establish routine adult visibility or adult reference ranges. This adult mesh supplies no waveform, perfusion measurement or fetal model; the defective left arterial surface remains withheld. Summary adapted from Xu et al. (2020), CC BY 4.0.'},
 {id:'renal-suprarenal-veins',fmaIds:['FMA14343','FMA14349'],reference:'renalAdrenalVeinLaparoscopicUltrasound',url:'https://pubmed.ncbi.nlm.nih.gov/10670859/',title:'Brunt et al. · Laparoscopic ultrasound of adrenal tumours (1999; abstract)',
  body:'Intraoperative ultrasound example: an older adrenal-tumour series demonstrated the gland’s relationship to the kidney and nearby vessels during laparoscopic surgery, but the adrenal vein was seen in only six of 28 operations. This describes a selected surgical setting, not a routine abdominal-ultrasound detection rate or a side-specific normal standard. On acquired images, establish continuity with adjacent vessels; these paired source surfaces provide neither an ultrasound view nor a validated venous junction.'},
];
const newline=before.includes('\r\n')?'\r\n':'\n';let after=before;
for(const entry of entries){
 const start=after.indexOf("    id: '"+entry.id+"'");assert(start>0);assert.equal(after.split("    id: '"+entry.id+"'").length,2);
 const marker='    imaging: {'+newline,point=after.indexOf(marker,start);assert(point>start);const end=after.indexOf('    modelLimit:',point);assert(end>point);
 assert(!after.slice(point,end).includes('ultrasound:'));
 const at=point+marker.length;after=after.slice(0,at)+`      ultrasound: draft(${JSON.stringify(entry.body)}, '${entry.reference}'${entry.id==='renal-inferior-suprarenal-artery'?", 'renalReuseLicense'":''}),${newline}`+after.slice(at);
}
const marker='export const renalTeachingReferences = {'+newline;assert.equal(after.split(marker).length,2);
const references=entries.map(e=>`  ${e.reference}: {\n    title: ${JSON.stringify(e.title)},\n    url: '${e.url}',\n    scopedToConcept: true,\n  },\n`).join('').replaceAll('\n',newline);
after=after.replace(marker,marker+references);write(root+'/atlas/'+file,after);
const catalog=JSON.parse(read(base+'/public/models/bodyparts3d/renal/catalog.json'));
const selections=catalog.structures.filter(s=>entries.some(e=>e.fmaIds.includes(s.fmaId))).map(s=>({id:s.id,parentId:s.parentId,fmaId:s.fmaId,laterality:s.laterality}));
assert.equal(selections.length,3);assert.equal(selections.filter(s=>s.fmaId==='FMA69265'&&s.laterality==='right').length,1);
write(root+'/CONTENT_PROPOSAL.json',{at:new Date().toISOString(),base,basePrepared:{path:path.dirname(base)+'/SOURCE_PREPARED.json',sha256:sha(read(path.dirname(base)+'/SOURCE_PREPARED.json'))},file,before:sha(Buffer.from(before)),after:sha(Buffer.from(after)),entries,expectedSelections:selections,expectedAddedRuntimeTopics:3,licensing:'Original concise summaries and citations only; no article text passages, figures, tables, waveforms, images, data or meshes copied.',generated:false,clinicalApproval:false,installed:false});
console.log(JSON.stringify({file,concepts:2,expectedSelections:3,words:entries.map(e=>({id:e.id,words:e.body.split(/\s+/).length})),sha256:sha(Buffer.from(after))}));
