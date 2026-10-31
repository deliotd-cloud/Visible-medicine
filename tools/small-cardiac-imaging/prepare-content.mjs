import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const base='G:/VisibleMedicine-temp/staging/20261031-visual-ct-guidance-ready/atlas',root='G:/VisibleMedicine-temp/proposals/20261031-small-cardiac-imaging';
const file='content/coronary-venous-teaching.ts',read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex');
const before=read(base+'/'+file).toString();assert.equal(sha(Buffer.from(before)),'4b4e26e170b17d6cd6bdbb42dccf1860eaa185517cf312038b0cfec83da349b3');
const references=`  smallCardiacVenographyCase: {
    title: 'Sifrig et al. · Anomalous small cardiac vein on venography (2018 case report)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30473972/',
    scopedToConcept: true,
  },
  smallCardiacEchoCase: {
    title: 'Lu et al. · Small cardiac vein drainage with coronary sinus ostial atresia (2025 case report)',
    url: 'https://doi.org/10.1002/jcu.23993',
    scopedToConcept: true,
  },
`;
const xray='Contrast X-ray venography can show the small cardiac vein when it fills with contrast. A published case depicted an enlarged anomalous vein along the right heart border, with abnormal drainage to the superior vena cava in the setting of caval obstruction. This is a variant case, not a normal chest-radiograph landmark or a prevalence estimate. Compare course and drainage on the acquired views; the two grouped model surfaces do not establish an open lumen, junction or patient-specific route.';
const ultrasound='A case report used echocardiography to identify an enlarged small cardiac vein communicating with a dilated coronary sinus in coronary sinus ostial atresia. Contrast echocardiography and coronary CT clarified anomalous drainage into the right atrium. The teaching point is to follow continuity across complementary images rather than infer termination from one view. This unusual dilated-vein case does not establish routine visibility of a normal small cardiac vein. These static surfaces supply no ultrasound window, Doppler measurement or registered scan.';
const start=before.indexOf("    id: 'small-cardiac-vein'");assert(start>0);const point=before.indexOf('    imaging: {\r\n',start)>=0?before.indexOf('    imaging: {\r\n',start):before.indexOf('    imaging: {\n',start);assert(point>start);
const newline=before.includes('\r\n')?'\r\n':'\n';
const entry=point+'    imaging: {'.length+newline.length;
const additions=`      xray: draft(${JSON.stringify(xray)}, 'smallCardiacVenographyCase'),${newline}      ultrasound: draft(${JSON.stringify(ultrasound)}, 'smallCardiacEchoCase'),${newline}`;
const withLessons=before.slice(0,entry)+additions+before.slice(entry);
const marker='export const coronaryVenousTeachingReferences = {'+newline;assert.equal(withLessons.split(marker).length,2);
const after=withLessons.replace(marker,marker+references.replaceAll('\n',newline));
const dest=root+'/atlas/'+file;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,after,{flag:'wx'});
const metadata={at:new Date().toISOString(),base,preparedBase:{path:path.dirname(base)+'/SOURCE_PREPARED.json',sha256:sha(read(path.dirname(base)+'/SOURCE_PREPARED.json'))},file,before:sha(Buffer.from(before)),after:sha(Buffer.from(after)),concept:'small-cardiac-vein',study:'coronary-venous',fmaIds:['FMA4714'],addedTopics:['xray','ultrasound'],references:['smallCardiacVenographyCase','smallCardiacEchoCase'],words:{xray:xray.split(/\s+/).length,ultrasound:ultrasound.split(/\s+/).length},copyType:'Original concise teaching summaries; primary case report evidence, not routine normal-visibility evidence.',clinicalApproval:false,sourceAssetsCopied:false,generated:false,installed:false};
fs.writeFileSync(root+'/CONTENT_PROPOSAL.json',JSON.stringify(metadata,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({topics:2,words:metadata.words,source:metadata.after}));
