import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','build'],{cwd:'G:/VisibleMedicine-temp/staging/20261030-head-comparison-followup/website',stdio:'inherit',windowsHide:true,env:process.env});
if(result.error)throw result.error;if(result.signal)throw Error('Build terminated: '+result.signal);process.exitCode=result.status===0?0:1;
