// Local evidence only. Model source, extracted notes and inventory stay on F:.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {inspectPinnedShoulder} from 'file:///F:/VisibleMedicine/staging/20261023-fda-shoulder-ingestion/atlas/scripts/inspect-abaqus-shoulder-source.mjs';
const root='F:/VisibleMedicine/staging/20261023-fda-shoulder-source';
const stage='F:/VisibleMedicine/staging/20261023-fda-shoulder-ingestion';
const source=JSON.parse(fs.readFileSync(root+'/ACQUIRED.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const r of source.files)assert.equal(hash(fs.readFileSync(root+'/'+r.name)),r.sha256);
const python='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const text=execFileSync(python,['-X','utf8','-c',"from zipfile import ZipFile; import xml.etree.ElementTree as E; import sys; z=ZipFile(sys.argv[1]); r=E.fromstring(z.read('word/document.xml')); ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}; print('\\n'.join(''.join(t.itertext()) for t in r.findall('.//w:t',ns)))",root+'/Human Shoulder Finite Element Model ReadMe.docx'],{windowsHide:true});
fs.writeFileSync(stage+'/PUBLISHER_NOTES.txt',text,{flag:'wx'});
const result=inspectPinnedShoulder(fs.readFileSync(root+'/Male-Shoulder.inp'));
fs.writeFileSync(stage+'/SOURCE_INVENTORY.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({parts:result.parts,instances:result.instances,assemblyElementTypes:result.assemblyElementTypes,status:result.status}));
