import fs from 'node:fs';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-release20-reasoning';
const manifest=JSON.parse(fs.readFileSync(root+'/MANIFEST.json'));
const file='tests/reasoning-current-source-epoch.test.mjs';
manifest.files.push({path:file,before:null,after:createHash('sha256').update(fs.readFileSync(root+'/'+file)).digest('hex')});
fs.renameSync(root+'/MANIFEST.json',root+'/MANIFEST_INITIAL.json');
fs.writeFileSync(root+'/MANIFEST.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:manifest.files.length,manifest:root+'/MANIFEST.json'}));
