import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {join} from 'node:path';
const read=p=>readFileSync(process.env.VM_WEBSITE_ROOT?join(process.env.VM_WEBSITE_ROOT,p):new URL('../'+p,import.meta.url));
function original(name){const row=JSON.parse(read('tests/fixtures/desktop-navigation-52/'+name+'.json'));assert.equal(row.schema,'vm-exact-source-preimage-json-1');assert.equal(row.path,'tests/'+name);const bytes=Buffer.from(row.text);assert.equal(bytes.length,row.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);return bytes;}
test('legacy controller behaviors retain original assertions; only public argument preflight migrates',()=>{
 const b=original('studio-course-history-controller.test.mjs');assert.equal(createHash('sha256').update(b).digest('hex'),'6f359f9a7204fe7d3d2e862d25aedef035ce92b9cefcd470571ffa32b1a24421');
 const replace=(s,a,c)=>{assert.equal(s.split(a).length,2);return s.replace(a,c);};let text=b.toString();
 text=replace(text,"const baseline = candidate.replace('window.history.pushState(null,', 'window.history.pushState(window.history.state,');","const externalState = '{ ...window.history.state, __vinext_externalHistoryState: true }';\nconst baseline = candidate.replace(`window.history.pushState(${externalState},`, 'window.history.pushState(window.history.state,');");
 text=replace(text,"  assert.equal(candidate.replace('window.history.pushState(null,', 'window.history.pushState(window.history.state,'), baseline);","  assert.equal(candidate.replace(`window.history.pushState(${externalState},`, 'window.history.pushState(window.history.state,'), baseline);");
 text=replace(text,'  assert.match(candidate, /window\\.history\\.pushState\\(null, "",/);','  assert.match(candidate, /window\\.history\\.pushState\\(\\{ \\.\\.\\.window\\.history\\.state, __vinext_externalHistoryState: true \\}, "",/);');
 assert.equal(read('tests/studio-course-history-controller.test.mjs').toString().replaceAll('\r\n','\n'),text.replaceAll('\r\n','\n'));
});
test('course details form preserves its frozen body outside exact tab and history-navigation seams',()=>{
 const b=original('studio-course-details-form.test.mjs');assert.equal(createHash('sha256').update(b).digest('hex'),'af77ec0d9df08474c6f199e4e1c33cd9b43dc4a13e9f897d82c7d7b631b321d5');let text=b.toString();
 for(const target of ['tree','opened']){const before=`walk(${target}, node => node.props['aria-controls'] === 'course-review').props['aria-pressed']`,after=`walk(${target}, node => node.props.role === 'tab' && node.props['aria-controls'] === 'course-review').props['aria-selected']`;assert.equal(text.split(before).length,2);text=text.replace(before,after);}
 const exact=(s,from,to)=>{assert.equal(s.split(from).length,2,`Unique declared seam: ${from.slice(0,55)}`);return s.replace(from,to);};
 const setup=[
  "  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');",
  '  const historyWrites = [];',
  '  const location = new URL(`http://localhost/studio/courses/${encodeURIComponent(course.id)}?keep=1&pane=review#outline`);',
  "  Object.defineProperty(globalThis, 'window', {configurable:true, writable:true, value:{",
  "    location, history:{state:{existing:'retained'}, pushState(state, _title, url) {",
  '      historyWrites.push({state,url}); location.href = new URL(url, location.href).href;',
  '    }},',
  '  }});',
 ].join('\n')+'\n';
 const inverse=candidate=>{let current=candidate.replaceAll('\r\n','\n');
 current=exact(current,setup,'');
 current=exact(current,', routes, historyWrites, renderEditor()',', routes, renderEditor()');
 current=exact(current,"dispose() {globalThis.fetch = oldFetch;if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete globalThis.window;}",
  'dispose() {globalThis.fetch = oldFetch;}');
 current=exact(current,"test('course options expose a bounded details form in Content and preserve the duplicate option and unrelated URL state'",
  "test('course options expose a bounded details form and preserve the active pane and duplicate option'");
 current=exact(current,"walk(opened, node => node.props.role === 'tab' && node.props['aria-controls'] === 'course-content').props['aria-selected']",
  "walk(opened, node => node.props.role === 'tab' && node.props['aria-controls'] === 'course-review').props['aria-selected']");
 for(const added of [
  "    assert.equal(walk(opened, node => node.props.id === 'course-review').props.hidden, true);\n",
  "    assert.deepEqual(h.historyWrites, [{state:{existing:'retained',__vinext_externalHistoryState:true},url:`/studio/courses/${encodeURIComponent(course.id)}?keep=1&pane=content#outline`}]);\n",
  "    assert.equal(h.historyWrites.length, 1, 'Hiding details does not create another pane entry');\n",
 ])current=exact(current,added,'');
 return current;};
 const current=read('tests/studio-course-details-form.test.mjs').toString();
 assert.equal(inverse(current),text.replaceAll('\r\n','\n'));
 const forged=current.replace("__vinext_externalHistoryState:true},url:","__vinext_externalHistoryState:false},url:");
 assert.notEqual(forged,current,'Mutation must alter admitted history assertion');
 assert.throws(()=>inverse(forged),/Unique declared seam/);
});
