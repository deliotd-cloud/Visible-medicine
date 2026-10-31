import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition8-ready';
const result=spawnSync(process.execPath,['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','build'],{cwd:root+'/website',stdio:'inherit',windowsHide:true,env:{...process.env,npm_config_cache:root+'/tmp/npm-cache'}});
fs.writeFileSync(root+'/BUILD_CHILD_4096.json',JSON.stringify({status:result.status,signal:result.signal,error:result.error?.message??null},null,2)+'\n',{flag:'wx'});if(result.error)throw result.error;if(result.signal)throw Error(result.signal);process.exitCode=result.status===0?0:1;
