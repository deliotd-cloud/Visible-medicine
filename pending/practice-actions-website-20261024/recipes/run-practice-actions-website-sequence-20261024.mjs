import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const driver=fileURLToPath(new URL('./integrate-practice-actions-website-20261024.mjs',import.meta.url));
const sequences={modules:['shoulder','regional','lower','pelvis','exportShoulder','exportRegional','exportLower','exportPelvis','inventory','lecture','coverage'],final:['coverageCheck','bind','viewer','capture','prebuild','build','tests','verify']};
const phases=sequences[process.argv[2]];
if(!phases)throw Error('Select modules or final');
for(const phase of phases){const child=spawnSync(process.execPath,[driver,phase],{stdio:'inherit',windowsHide:true});if(child.status!==0){process.exitCode=1;break;}}
