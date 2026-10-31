import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const baseline='G:/VisibleMedicine-temp/staging/20261031-release21-final/website',root='G:/VisibleMedicine-temp/proposals/20261031-release22-small-guards',sha=b=>createHash('sha256').update(b).digest('hex'),files=[];
function save(relative,before,after){const dest=root+'/files/'+relative;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,after,{flag:'wx'});files.push({path:relative,beforeSha256:sha(before),afterSha256:sha(after)});}
const inboxPath='tests/clinical-review-inbox-ui.test.mjs',inbox=fs.readFileSync(baseline+'/'+inboxPath,'utf8');assert.equal(sha(inbox),'988a290441051577b63f9ffa8694a8b1d3e15d429ed19cfd18853424bc97fada');
const section=(a,b)=>{const start=inbox.indexOf(a),end=inbox.indexOf(b,start);assert(start>=0&&end>start);return inbox.slice(start,end);};
const seams=[
 ['cleanup = () => { for (const slot of slots) slot?.dispose?.(); };','cleanup = dispose;'],
 ["format: 'cjs', jsx: 'automatic', packages: 'external'","format: 'cjs', packages: 'external'"],
 [section('const quickProps = () => {','const button = name =>'),''],
 ["  for (const link of links) assert.equal(link.props['aria-label'], `${words(link).replace(/ ↗$/, '')} (opens in a new tab)`, 'each destination retains its visible label and announces the new tab');\n",''],
 ["  assert(links.every(link => link.props.target === '_blank' && link.props.rel === 'noopener noreferrer'));\r\n","  assert(links.every(link => link.props.target === '_blank' && link.props.rel === 'noopener noreferrer'));\n"],
 [section("test('Quick review receives the same matching rows", "test('inbox area links remain available"),''],
];
let historic=inbox;for(const[a,b]of seams){assert.equal(historic.split(a).length,2);historic=historic.replace(a,b);}const expected=fs.readFileSync('G:/VisibleMedicine-temp/proposals/20261031-release23-main/INBOX_AT_LOCAL_REFERENCE.mjs.raw','utf8');if(historic!==expected){let at=0;while(historic[at]===expected[at]&&at<historic.length)at++;console.log(JSON.stringify({at,actual:historic.slice(at-80,at+120),expected:expected.slice(at-80,at+120)}));}assert.equal(sha(historic),sha(expected));
const relative='tests/local-reference-entry-transition.test.mjs',before=fs.readFileSync(baseline+'/'+relative);let next=before.toString();
const helper=`\n// Authenticate later quick-review harness additions before checking the unchanged local-reference epoch.\nfunction restoreInboxSuccessor(bytes){\n assert.equal(sha(bytes),'988a290441051577b63f9ffa8694a8b1d3e15d429ed19cfd18853424bc97fada','Exact current complete inbox harness');\n let source=bytes.toString();\n for(const [after,before] of ${JSON.stringify(seams,null,2)}){assert.equal(source.split(after).length,2,'One admitted successor seam');source=source.replace(after,before);}\n assert.equal(sha(source),'${sha(historic)}','Exact complete local-reference admission harness');\n return source;\n}\n`;
const marker="test('every original inbox UI assertion";assert.equal(next.split(marker).length,2);next=next.replace(marker,helper+marker);
const raw="read('tests/clinical-review-inbox-ui.test.mjs').toString()";assert.equal(next.split(raw).length,3);next=next.replace(raw,"restoreInboxSuccessor(read('tests/clinical-review-inbox-ui.test.mjs'))").replace(raw,'current');
next+=`\ntest('foreign edits and removed assertions cannot enter the inbox successor layer',()=>{const bytes=read('${inboxPath}');for(const changed of [Buffer.concat([bytes,Buffer.from('/* foreign */')]),Buffer.from(bytes.toString().replace('assert.equal(','void('))]){assert.notDeepEqual(changed,bytes);assert.throws(()=>restoreInboxSuccessor(changed));}});\n`;
save(relative,before,next);
const adjacent='tests/release-diagnostic-adjacent-current.test.mjs',beforeAdjacent=fs.readFileSync(baseline+'/'+adjacent);let afterAdjacent=beforeAdjacent.toString();
const original=" for(const name of names){const path='tests/'+name,bytes=readFileSync(new URL('./'+name,import.meta.url));for(const changed of [Buffer.concat([bytes,Buffer.from('/* foreign */')]),Buffer.from(bytes.toString().replace('assert.equal(','void('))]){assert.notDeepEqual(changed,bytes);assert.throws(()=>diagnosticContextInput(path,changed));assert.throws(()=>restoreReleaseDiagnosticContext(path,changed));}}";
assert.equal(afterAdjacent.split(original).length,2);
afterAdjacent=afterAdjacent.replace(original,` for(const name of names){
  const path='tests/'+name,wrapper=readFileSync(new URL('./'+name,import.meta.url)),portable=readFileSync(new URL('./nine-history-original-'+name.replace('.test.mjs','.mjs'),import.meta.url)),previous=readFileSync(new URL('./fixtures/adjacent-portable-before/'+name+'.raw',import.meta.url));
  for(const [bytes,needle]of [[wrapper,'runNineHistory('],[portable,'assert.equal('],[previous,'assert.equal(']]){
   assert(bytes.toString().includes(needle),'Mutation reaches an actual dispatcher/assertion');
   for(const changed of [Buffer.concat([bytes,Buffer.from('/* foreign */')]),Buffer.from(bytes.toString().replace(needle,'void('))]){assert.notDeepEqual(changed,bytes);assert.throws(()=>diagnosticContextInput(path,changed));assert.throws(()=>restoreReleaseDiagnosticContext(path,changed));}
  }
 }`);
save(adjacent,beforeAdjacent,afterAdjacent);
fs.writeFileSync(root+'/MANIFEST.json',JSON.stringify({schema:'vm-release22-small-guards/1',baseline,files,evidence:{inboxSha256:sha(inbox),localReferenceAdmissionSha256:sha(historic)},scope:'Full original local-reference UI assertions retained through authenticated additive quick-review harness seams. Diagnostic mutation tests now actually remove dispatcher/assertions at wrapper, portable and previous source layers.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposal:root,files:files.length,seams:seams.length}));
