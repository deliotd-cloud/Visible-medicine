// Browser-compatible draft export, never an approval/import API.
function check(condition,message='Invalid source opinion'){if(!condition)throw Error(message);}
export function opticReviewDraft(scene,side,proposedChoice,notes=''){
 check(scene.purpose==='source-only-optic-alternative-review'&&scene.admissions===0&&scene.clinicalValidation===false&&scene.sourceGeometryChanged===false);
 check(/^[a-f0-9]{64}$/.test(scene.reportSha256)&&['left','right'].includes(side));
 const pair=scene.pairs.find(p=>p.side===side);check(pair&&pair.files.length===2);
 const exact={right:['FMA50875','FJ1364','FJ1819'],left:['FMA50878','FJ1313','FJ1772']}[side];
 check(pair.id===exact[0]&&pair.files[0]===exact[1]&&pair.files[1]===exact[2],'Wrong-side candidate pair');
 check(['retain-hold',...pair.files,'compare-both'].includes(proposedChoice),'Foreign candidate choice');
 check(typeof notes==='string'&&notes.length<=4000,'Notes too long');
 const candidates=scene.meshes.filter(m=>m.role==='candidate'&&m.side===side);
 check(candidates.length===2&&candidates.every(m=>m.id===pair.id&&m.held===true&&m.tree==='isa'&&m.sources.length===1&&pair.files.includes(m.sources[0].file)));
 check(new Set(candidates.map(m=>m.sources[0].file)).size===2,'Duplicate candidate');
 const sources=candidates.map(m=>({tree:m.tree,file:m.sources[0].file,sha256:m.sources[0].sha256})).sort((a,b)=>a.file.localeCompare(b.file));
 for(const source of sources)check(/^[a-f0-9]{64}$/.test(source.sha256));
 return {schemaVersion:1,purpose:'optic-alternative-review-opinion-draft',reportSha256:scene.reportSha256,
  evidence:scene.evidence,side,id:pair.id,sources,proposedChoice,notes,holdRetained:true,
  clinicalApproval:false,admissions:0,patientRegistration:false,license:scene.license,credit:scene.credit};
}
