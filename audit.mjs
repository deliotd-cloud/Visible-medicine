import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

export function digest(file){const h=createHash('sha256'),buffer=Buffer.alloc(1024*1024),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null))>0)h.update(buffer.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
function safe(root,name){assert(typeof name==='string'&&!path.isAbsolute(name)&&!/[\\:\x00-\x1f]/.test(name)&&name.split('/').every(p=>p&&p!=='.'&&p!=='..'),'Unsafe artifact path');const p=path.resolve(root,name);assert(p.startsWith(path.resolve(root)+path.sep));assert(fs.lstatSync(p).isFile(),'Artifact must be a regular file');return p;}
const text=file=>fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));

/** Verify notice delivery for a built export; this does not establish upstream rights. */
export function auditModule({runtime,sourceCommit,packageRoots,fiberNotice}){
 const manifestPath=safe(runtime,'manifest.json'),manifest=json(manifestPath);assert.equal(manifest.sourceCommit,sourceCommit,'Unexpected source epoch');assert(Array.isArray(manifest.files)&&manifest.files.length>0);
 const paths=new Set();let bytes=0;
 for(const row of manifest.files){assert(!paths.has(row.path),'Duplicate manifest path');paths.add(row.path);assert(/^[a-f0-9]{64}$/.test(row.sha256),'Invalid file digest');const p=safe(runtime,row.path);assert.equal(fs.statSync(p).size,row.bytes,'Artifact size: '+row.path);assert.equal(digest(p),row.sha256,'Artifact hash: '+row.path);bytes+=row.bytes;}
 for(const name of ['BUNDLED_NOTICES.txt','bundled-dependencies.json','LICENSE','LICENSES/THIRD_PARTY_NOTICES.md'])assert(paths.has(name),'Required notice not bound in manifest: '+name);
 const discovered=[];
 function walk(directory,prefix=''){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const name=prefix+entry.name;assert(!entry.isSymbolicLink(),'Linked artifact needs explicit review: '+name);if(entry.isDirectory())walk(path.join(directory,entry.name),name+'/');else{assert(entry.isFile(),'Non-regular artifact: '+name);discovered.push(name);}}}
 walk(runtime);assert.deepEqual(discovered.sort(),[...paths,'manifest.json'].sort(),'Unlisted or missing artifact files');
 const noticePath=safe(runtime,'BUNDLED_NOTICES.txt'),notices=text(noticePath),packages=json(safe(runtime,'bundled-dependencies.json'));
 assert(Array.isArray(packages)&&packages.length>0,'Empty dependency inventory');const ids=new Set();const checked=[];
 for(const pkg of packages){
  assert(typeof pkg.name==='string'&&/^(@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(pkg.name),'Unsafe package name');assert(typeof pkg.version==='string'&&pkg.version.length>0);const id=pkg.name+'@'+pkg.version;assert(!ids.has(id),'Duplicate dependency');ids.add(id);
  const candidates=packageRoots.map(root=>path.join(root,'node_modules',pkg.name)).filter(dir=>fs.existsSync(path.join(dir,'package.json'))).map(dir=>({dir,pkg:json(path.join(dir,'package.json'))})).filter(x=>x.pkg.name===pkg.name&&x.pkg.version===pkg.version&&x.pkg.license===pkg.license);
  assert(candidates.length,'No exact local package/version/declaration witness: '+id);
  const witness=candidates[0],files=fs.readdirSync(witness.dir).filter(n=>/^(license|licence|notice|copying)([.-]|$)/i.test(n)).sort();
  let sources=files.map(n=>({path:path.join(witness.dir,n),kind:'installed-package'}));
  if(!sources.length&&pkg.name==='@react-three/fiber'&&pkg.version==='9.7.0'&&pkg.license==='MIT'&&fiberNotice)sources=[{path:fiberNotice,kind:'version-bound-project-fallback'}];
  assert(sources.length,'Missing exact package licence witness: '+id);
  assert(notices.includes(id+' ('+pkg.license+')'),'Missing package heading: '+id);
  const witnesses=sources.map(source=>{const body=text(source.path);assert(body.trim().length>100,'Empty or truncated licence witness: '+id);assert(notices.includes(body),'Incomplete delivered notice: '+id);return{kind:source.kind,bytes:fs.statSync(source.path).size,sha256:digest(source.path)};});
  checked.push({...pkg,packageJsonSha256:digest(path.join(witness.dir,'package.json')),witnesses});
 }
 return{schema:'vm.runtime-notice-delivery/1',runtime,sourceCommit,manifestSha256:digest(manifestPath),noticeSha256:digest(noticePath),files:paths.size,bytes,packages:checked,exactManifestBytes:true,noUnlistedFiles:true,completeLocalNoticeTextDelivered:true,upstreamRightsClearance:false,allWebsiteAssetsAudited:false,clinicalApproval:false};
}
