import fs from 'node:fs';import assert from 'node:assert/strict';
const root='F:/VisibleMedicine/staging/20261027-quadriceps-tour/atlas/';
const file=root+'scripts/test-whole-body-guided-learning.mjs',helper=root+'scripts/regional-tour-resolution-test-inverse.mjs';
const additions=[
  [';revision:string;stepIndex?:number}})', ';revision:string}})'],
  ['  const [initialStep]=useState(initialTour?.stepIndex);\n  const [stepSeedTourId]=useState(initialTour?.id);\n  const [stepSeedRevision]=useState(initialTour?.revision);\n  const [stepSeedConsumed,setStepSeedConsumed]=useState(false);\n',''],
  ['pausedImaging?.suspend();setStepSeedConsumed(true);setTourId(id);','pausedImaging?.suspend();setTourId(id);'],
  [' initialStep={!stepSeedConsumed&&tour.tour.id===stepSeedTourId&&tour.tour.revision===stepSeedRevision?initialStep:undefined}','']
];
const block='  // Invert only the exact optional step-seed additions before the unchanged 2381 theorem.\n'+additions.map(([from,to])=>'  replaceOnce('+JSON.stringify(from)+','+JSON.stringify(to)+');\n').join('');
let t=fs.readFileSync(file,'utf8');const at='  replaceOnce("pausedImaging,initialTour}';assert.equal(t.split(at).length,2);t=t.replace(at,block+at);fs.writeFileSync(file,t);
let h=fs.readFileSync(helper,'utf8');const anchor="  let inverse=currentTest;\n";assert.equal(h.split(anchor).length,2);h=h.replace(anchor,anchor+'  inverse=replaceOnce(inverse,'+JSON.stringify(block)+',"","optional step-seed inverse block");\n');fs.writeFileSync(helper,h);