import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';

const wire=(value:any):any=>JSON.parse(JSON.stringify(value));
const sha=(value:any):string=>createHash('sha256').update(JSON.stringify(wire(value))).digest('hex');
const rawSha=(value:Buffer):string=>createHash('sha256').update(value).digest('hex');
// Immutable hashes of the twelve authored lessons saved in Atlas 0b38b93.
const expected:Record<string,Record<string,string>>={
 FMA49914:{ct:'358cdabc1d957bffecdf89190f7cdd6eb692eccdb655a2e33e2dbb383310f137',mri:'00ef685a0b85de549e1652f1de963ba9a963d54804a21818ca20b305f35f3064',quiz:'a93124ed8f5938bf7e27ab1404511648f2c26f2975ec10726c564034a23d86b2'},
 FMA49916:{ct:'6acbb071a872973700dbbd9ddd9a3d91ee35a3a58a46b29f9551fe1e45cec2fd',mri:'162b863994ba61cc5e2688e3e33ea158a9b64a85e0f1e07efe1c9aa79c167e00',quiz:'f937d990890f556638182d19d5feb8c76bac87de20091decb1868003f17161c9'},
 FMA49911:{ct:'99a55c7a955faa93158295534530a908a5cfd28e8d2be7581cf0dca7fd4e8ac0',mri:'47b4179880de85720885460425fbd04911332882e4b322636cc931aef55fa0df',quiz:'51a7420f284e5b131d69d7f5ec2504428e27759c8abfa9319fe1d1b63a555b77'},
 FMA49913:{ct:'1dbc9a6323b314eadf0e988d667642721a619ecb4e57fb06521a6e347cd21eaf',mri:'96f3b87d5c4754927bdc248999755ee7d915d09df7a21baaf0e43d4e69ce8de0',quiz:'452a09e5774993b1452557b89ec0a8c853daccf111a5e762b4bf19bcf3bc9eb3'},
};
const pins=JSON.parse(readFileSync('atlas-review/content/pulmonary-venous-teaching-pins.json','utf8'));
const identities:any[]=pins.entries.map((entry:any)=>entry.identity);
assert.deepEqual(identities.map(identity=>identity.fmaId),Object.keys(expected));
const apiPromise=build({stdin:{contents:[
 "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
 "export {pulmonaryVenousTeachingLesson} from './atlas-review/lib/pulmonary-venous-teaching';",
 "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
 "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'})
 .then(result=>import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')));

test('four exact pulmonary vein identities bind twelve draft lessons and reject forged Review content',async()=>{
 const api=await apiPromise,questions=new Set<string>(),answerPositions:number[]=[];
 let forgedCount=0;
 for(const identity of identities){
  const material=await api.bodyReviewMaterial(identity.id);
  assert.equal(material.approval,false);assert.deepEqual(material.source.structure,identity);
  assert.deepEqual(await api.parseBodyReviewResponse(material,identity.id),material);
  for(const tab of ['ct','mri','quiz']){
   const lesson=api.pulmonaryVenousTeachingLesson(identity,tab);
   assert.equal(sha(lesson),expected[identity.fmaId][tab]);
   assert.deepEqual(api.bodyLesson(identity,tab),lesson);
   const {readiness,...shown}=lesson;assert.equal(readiness,'draft');
   assert.deepEqual(api.bodyContent(identity,tab),shown);
   assert.deepEqual(material.topics.find((topic:any)=>topic.tab===tab),{tab,...lesson});
   assert.match(lesson.note,/Revision-bound radiologist review pending/);
   assert.match(lesson.note,/No patient scan or spatial registration/);
   assert.match(lesson.note,/Didanix Education\/light/);
   assert.match(lesson.note,/Atlas, case and lecture access remain independent/);
   assert.equal(lesson.bullets.length,tab==='quiz'?4:2);
   assert.equal(new Set(lesson.bullets).size,lesson.bullets.length);
   if(tab==='quiz'){
    assert.equal(lesson.bullets.filter((choice:string)=>choice===lesson.correctAnswer).length,1);
    assert(lesson.explanation.trim());questions.add(lesson.body);
    answerPositions.push(lesson.bullets.indexOf(lesson.correctAnswer));
   }
   for(const field of ['body','bullet','citation','note',...(tab==='quiz'?['correctAnswer','explanation']:[])]){
    const forged=structuredClone(material),topic=forged.topics.find((value:any)=>value.tab===tab);
    if(field==='bullet')topic.bullets[0]+=' foreign';
    else if(field==='citation')topic.citations[0]='https://foreign.example/';
    else topic[field]+=' foreign';
    assert.equal(await api.parseBodyReviewResponse(forged,identity.id),null);forgedCount++;
   }
   const detached=api.pulmonaryVenousTeachingLesson(identity,tab);
   detached.bullets[0]+=' foreign';detached.citations.length=0;
   assert.deepEqual(api.pulmonaryVenousTeachingLesson(identity,tab),lesson);
   for(const patch of [{id:identity.id+'-foreign'},{fmaId:'FMA0'},{name:'Foreign'},
    {sources:[...identity.sources,...identity.sources]},{coverageNote:'Foreign'},{foreign:true}])
    assert.equal(api.pulmonaryVenousTeachingLesson({...identity,...patch},tab),undefined);
  }
  assert.equal(api.pulmonaryVenousTeachingLesson(identity,'ultrasound'),undefined);
 }
 assert.equal(questions.size,4);assert.deepEqual(answerPositions,[2,3,0,1]);assert.equal(forgedCount,56);
});

test('actual regional learner bundle and Clinical Review share the exact pulmonary teaching inputs',async()=>{
 const api=await apiPromise,review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const base='public/atlas-runtime/head-neck/',learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 assert.equal(learner.sourceCommit,review.revision);assert.equal(learner.patientDataIncluded,false);assert.equal(learner.clinicalApproved,false);
 const js=learner.files.filter((file:any)=>file.path.endsWith('.js')).map((file:any)=>{
  const bytes=readFileSync(base+file.path);assert.equal(rawSha(bytes),file.sha256);
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 }).join('\n');
 for(const path of ['content/pulmonary-venous-teaching.ts','content/pulmonary-venous-teaching-pins.json','lib/pulmonary-venous-teaching.ts','app/body-content.ts']){
  const record=review.files.find((file:any)=>file.path===path);assert(record,path);
  assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,record.sourceSha256);
  assert.equal(rawSha(readFileSync('atlas-review/'+path)),record.importedSha256);
 }
 for(const identity of identities)for(const tab of ['ct','mri','quiz']){
  const lesson=api.bodyLesson(identity,tab);assert.equal(sha(lesson),expected[identity.fmaId][tab]);
  for(const marker of [lesson.body,...lesson.bullets,...lesson.citations,...(tab==='quiz'?[lesson.correctAnswer,lesson.explanation]:[])])
   assert(js.includes(marker),identity.id+' '+tab);
 }
});

test('imported pulmonary venous Quiz uses lazy notes and the existing answer, retry and exam controls', {timeout: 120000}, async () => {
  const component = await build({
    stdin: {contents: "export {StructureQuickCheck} from './atlas-review/app/structure-quick-check'; export {QuizNotes,AtlasWorkspace} from './atlas-review/app/atlas-workspace';", resolveDir: process.cwd(), loader: 'tsx'},
    bundle: true, platform: 'node', format: 'cjs', write: false,
    packages: 'external', alias: {'@': process.cwd()}, loader: {'.css': 'empty'},
    tsconfigRaw: {compilerOptions: {jsx: 'react-jsx'}},
  });
  const require = createRequire(import.meta.url);
  const React = require('react');
  const render = require('react-dom/server').renderToStaticMarkup;
  const load = (react: any) => {
    const scope: {exports: any} = {exports: {}};
    runInNewContext(component.outputFiles[0].text, {module: scope, exports: scope.exports, require: (id: string) => id === 'react' ? react : id === 'next/link' ? () => { throw Error('Unrelated navigation'); } : require(id), console, structuredClone});
    return scope.exports;
  };
  const actual = load(React);
  let states: any[] = [], refs: any[] = [], cursor = 0, refCursor = 0, active = false, focusTarget = '';
  const contextDefaults = new WeakMap<object, any>();
  const shim = {...React,
    createContext(value: any) {const context = React.createContext(value); contextDefaults.set(context, value); return context;},
    useContext(context: object) {assert(contextDefaults.has(context)); return contextDefaults.get(context);},
    useId: () => active ? 'pulmonary-vein-quiz' : React.useId(),
    useState(initial: any) { if (!active) return React.useState(initial); const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], (value: any) => { states[i] = value; }]; },
    useRef(initial: any) { if (!active) return React.useRef(initial); const i = refCursor++; return refs[i] ?? (refs[i] = {current: initial}); },
  };
  const events = load(shim);
  const walk = (node: any, found: any[] = []): any[] => { if (React.isValidElement(node)) { found.push(node); React.Children.forEach(node.props.children, (child: any) => walk(child, found)); } return found; };
  const text = (node: any): string => typeof node === 'string' ? node : !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
  const apiBuild = await build({stdin: {contents: "export {bodyContent} from './atlas-review/app/body-content';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, platform: 'node', format: 'esm', write: false});
  const {bodyContent} = await import('data:text/javascript;base64,' + Buffer.from(apiBuild.outputFiles[0].text).toString('base64'));
  for (const identity of identities) {
    const lesson=bodyContent(identity,'quiz');
    const props = {question: lesson.body, choices: lesson.bullets, correctAnswer: lesson.correctAnswer, explanation: lesson.explanation};
    const attempt = events.StructureQuickCheck(props);
    assert.equal(attempt.key, JSON.stringify(props));
    assert.notEqual(events.StructureQuickCheck({...props, explanation: props.explanation + ' revised'}).key, attempt.key);
    assert.notEqual(events.StructureQuickCheck({...props, correctAnswer: props.choices.find((x: string) => x !== props.correctAnswer)}).key, attempt.key);
    states = []; refs = []; cursor = 0; refCursor = 0; active = true;
    let note = events.QuizNotes({structure: identity}); active = false;
    assert.equal(note.type, 'details');
    assert.equal(walk(note).find((n: any) => n.type?.name === 'LazyBodyTeaching').props.enabled, false);
    note.props.onToggle({currentTarget: {open: true}});
    cursor = 0; active = true; note = events.QuizNotes({structure: identity}); active = false;
    const lazy = walk(note).find((n: any) => n.type?.name === 'LazyBodyTeaching');
    assert.equal(lazy.props.enabled, true);
    const loaded = lazy.props.children({bodyContent});
    const child = walk(loaded).find((n: any) => n.type?.name === 'StructureQuickCheck');
    assert(child);
    assert.equal(child.key, identity.id);
    assert.deepEqual(wire(child.props), props);
    assert.deepEqual(walk(loaded).filter((n: any) => n.type === 'a').map((n: any) => n.props.href), lesson.citations);
    const html = render(React.createElement(actual.StructureQuickCheck, props));
    assert.equal((html.match(/type="radio"/g) ?? []).length, 4);
    assert(!html.includes('Correct answer:'));
    const exam = render(React.createElement(actual.AtlasWorkspace, {exam: true}, React.createElement(actual.QuizNotes, {structure: identity})));
    assert(!exam.includes('atlas-quiz-notes'));
    states = []; refs = []; let tree: any;
    const redraw = () => {
      cursor = 0; refCursor = 0; active = true; tree = attempt.type(attempt.props); active = false;
      for (const node of walk(tree)) if (node.props.ref) node.props.ref.current = {focus(options: any) {assert.equal(options.preventScroll, true); focusTarget = node.type === 'input' ? 'first-radio' : 'feedback';}};
    };
    const radios = () => walk(tree).filter((n: any) => n.type === 'input');
    const button = (label: string) => walk(tree).find((n: any) => n.type === 'button' && text(n) === label);
    const answer = (index: number) => {radios()[index].props.onChange(); redraw(); button('Check answer').props.onClick(); redraw();};
    redraw(); assert.equal(button('Check answer').props.disabled, true);
    const correct = props.choices.indexOf(props.correctAnswer);
    answer(correct);
    assert(text(tree).includes('Correct. Correct answer: ' + props.correctAnswer));
    assert(text(tree).includes(props.explanation));
    assert.equal(focusTarget, 'feedback');
    button('Practise again').props.onClick(); redraw();
    assert.equal(focusTarget, 'first-radio');
    assert(radios().every((n: any) => !n.props.checked));
    answer((correct + 1) % 4);
    assert(text(tree).includes('Incorrect. Correct answer: ' + props.correctAnswer));
    assert(text(tree).includes(props.explanation));
    button('Try again').props.onClick(); redraw();
    assert.equal(focusTarget, 'first-radio');
    assert(radios().every((n: any) => !n.props.checked));
    answer((correct + 1) % 4);
    radios()[correct].props.onChange(); redraw();
    assert(!text(tree).includes('Correct answer:'));
    assert(!text(tree).includes(props.explanation));
  }
});
