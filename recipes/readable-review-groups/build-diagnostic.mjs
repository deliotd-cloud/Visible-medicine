import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const root='G:/VisibleMedicine-temp/staging/20261031-review-readable-groups';
const result=spawnSync(process.execPath,['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','--loglevel=verbose','run','build'],{cwd:root+'/website',stdio:'inherit',windowsHide:true,env:{...process.env,NODE_OPTIONS:process.env.NODE_OPTIONS+' --trace-uncaught --trace-exit',npm_config_cache:root+'/tmp/npm-cache'}});
const terminal={status:result.status,signal:result.signal,error:result.error?.message??null};
fs.writeFileSync(root+'/BUILD_CHILD-2.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({buildChild:terminal}));
if(result.error)throw result.error;
if(result.signal)throw Error('Build terminated: '+result.signal);
process.exitCode=result.status===0?0:1;
