import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-release20-reasoning-followup',base='G:/VisibleMedicine-temp/staging/20261031-release20-initial/website',file='tests/clinical-review-reasoning.test.ts';
const old=fs.readFileSync(base+'/'+file),sha=b=>createHash('sha256').update(b).digest('hex');let text=old.toString();
const replace=(from,to)=>{assert.equal(text.split(from).length,2);text=text.replace(from,to);};
replace('  let count=0;','  let count=0;\n  const addedKeys:string[]=[];');
replace('    count++;','');
replace("    const abdominal=key.startsWith('abdominal-vessel-');",`    const added=key.startsWith('cervical-vascular-')||key==='upper-vascular-axillary-vein';
    if(added)addedKeys.push(key+':'+row.laterality);else count++;
    const abdominal=key.startsWith('abdominal-vessel-');`);
replace("    assert.equal(packet.reasoning.choices.length,abdominal?(row.id.includes(':midline:')?2:4):3);","    assert.equal(packet.reasoning.choices.length,added?4:abdominal?(row.id.includes(':midline:')?2:4):3,key);");
replace('  assert.equal(count,8);',`  assert.equal(count,8,'All eight original thoracic/abdominal selections remain covered');
  assert.deepEqual(addedKeys.sort(),[
    ...['common-carotid-artery','internal-carotid-artery','vertebral-artery','internal-jugular-vein']
      .flatMap(slug=>['right','left'].map(side=>'cervical-vascular-'+slug+':'+side)),
    ...['right','left'].map(side=>'upper-vascular-axillary-vein:'+side),
  ].sort(),'Exactly ten later source-bound vessel selections also reach Review');`);
fs.mkdirSync(root+'/tests',{recursive:true});fs.writeFileSync(root+'/'+file,text,{flag:'wx'});fs.writeFileSync(root+'/MANIFEST.json',JSON.stringify({base,files:[{path:file,before:sha(old),after:sha(Buffer.from(text))}],historicalSelections:8,laterSelections:10,productChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposal:root,files:1}));
