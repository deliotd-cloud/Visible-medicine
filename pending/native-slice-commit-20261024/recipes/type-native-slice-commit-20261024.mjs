// Strict compile against the actual parent dependency graph, substituting just
// the proposal's exact viewer bytes at its canonical import location.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-native-slice-commit',site=stage+'/website',prep=json(stage+'/PREPARATION.json'),parent=prep.parentWebsite;
const phase=process.argv[2]??'types';assert(['types','types-v2'].includes(phase));const output=stage+'/checks/'+phase;assert(!fs.existsSync(output));fs.mkdirSync(output,{recursive:true});
const ts=createRequire(site+'/package.json')('typescript'),config=parent+'/tsconfig.json',loaded=ts.readConfigFile(config,ts.sys.readFile);assert(!loaded.error);
const parsed=ts.parseJsonConfigFileContent(loaded.config,ts.sys,parent);assert.equal(parsed.errors.length,0);assert(parsed.options.strict);
const root=parent+'/components/HeadAtlasViewer.tsx',actual=site+'/components/HeadAtlasViewer.tsx',content=fs.readFileSync(actual,'utf8'),actualSha=hash(actual),originalSha=hash(root);
assert.equal(originalSha,prep.sourceSha256);
const ambient=parsed.fileNames.filter(p=>p.endsWith('.d.ts'));assert.equal(ambient.length,6);
const overrides={noEmit:true,incremental:false,composite:false,tsBuildInfoFile:undefined},options={...parsed.options,...overrides},host=ts.createCompilerHost(options),original=host.getSourceFile;
host.getSourceFile=(fileName,...args)=>fileName.replaceAll('\\','/')===root?ts.createSourceFile(fileName,content,args[0],true,ts.ScriptKind.TSX):original(fileName,...args);
const program=ts.createProgram([root,...ambient],options,host),diagnostics=ts.getPreEmitDiagnostics(program);
const sourceFiles=program.getSourceFiles().map(f=>({compilerPath:f.fileName,path:f.fileName.replaceAll('\\','/')===root?actual:f.fileName,sha256:hash(f.fileName.replaceAll('\\','/')===root?actual:f.fileName)}));
assert(sourceFiles.some(r=>r.path===actual));assert.equal(hash(actual),actualSha);assert.equal(hash(root),originalSha);
const result={at:new Date().toISOString(),cwd:process.cwd(),config,configSha256:hash(config),typescriptVersion:ts.version,roots:[root],ambient,configuredCompilerOptions:parsed.options,overrides,sourceOverlay:[{compilerPath:root,path:actual,sha256:actualSha,parentSha256:originalSha}],sourceFiles,diagnosticCount:diagnostics.length,diagnostics:diagnostics.map(d=>({code:d.code,path:d.file?.fileName,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')})),fullProjectTypesPassed:false,productionBuildRun:false,previewChanged:false};
fs.writeFileSync(output+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({roots:1,ambient:ambient.length,actualGraphFiles:sourceFiles.length,sourceOverlays:1,diagnostics:diagnostics.length}));if(diagnostics.length)process.exitCode=1;
