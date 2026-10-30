import fs from 'node:fs';import {spawn} from 'node:child_process';
const root='G:/VisibleMedicine-temp/staging/20261030-native-runtime-integration';
for(const phase of ['inventory','lecture','coverage','review','pin']){
 const child=spawn(process.execPath,['--max-old-space-size=128',root+'/run-phase.mjs',phase],{cwd:process.cwd(),env:process.env,windowsHide:true,stdio:'inherit'});
 const result=await new Promise(resolve=>{child.once('error',e=>resolve({error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 fs.writeFileSync(root+'/'+phase+'-outer-terminal.json',JSON.stringify({at:new Date().toISOString(),phase,...result},null,2)+'\n',{flag:'wx'});
 if(result.code!==0||result.signal||result.error){process.exitCode=1;break;}
}
