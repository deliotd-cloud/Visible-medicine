import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url);
const compiled=await build({entryPoints:['app/tour-quick-check.tsx'],bundle:true,write:false,format:'cjs',platform:'node'});
const mod={exports:{}};
runInNewContext(compiled.outputFiles[0].text,{module:mod,exports:mod.exports,require});
const {TourQuickCheck}=mod.exports;
const nodes=t=>!t||typeof t!=='object'?[]:Array.isArray(t)?t.flatMap(nodes):[t,...nodes(t.props?.children)];
const lesson={readiness:'draft',title:'Example',body:'Choose B.',bullets:['A','B'],correctAnswer:'B',explanation:'B is keyed.',note:'Review pending.',citations:['https://example.test/reference','javascript:alert(1)']};
let pauses=0;
const tree=TourQuickCheck({lesson,onOpen(){pauses++;}});
assert.equal(tree.type,'details');assert.equal(tree.props.open,undefined,'Starts collapsed');
tree.props.onToggle({currentTarget:{open:true}});assert.equal(pauses,1);
tree.props.onToggle({currentTarget:{open:false}});assert.equal(pauses,1,'Closing never resumes');
const question=nodes(tree).find(n=>n.props?.question);
assert.equal(question.props.question,lesson.body);assert.equal(question.props.correctAnswer,'B');
assert.deepEqual(Array.from(question.props.choices),lesson.bullets);
assert.equal(question.props.explanation,lesson.explanation);
assert.deepEqual(nodes(tree).filter(n=>n.type==='a').map(n=>n.props.href),[lesson.citations[0]]);
for(const changed of [{readiness:'pending'},{correctAnswer:undefined},{correctAnswer:'Unknown'},{bullets:['B','B']},{bullets:['B',' B ']},{bullets:['','B']}]){
 assert.equal(TourQuickCheck({lesson:{...lesson,...changed},onOpen(){throw Error('Unexpected callback');}}),null);
}
console.log('Tour quick check: collapsed, exact lesson, pause-only disclosure, safe links and six invalid-key/readiness cases pass.');
