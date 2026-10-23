import fs from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261023-cranial-xray-epoch',prep=json(stage+'/PREPARATION.json'),dir=stage+'/checks/types';
if(!process.argv.includes('--child')){
  assert(!fs.existsSync(dir));fs.mkdirSync(dir);
  const args=['--max-old-space-size=384',new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'),'--child'];
  const out=fs.openSync(dir+'/stdout.log','wx'),err=fs.openSync(dir+'/stderr.log','wx');
  fs.writeFileSync(dir+'/STARTED.json',JSON.stringify({at:new Date().toISOString(),args,cwd:prep.website,scope:'Three affected TypeScript test/utility roots plus all original configured ambient declarations; not full-project types',previewChanged:false},null,2)+'\n',{flag:'wx'});
  const result=spawnSync(process.execPath,args,{cwd:prep.website,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384'},stdio:['ignore',out,err],windowsHide:true});fs.closeSync(out);fs.closeSync(err);
  const stdout=read(dir+'/stdout.log'),stderr=read(dir+'/stderr.log');
  const t={at:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?String(result.error):null,stdoutSha256:sha(stdout),stderrSha256:sha(stderr),resourceFailure:/heap out of memory|Reached heap limit/i.test(stdout+'\n'+stderr),fullProjectTypes:false};
  fs.writeFileSync(dir+'/TERMINAL.json',JSON.stringify(t,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(t));process.exitCode=result.status===0?0:1;
}else{
  const require=createRequire(prep.website+'/package.json'),ts=require('typescript');
  const config=prep.parentWebsite+'/tsconfig.json',loaded=ts.readConfigFile(config,ts.sys.readFile);assert(!loaded.error);
  const parsed=ts.parseJsonConfigFileContent(loaded.config,ts.sys,prep.parentWebsite);assert.equal(parsed.errors.length,0);
  const roots=['tests/atlas-emitted-teaching.ts','tests/atlas-emitted-teaching-search.test.ts','tests/clinical-review-intracranial-arterial-xray.test.ts'].map(p=>prep.website+'/'+p);
  const ambient=parsed.fileNames.filter(p=>p.endsWith('.d.ts'));
  const options={...parsed.options,noEmit:true,incremental:false,composite:false,tsBuildInfoFile:undefined};
  const program=ts.createProgram([...roots,...ambient],options),diagnostics=ts.getPreEmitDiagnostics(program);
  const sourceFiles=program.getSourceFiles().map(f=>({path:f.fileName,sha256:sha(read(f.fileName))}));
  const result={at:new Date().toISOString(),roots,ambient,config,configSha256:sha(read(config)),diagnosticCount:diagnostics.length,diagnostics:diagnostics.map(d=>({code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,'\n'),path:d.file?.fileName,start:d.start})),sourceFiles,fullProjectTypes:false};
  fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({roots:roots.length,ambient:ambient.length,sourceFiles:sourceFiles.length,diagnostics:diagnostics.length}));process.exitCode=diagnostics.length?1:0;
}
