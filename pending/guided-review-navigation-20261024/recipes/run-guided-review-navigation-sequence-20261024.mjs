import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const driver=fileURLToPath(new URL('./integrate-guided-review-navigation-20261024.mjs',import.meta.url));
for(const phase of ['prebuild','build','tests','verify']){const child=spawnSync(process.execPath,[driver,phase],{stdio:'inherit',windowsHide:true});if(child.status!==0){process.exitCode=1;break;}}
