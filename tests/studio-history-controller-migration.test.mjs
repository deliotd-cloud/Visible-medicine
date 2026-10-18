import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
function original(name){const row=JSON.parse(read('tests/fixtures/desktop-navigation-52/'+name+'.json'));assert.equal(row.schema,'vm-exact-source-preimage-json-1');assert.equal(row.path,'tests/'+name);const bytes=Buffer.from(row.text);assert.equal(bytes.length,row.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);return bytes;}
test('legacy controller behaviors retain original assertions; only public argument preflight migrates',()=>{
 const b=original('studio-course-history-controller.test.mjs');assert.equal(createHash('sha256').update(b).digest('hex'),'6f359f9a7204fe7d3d2e862d25aedef035ce92b9cefcd470571ffa32b1a24421');
 const replace=(s,a,c)=>{assert.equal(s.split(a).length,2);return s.replace(a,c);};let text=b.toString();
 text=replace(text,"const baseline = candidate.replace('window.history.pushState(null,', 'window.history.pushState(window.history.state,');","const externalState = '{ ...window.history.state, __vinext_externalHistoryState: true }';\nconst baseline = candidate.replace(`window.history.pushState(${externalState},`, 'window.history.pushState(window.history.state,');");
 text=replace(text,"  assert.equal(candidate.replace('window.history.pushState(null,', 'window.history.pushState(window.history.state,'), baseline);","  assert.equal(candidate.replace(`window.history.pushState(${externalState},`, 'window.history.pushState(window.history.state,'), baseline);");
 text=replace(text,'  assert.match(candidate, /window\\.history\\.pushState\\(null, "",/);','  assert.match(candidate, /window\\.history\\.pushState\\(\\{ \\.\\.\\.window\\.history\\.state, __vinext_externalHistoryState: true \\}, "",/);');
 assert.equal(read('tests/studio-course-history-controller.test.mjs').toString().replaceAll('\r\n','\n'),text.replaceAll('\r\n','\n'));
});
test('course details form keeps every original check except two exact tab-selector migrations',()=>{
 const b=original('studio-course-details-form.test.mjs');assert.equal(createHash('sha256').update(b).digest('hex'),'af77ec0d9df08474c6f199e4e1c33cd9b43dc4a13e9f897d82c7d7b631b321d5');let text=b.toString();
 for(const target of ['tree','opened']){const before=`walk(${target}, node => node.props['aria-controls'] === 'course-review').props['aria-pressed']`,after=`walk(${target}, node => node.props.role === 'tab' && node.props['aria-controls'] === 'course-review').props['aria-selected']`;assert.equal(text.split(before).length,2);text=text.replace(before,after);}
 assert.equal(read('tests/studio-course-details-form.test.mjs').toString().replaceAll('\r\n','\n'),text.replaceAll('\r\n','\n'));
});
