/** Separate unitless reference objects: never a learner model inventory or an approval. */
export type PrivateReferenceFile={path:string;sha256:string;bytes:number;contentType:'application/json'|'model/gltf-binary'};
export type PrivateReference={
 id:string;revision:string;atlasRevision:string;sourceCommit:string;
 sourceFrame:'unitless-normalized-source-assembly';deployment:'local-only';clinicalApproval:false;
 files:PrivateReferenceFile[];
};
export type PrivateReferenceRegistry={schema:'visible-medicine.private-reference-assets/1';references:PrivateReference[]};
const hex64=/^[a-f0-9]{64}$/,hex40=/^[a-f0-9]{40}$/,token=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export function privateReferenceObjectKey(file:Pick<PrivateReferenceFile,'sha256'>):string{
 if(!hex64.test(file.sha256))throw new Error('Invalid private reference checksum');
 return 'atlas-review-references/v1/'+file.sha256;
}
export function validatePrivateReferenceRegistry(value:unknown):PrivateReferenceRegistry{
 if(!object(value)||!exact(value,['schema','references'])||value.schema!=='visible-medicine.private-reference-assets/1'||!Array.isArray(value.references)||value.references.length>16)throw new Error('Invalid private reference registry');
 const identities=new Set<string>();
 for(const r of value.references){
  if(!object(r)||!exact(r,['id','revision','atlasRevision','sourceCommit','sourceFrame','deployment','clinicalApproval','files'])||typeof r.id!=='string'||r.id.length>100||!token.test(r.id)||typeof r.revision!=='string'||!hex64.test(r.revision)||typeof r.atlasRevision!=='string'||!hex40.test(r.atlasRevision)||typeof r.sourceCommit!=='string'||!hex40.test(r.sourceCommit)||r.sourceFrame!=='unitless-normalized-source-assembly'||r.deployment!=='local-only'||r.clinicalApproval!==false||!Array.isArray(r.files)||r.files.length!==2)throw new Error('Invalid private reference identity');
  const identity=r.id+'/'+r.revision;if(identities.has(identity))throw new Error('Repeated private reference identity');identities.add(identity);
  const paths=new Set<string>();
  for(const f of r.files){
   if(!object(f)||!exact(f,['path','sha256','bytes','contentType'])||typeof f.path!=='string'||!/^models\/[a-z0-9]+(?:-[a-z0-9]+)*\/(?:reference\.glb|catalog\.json)$/.test(f.path)||typeof f.sha256!=='string'||!hex64.test(f.sha256)||!Number.isSafeInteger(f.bytes)||(f.bytes as number)<1||(f.bytes as number)>(f.path.endsWith('.glb')?32*1024*1024:256*1024)||f.contentType!==(f.path.endsWith('.glb')?'model/gltf-binary':'application/json')||paths.has(f.path))throw new Error('Invalid private reference file');
   paths.add(f.path);
  }
  const [a,b]=r.files as PrivateReferenceFile[];
  if(a.path.slice(0,a.path.lastIndexOf('/'))!==b.path.slice(0,b.path.lastIndexOf('/'))||!r.files.some(f=>f.path.endsWith('/reference.glb'))||!r.files.some(f=>f.path.endsWith('/catalog.json'))||r.files.find(f=>f.path.endsWith('/catalog.json'))?.sha256!==r.revision)throw new Error('Private reference assembly is not exact');
 }
 return structuredClone(value) as PrivateReferenceRegistry;
}
export function privateReferenceBase(reference:Pick<PrivateReference,'id'|'revision'>):string{
 if(!token.test(reference.id)||reference.id.length>100||!hex64.test(reference.revision))throw new Error('Invalid private reference identity');
 return '/api/atlas-delivery/references/'+reference.id+'/'+reference.revision;
}
/** The Worker and Vite guard permit only registered canonical URLs; no raw/public alias. */
export function privateReferencePaths(registry:unknown):string[]{
 return validatePrivateReferenceRegistry(registry).references.flatMap(r=>r.files.map(f=>privateReferenceBase(r)+'/'+f.path));
}
export function resolvePrivateReferenceAsset(url:URL,registry:unknown):{reference:PrivateReference;file:PrivateReferenceFile}|null{
 if(url.search||url.hash||/%|\\/.test(url.pathname))return null;
 const parsed=validatePrivateReferenceRegistry(registry);
 for(const reference of parsed.references)for(const file of reference.files)if(url.pathname===privateReferenceBase(reference)+'/'+file.path)return {reference,file};
 return null;
}
