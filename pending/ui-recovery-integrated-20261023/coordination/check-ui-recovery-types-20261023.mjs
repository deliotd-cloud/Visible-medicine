// Focused semantic check under the unchanged project options; not a full-project gate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const site=process.argv[2];assert.equal(site,'F:/VisibleMedicine/staging/20261023-ui-recovery-integrated/website');
const require=createRequire(site+'/package.json'),ts=require('typescript'),file=site+'/tsconfig.json';
const c=ts.readConfigFile(file,ts.sys.readFile);assert(!c.error);const parsed=ts.parseJsonConfigFileContent(c.config,ts.sys,site,undefined,file);assert.deepEqual(parsed.errors,[]);
const configuredAmbient=parsed.fileNames.filter(f=>/\.d\.(?:ts|mts|cts)$/.test(f));
const roots=[...new Set([...configuredAmbient,...['components/StudioForms.tsx','components/ClinicalReviewInbox.tsx','components/AtlasWorkspaceNavigation.tsx','lib/studio-session-drafts.ts'].map(f=>site+'/'+f)])];
const program=ts.createProgram(roots,{...parsed.options,noEmit:true,incremental:false});
const diagnostics=ts.getPreEmitDiagnostics(program),host={getCanonicalFileName:p=>p,getCurrentDirectory:()=>site,getNewLine:()=> '\n'};
const inputs=program.getSourceFiles().map(f=>({path:path.relative(site,f.fileName).replaceAll('\\','/'),sha256:createHash('sha256').update(fs.readFileSync(f.fileName)).digest('hex')}));
const report={at:new Date().toISOString(),roots:roots.map(p=>path.relative(site,p)),projectConfigSha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex'),allProjectOptionsPreservedExceptNoEmitAndNoIncremental:true,sourceFiles:inputs.length,inputs,diagnostics:diagnostics.map(d=>({file:d.file?.fileName,code:d.code,line:d.file&&d.start!==undefined?d.file.getLineAndCharacterOfPosition(d.start).line+1:undefined,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')})),fullProjectCheck:false};
fs.writeFileSync(path.dirname(site)+'/FOCUSED_TYPES_AMBIENT.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
if(diagnostics.length)process.stderr.write(ts.formatDiagnostics(diagnostics,host));
console.log(JSON.stringify({sourceFiles:inputs.length,diagnostics:diagnostics.length,fullProjectCheck:false}));process.exitCode=diagnostics.length?1:0;
