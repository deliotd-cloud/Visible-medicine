const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
const sourceIdentityFields=['version','url','metadataUrl','crosswalkUrl','sha256','bytes','metadataSha256','crosswalkSha256','credit','license','licenseUrl'];
const ureterSourceNames=['VH_F_right_ureter','VH_F_left_ureter'];

export function assertHraPelvisSourceContract(specimen,pelvis,renal){
  const fail=()=>{throw Error('Changed independent source, frame or licence: hra-united-female-v1.10-pelvis');};
  if(!specimen||pelvis.specimenId!=='hra-united-female-v1.10-pelvis'
    ||renal.specimenId!=='hra-united-female-v1.10-kidneys'
    ||pelvis.source?.key!==pelvis.specimenId||renal.source?.key!==renal.specimenId
    ||specimen.key!==pelvis.specimenId||specimen.license!=='CC BY 4.0'
    ||pelvis.source?.license!=='CC BY 4.0'||renal.source?.license!=='CC BY 4.0')fail();
  for(const field of sourceIdentityFields)if(pelvis.source[field]==null||pelvis.source[field]===''||!same(pelvis.source[field],renal.source[field]))fail();
  if(pelvis.source.version!=='v1.10'||pelvis.structures.length!==41
    ||pelvis.sourceFrame!=='hra-united-female-v1.10:lps-mm')fail();
  if(pelvis.sourceFrame!==renal.sourceFrame
    ||!same(pelvis.displayTransformColumnMajor,renal.displayTransformColumnMajor))fail();
  const ureters=renal.structures.filter(surface=>ureterSourceNames.includes(surface.sourceName));
  if(ureters.length!==2||new Set(ureters.map(surface=>surface.id)).size!==2
    ||!same(ureters.map(surface=>surface.sourceName),ureterSourceNames))fail();
  const expectedFrame={sourceToSceneColumnMajor:pelvis.displayTransformColumnMajor,unitsPerMillimetre:0.01};
  const expectedIds=[...pelvis.structures.map(surface=>surface.id),...ureters.map(surface=>surface.id)];
  if(new Set(expectedIds).size!==43)fail();
  const expectedBundles=[...pelvis.bundles,...renal.bundles];
  if(!same(specimen.sourceFrame,expectedFrame)||!same(specimen.surfaceIds,expectedIds)
    ||!same(specimen.bundles,expectedBundles))fail();
}
