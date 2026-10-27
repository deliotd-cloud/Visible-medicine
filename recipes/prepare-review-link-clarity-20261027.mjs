import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const parentFile='F:/VisibleMedicine/staging/20261027-cardiac-imaging-website/SOURCE_CANDIDATE.json';
assert.equal(hash(parentFile),'70809a044ed888f2dbf666a47293688c07821e0e7b38d5ffd43fc38982592274');
const parent=json(parentFile),root='F:/VisibleMedicine/staging/20261027-review-link-clarity-proposal';
assert(!fs.existsSync(root));fs.mkdirSync(root);
const files=[];
function edit(p,change){const input=fs.readFileSync(parent.website+'/'+p,'utf8'),output=change(input);assert.notEqual(input,output,p);const to=root+'/'+p;fs.mkdirSync(to.slice(0,to.lastIndexOf('/')),{recursive:true});fs.writeFileSync(to,output);files.push({path:p,beforeSha256:hash(parent.website+'/'+p),afterSha256:hash(to)});}
function once(text,from,to){assert.equal(text.split(from).length,2,from);return text.replace(from,to);}
edit('components/ClinicalReviewInbox.tsx',text=>{
 text=once(text,'aria-label={`${item.title}, ${item.trackLabel} worksheet (opens in a new tab)`}','aria-label={`${item.title}, ${item.scopeLabel}, ${item.trackLabel} worksheet (opens in a new tab)`}');
 for(const label of ['Local reference inspection · choose a held packet folder','Anatomy coverage and gaps · source inventory','Fracture examination pilot','Course and lecture publishing','Regional MRI inspection · corrections and recovery','Regional reference teaching · draft catalogue and private corrections'])
  text=once(text,'rel="noopener noreferrer">'+label,'rel="noopener noreferrer" aria-label="'+label+' (opens in a new tab)">'+label);
 return text;
});
edit('tests/clinical-review-inbox-ui.test.mjs',text=>once(text,
 'assert(links.every(link => link.props.target === \'_blank\' && link.props.rel === \'noopener noreferrer\'));',
 'assert(links.every(link => link.props.target === \'_blank\' && link.props.rel === \'noopener noreferrer\'));\r\n  for (const link of links) assert.equal(link.props[\'aria-label\'], `${words(link).replace(/ ↗$/, \'\')} (opens in a new tab)`, \'each destination retains its visible label and announces the new tab\');'));
edit('tests/clinical-review-inbox-link-context.test.mjs',text=>text+`
test('identically named structures announce their own region and worksheet type', async () => {
  const entries = [
    item('right', 'not-started', { title: 'Biceps', scopeLabel: 'Right shoulder', trackLabel: 'Anatomy' }),
    item('left', 'not-started', { title: 'Biceps', scopeLabel: 'Left shoulder', trackLabel: 'Anatomy' }),
    item('teaching', 'not-started', { title: 'Biceps', scopeLabel: 'Right shoulder', trackLabel: 'Teaching' }),
  ];
  const tree = await start(entries);
  const links = rows(tree).map(li => walk(li, n => n.type === 'a')[0]);
  assert.equal(links.length, entries.length);
  for (const entry of entries) {
    const link = links.find(n => n.props.href === entry.href);
    assert(link);
    assert.equal(link.props['aria-label'], entry.title + ', ' + entry.scopeLabel + ', ' + entry.trackLabel + ' worksheet (opens in a new tab)');
    assert.equal(link.props.onClick, undefined, 'normal links preserve browser navigation');
  }
  assert.equal(new Set(links.map(n => n.props['aria-label'])).size, entries.length);
  rows(tree).forEach(li => assertLinkContext(li));
  assert.equal(calls.length, 1, 'link clarification does not change review requests');
  reset();
});
`);
fs.writeFileSync(root+'/PATCHSET.json',JSON.stringify({at:new Date().toISOString(),parent:{path:parentFile,sha256:hash(parentFile)},installableFiles:files,scope:'Accessible link labels only. No navigation, access, review decisions, source bindings or visible layout changes.'},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(root+'/CONFIG.json',JSON.stringify({schema:'vm-scoped-source-successor/1',stage:'F:/VisibleMedicine/staging/20261027-review-link-clarity',parent:{path:parentFile,sha256:hash(parentFile)},patchset:{path:root+'/PATCHSET.json',sha256:hash(root+'/PATCHSET.json')},allowedPaths:files.map(r=>r.path),reason:'Distinguish matching structure names by region and worksheet type; announce every new-tab review destination.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({config:root+'/CONFIG.json',files:files.length}));
