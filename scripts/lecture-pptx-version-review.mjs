// Private source-selection aid. No rendering, admission, approval or source mutation.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const shaPattern = /^[a-f0-9]{64}$/;
export function fileHash(file) {
  const h=createHash('sha256'),fd=fs.openSync(file,'r'),buffer=Buffer.alloc(65536);
  try { let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))h.update(buffer.subarray(0,n)); }
  finally { fs.closeSync(fd); }
  return h.digest('hex');
}
function requireValue(condition,message) { if(!condition)throw new Error(message); }
function canonical(value) {
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
  return value;
}
const fingerprint=value=>sha(canonical(value));
export function mediaEvidence(media) {
  requireValue(Array.isArray(media),'Media must be an array.');
  const hashes=media.map(m=>m?.targetMode==='Internal'&&typeof m.sha256==='string'&&shaPattern.test(m.sha256)?m.sha256:null);
  const unknown=hashes.filter(h=>h===null).length;
  return {occurrences:media.length,unknownOccurrences:unknown,
    metadataSha256:fingerprint(media.map(({sha256,...metadata})=>metadata)),
    orderedBytesSha256:unknown?null:sha(hashes),
    byteMultisetSha256:unknown?null:sha([...hashes].sort())};
}
export function compareMedia(left,right) {
  const a=mediaEvidence(left),b=mediaEvidence(right);
  const content=a.unknownOccurrences||b.unknownOccurrences?'unknown':
    a.byteMultisetSha256===b.byteMultisetSha256?'same-direct-byte-multiset':'different-direct-byte-multiset';
  return {left:a,right:b,content,metadataChanged:a.metadataSha256!==b.metadataSha256,
    orderChanged:content==='same-direct-byte-multiset'?a.orderedBytesSha256!==b.orderedBytesSha256:null,
    correspondence:'direct occurrences only; no visual or semantic alignment'};
}
const textBlocks=blocks=>blocks.flatMap(b=>b.paragraphs.map(p=>p.text));
const notesBlocks=blocks=>blocks.map(b=>({placeholder:b.placeholder??null,paragraphs:b.paragraphs.map(p=>p.text)}));
function sourceTextPreview(slide) {
  const line=textBlocks(slide.textBlocks).find(t=>t.trim())??'';
  return Array.from(line.replace(/\s+/g,' ').trim()).slice(0,180).join('');
}
function anchor(slide) {
  return {position:slide.position,part:slide.part,partSha256:slide.partSha256,sourceAnchor:slide.anchor,sourceTextPreview:sourceTextPreview(slide)};
}
function validateIntake(intake,sourceSha256) {
  requireValue(typeof sourceSha256==='string'&&shaPattern.test(sourceSha256),'Invalid source deck hash.');
  requireValue(intake?.state==='quarantined'&&intake.readyForPublication===false,'Expected a quarantined, unpublished intake.');
  requireValue(intake.source?.sha256===sourceSha256,'Source deck hash does not match intake.');
  requireValue(Array.isArray(intake.slides)&&Array.isArray(intake.parts),'Invalid intake inventory.');
  const parts=new Map();
  for(const p of intake.parts){requireValue(typeof p.part==='string'&&shaPattern.test(p.sha256),'Invalid part hash.');requireValue(!parts.has(p.part),'Duplicate part.');parts.set(p.part,p.sha256);}
  for(const [i,s]of intake.slides.entries()){
    requireValue(s.position===i+1&&typeof s.part==='string'&&parts.get(s.part)===s.partSha256,'Slide position/part hash does not match source inventory.');
    requireValue(s.anchor===sourceSha256+':'+s.part,'Slide anchor is not bound to the source deck.');
    for(const key of ['textBlocks','notesBlocks','media','tables','notesParts'])requireValue(Array.isArray(s[key]),'Invalid slide '+key+'.');
    for(const block of [...s.textBlocks,...s.notesBlocks])requireValue(Array.isArray(block.paragraphs)&&block.paragraphs.every(p=>typeof p.text==='string'),'Invalid paragraph text.');
    for(const media of s.media){requireValue(media&&typeof media==='object'&&!Array.isArray(media),'Invalid media record.');
      if(media.sha256!=null)requireValue(shaPattern.test(media.sha256),'Invalid media hash.');
      if(media.targetMode==='Internal'&&media.sha256!=null)requireValue(parts.get(media.part)===media.sha256,'Media hash does not match source part inventory.');
    }
  }
}
export function compareIntakes(left,right) {
  validateIntake(left,left.source?.sha256);validateIntake(right,right.source?.sha256);
  const positions=[];
  for(let i=0;i<Math.max(left.slides.length,right.slides.length);i++){
    const a=left.slides[i],b=right.slides[i];
    if(!a||!b){positions.push({position:i+1,left:a?anchor(a):null,right:b?anchor(b):null,comparison:'unmatched-position',semanticAdditionOrDeletionProven:false});continue;}
    positions.push({position:i+1,left:anchor(a),right:anchor(b),comparison:'source-position-only',
      textChanged:fingerprint(textBlocks(a.textBlocks))!==fingerprint(textBlocks(b.textBlocks)),
      notesChanged:fingerprint(notesBlocks(a.notesBlocks))!==fingerprint(notesBlocks(b.notesBlocks)),
      slideXmlChanged:a.partSha256!==b.partSha256,media:compareMedia(a.media,b.media)});
  }
  const aParts=new Map(left.parts.map(p=>[p.part,p.sha256])),bParts=new Map(right.parts.map(p=>[p.part,p.sha256]));
  const changedSharedParts=[...new Set([...aParts.keys(),...bParts.keys()])].sort()
    .filter(p=>/^ppt\/(?:slideLayouts|slideMasters|notesMasters|theme)\//.test(p)&&aParts.get(p)!==bParts.get(p))
    .map(part=>({part,leftSha256:aParts.get(part)??null,rightSha256:bParts.get(part)??null}));
  return {schema:'vm-private-pptx-version-review-v1',sourceByteIdentical:left.source.sha256===right.source.sha256,
    alignment:'sequence position only; insertion, reordering and duplication may affect many comparisons',
    counts:{positions:positions.length,unmatchedPositions:positions.filter(p=>!p.media).length,
      textChanged:positions.filter(p=>p.textChanged).length,notesChanged:positions.filter(p=>p.notesChanged).length,
      directBytesDiffer:positions.filter(p=>p.media?.content==='different-direct-byte-multiset').length,
      directBytesUnknown:positions.filter(p=>p.media?.content==='unknown').length,
      metadataOnly:positions.filter(p=>p.media?.metadataChanged&&p.media?.content==='same-direct-byte-multiset'&&!p.media.orderChanged).length,
      directOrderChanged:positions.filter(p=>p.media?.orderChanged).length,changedSharedParts:changedSharedParts.length},
    positions,changedSharedParts,
    limits:['Byte equality covers only directly referenced media; it is not equal rendered appearance.',
      'Different media-byte multisets do not establish which image was replaced; multiplicity and source position can differ.',
      'Unknown hashes never count as equal bytes. Empty direct media does not prove no inherited or external media.',
      'Metadata-only means the direct byte multiset and order match; it does not mean no visual or clinical change.',
      'Text previews come from the first nonempty extracted paragraph, not a validated slide title.',
      'Shared layout/theme/master changes, crops, transforms, animations and inherited content need visual review.',
      'The comparison relies on the supplied intake receipt; source and intake identities are checked, without re-extracting the deck.',
      'No source version, rights, privacy, fidelity or clinical approval is selected or inferred.'],
    readyForPublication:false,sourceSelected:false,websiteImported:false,clinicalApproval:false};
}
export function loadBoundIntake(deckFile,intakeFile,expectedIntakeSha256) {
  requireValue(typeof expectedIntakeSha256==='string'&&shaPattern.test(expectedIntakeSha256),'A SHA-256 from the independently verified intake receipt is required.');
  requireValue(fs.statSync(intakeFile).size<=64*1024*1024,'Intake exceeds 64 MiB limit.');
  const intakeSha256=fileHash(intakeFile);requireValue(intakeSha256===expectedIntakeSha256,'Intake no longer matches its verified receipt.');
  const sourceSha256=fileHash(deckFile),intake=JSON.parse(fs.readFileSync(intakeFile,'utf8'));
  validateIntake(intake,sourceSha256);
  return {intake,source:{path:path.resolve(deckFile),sha256:sourceSha256},receipt:{path:path.resolve(intakeFile),sha256:intakeSha256}};
}
const escapeMd=value=>String(value).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/([\\`*_{}\[\]()#+.!|>~<])/g,'\\$1');
export function renderComparison(result) {
  const lines=['# Private lecture source comparison','','This is a source-selection aid. No version is selected, approved or imported.','',
    '| Position | Left source text preview | Right source text preview | Changes to inspect |','| ---: | --- | --- | --- |'];
  for(const p of result.positions){
    const flags=p.media?[p.textChanged?'text':null,p.notesChanged?'notes':null,p.media.content==='different-direct-byte-multiset'?'direct media bytes differ':null,
      p.media.content==='unknown'?'direct media bytes unknown':null,p.media.metadataChanged?'media metadata':null,p.media.orderChanged?'media order':null,p.slideXmlChanged?'slide XML':null].filter(Boolean):['unmatched position'];
    if(flags.length)lines.push(`| ${p.position} | ${escapeMd(p.left?.sourceTextPreview??'—')} | ${escapeMd(p.right?.sourceTextPreview??'—')} | ${flags.join(', ')} |`);
  }
  lines.push('','## Shared presentation parts',...result.changedSharedParts.map(p=>'- '+escapeMd(p.part)),
    '', '## Limits',...result.limits.map(t=>'- '+t));return lines.join('\n')+'\n';
}
export function writePrivateComparison({leftDeck,leftIntake,leftIntakeSha256,rightDeck,rightIntake,rightIntakeSha256,output}) {
  const project=path.resolve(fileURLToPath(new URL('../',import.meta.url))),destination=path.resolve(output);
  const nearestExisting=p=>fs.existsSync(p)?fs.realpathSync(p):path.join(nearestExisting(path.dirname(p)),path.basename(p));
  const resolvedDestination=nearestExisting(destination),resolvedProject=fs.realpathSync(project);
  requireValue(resolvedDestination!==resolvedProject&&!resolvedDestination.startsWith(resolvedProject+path.sep),'Private comparison output must be outside the website source tree.');
  requireValue(!fs.existsSync(destination),'Output directory already exists; choose a new private directory.');
  const a=loadBoundIntake(leftDeck,leftIntake,leftIntakeSha256),b=loadBoundIntake(rightDeck,rightIntake,rightIntakeSha256),result=compareIntakes(a.intake,b.intake);
  result.inputs={left:{source:a.source,intake:a.receipt},right:{source:b.source,intake:b.receipt}};
  for(const row of [a.source,a.receipt,b.source,b.receipt])requireValue(fileHash(row.path)===row.sha256,'Input changed during comparison.');
  fs.mkdirSync(destination,{recursive:true});fs.writeFileSync(path.join(destination,'COMPARISON.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  fs.writeFileSync(path.join(destination,'REVIEW.md'),renderComparison(result),{flag:'wx'});
  return {output:destination,counts:result.counts,sourceSelected:false,readyForPublication:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const values=process.argv.slice(2);requireValue(values.length===7,'Usage: node scripts/lecture-pptx-version-review.mjs LEFT_DECK LEFT_INTAKE LEFT_INTAKE_SHA256 RIGHT_DECK RIGHT_INTAKE RIGHT_INTAKE_SHA256 PRIVATE_OUTPUT_DIRECTORY');
  console.log(JSON.stringify(writePrivateComparison({leftDeck:values[0],leftIntake:values[1],leftIntakeSha256:values[2],rightDeck:values[3],rightIntake:values[4],rightIntakeSha256:values[5],output:values[6]})));
}
