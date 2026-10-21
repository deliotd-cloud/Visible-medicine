// Small checkpoint pointer update; never edits source, restarts jobs or infers completion.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const [stage,sessionText,phase]=process.argv.slice(2),directChunk=sessionText?.startsWith('direct:')?sessionText.slice(7):null,session=directChunk?null:Number(sessionText);
assert(/^F:\/VisibleMedicine\/staging\/[A-Za-z0-9-]+$/.test(stage));assert(directChunk?/^[a-f0-9]{6,16}$/.test(directChunk):Number.isSafeInteger(session)&&session>0);assert(phase?.length>10);
const original=read('CURRENT_CHECKPOINT.json').toString(),pointer=JSON.parse(original),active=pointer.activeWork,started=json(stage+'/STARTED.json');
assert.equal(started.source,active.source);assert.equal(started.review,active.review);
const snapshot=stage+'/SOURCE_INPUTS_AFTER.json',rows=json(snapshot),plan=json(stage+'/PREPARATION.json');
const terminal=fs.existsSync(stage+'/APPLICATION.json'),application=terminal?json(stage+'/APPLICATION.json'):null;
if(directChunk)assert(terminal,'A direct completed exec chunk is not a running process handle');
if(application){assert.equal(application.source,active.source);assert.equal(application.review,active.review);assert.equal(application.sourceInputsUnchangedDuringRun,true);assert.equal(sha(read(application.native.log)),application.native.logSha256);assert.equal(application.controlledInputs,rows.length);}
else process.kill(started.driver,0);
const next={...active.inflight,terminal,canonicalInstalled:true,phase,latestApplication:terminal?stage+'/APPLICATION.json':null,latestSourceSnapshot:snapshot,latestSourceSnapshotSha256:sha(read(snapshot)),nativeResult:terminal?stage+'/native.json':null,nativeResultSha256:terminal?sha(read(stage+'/native.json')):null,nativeCounts:application?.native.counts??null,lastTerminalFocusedSession:terminal?session:active.inflight.lastTerminalFocusedSession,runningStage:terminal?null:stage,runningSession:terminal?null:session,runningDriver:terminal?null:started.driver,runningNativePid:null,heavyJobRunning:!terminal,controlledSourceInputs:rows.length,preservedSourceInputs:plan.preserved.length,totalNamedInputs:rows.length+plan.preserved.length,latestSelectedSourceOffDeviceBackupVerified:false};
if(directChunk)next.lastTerminalFocusedToolChunk=directChunk;
const line=value=>'    "inflight": '+JSON.stringify(value,null,2).replaceAll('\n','\n    ')+',';
const before=line(active.inflight),after=line(next);assert.equal(original.split(before).length,2,'Unique exact current pointer');
console.log(['*** Begin Patch','*** Update File: CURRENT_CHECKPOINT.json','@@',...before.split('\n').map(l=>'-'+l),...after.split('\n').map(l=>'+'+l),'*** End Patch'].join('\n'));
