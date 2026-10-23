// Reusable create-only semantic check with the parent's actual configuration.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const argv=process.argv.slice(2),child=argv.includes('--child'),[stage,...relativeRoots]=argv.filter(a=>a!=='--child');
assert(stage?.startsWith('F:/VisibleMedicine/staging/')&&!stage.includes('..'));
assert(relativeRoots.length&&relativeRoots.every(p=>p.startsWith('tests/')&&!p.includes('..')&&!p.includes('\\')));
const prep=json(stage+'/PREPARATION.json'),dir=stage+'/checks/types';
assert.equal(sha(read(prep.parentReceipt)),prep.parentReceiptSha256);
if(!child){
 assert(!fs.existsSync(dir));fs.mkdirSync(dir);
 const args=['--max-old-space-size=384',fileURLToPath(import.meta.url),stage,...relativeRoots,'--child'];
 fs.writeFileSync(dir+'/STARTED.json',JSON.stringify({at:new Date().toISOString(),args,scope:'Affected roots with all existing configured ambient declarations; not full-project types',previewChanged:false},null,2)+'\n',{flag:'wx'});
 const out=fs.openSync(dir+'/stdout.log','wx'),err=fs.openSync(dir+'/stderr.log','wx');
 const r=spawnSync(process.execPath,args,{cwd:prep.website,windowsHide:true,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384'},stdio:['ignore',out,err]});fs.closeSync(out);fs.closeSync(err);
 const stdout=read(dir+'/stdout.log'),stderr=read(dir+'/stderr.log');
 const t={at:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,stdoutSha256:sha(stdout),stderrSha256:sha(stderr),resourceFailure:/heap out of memory|Reached heap limit/i.test(stdout+'\n'+stderr),fullProjectTypes:false};
 fs.writeFileSync(dir+'/TERMINAL.json',JSON.stringify(t,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(t));process.exitCode=r.status===0?0:1;
}else{
 const require=createRequire(prep.website+'/package.json'),ts=require('typescript');
 const config=prep.parentWebsite+'/tsconfig.json',loaded=ts.readConfigFile(config,ts.sys.readFile);assert(!loaded.error);
 const parsed=ts.parseJsonConfigFileContent(loaded.config,ts.sys,prep.parentWebsite);assert.equal(parsed.errors.length,0);
 const roots=relativeRoots.map(p=>prep.website+'/'+p),ambient=parsed.fileNames.filter(p=>p.endsWith('.d.ts'));
 const program=ts.createProgram([...roots,...ambient],{...parsed.options,noEmit:true,incremental:false,composite:false,tsBuildInfoFile:undefined});
 const diagnostics=ts.getPreEmitDiagnostics(program),sourceFiles=program.getSourceFiles().map(f=>({path:f.fileName,sha256:sha(read(f.fileName))}));
 const result={at:new Date().toISOString(),roots,ambient,config,configSha256:sha(read(config)),diagnosticCount:diagnostics.length,diagnostics:diagnostics.map(d=>({code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,'\n'),path:d.file?.fileName,start:d.start})),sourceFiles,fullProjectTypes:false};
 fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({roots:roots.length,ambient:ambient.length,files:sourceFiles.length,diagnostics:diagnostics.length}));process.exitCode=diagnostics.length?1:0;
}
