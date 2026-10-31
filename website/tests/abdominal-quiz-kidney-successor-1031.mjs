// Exact, reversible admission: six original answers remain checked; two current kidney lessons are checked separately.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const edits=[
  [
    "  export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "  export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';\n  export {abdominalOrganQuizLesson} from './atlas-review/lib/abdominal-organ-quiz';\n  export {kidneyOrientationLesson} from './atlas-review/lib/kidney-orientation';"
  ],
  [
    "  assert.equal(quiz.correctAnswer,expected[pin.identity.fmaId]);assert.equal(quiz.bullets.length,4);\n  assert.equal(quiz.bullets.filter((v:string)=>v===quiz.correctAnswer).length,1);\n  assert.match(quiz.note,/Radiologist review pending/);",
    "  // Retain every original functional question even where a newer kidney lesson takes precedence.\n  const originalQuiz=api.abdominalOrganQuizLesson(pin.identity,'quiz');assert(originalQuiz);\n  assert.equal(originalQuiz.correctAnswer,expected[pin.identity.fmaId]);\n  assert.equal(originalQuiz.readiness,'draft');assert.equal(originalQuiz.bullets.length,4);\n  assert.equal(originalQuiz.bullets.filter((v:string)=>v===originalQuiz.correctAnswer).length,1);\n  assert.match(originalQuiz.note,/Radiologist review pending/);\n  const kidney=api.kidneyOrientationLesson(pin.identity,'quiz');\n  const kidneyAnswers:Record<string,string>={FMA7204:'Papilla → minor calyx → major calyx → renal pelvis → right ureter',FMA7205:'Retroperitoneal, usually higher than the right, with the spleen near its upper pole'};\n  assert.equal(Boolean(kidney),pin.identity.fmaId in kidneyAnswers);\n  if(kidney)assert.equal(kidney.correctAnswer,kidneyAnswers[pin.identity.fmaId]);\n  assert.deepEqual(quiz,{tab:'quiz',...(kidney??originalQuiz)});\n  assert.equal(quiz.bullets.length,4);assert.equal(quiz.bullets.filter((v:string)=>v===quiz.correctAnswer).length,1);\n  for(const fn of [api.abdominalOrganQuizLesson,api.kidneyOrientationLesson]){\n    assert.equal(fn({...pin.identity,name:'forged name'},'quiz'),undefined);\n    assert.equal(fn({...pin.identity,sources:[]},'quiz'),undefined);\n  }"
  ]
];
export function admitKidneyQuizSuccessor(bytes){assert.equal(sha(bytes),'b1fcbee183ea22cbc3a9463c90f51191c82221e462013544af9dd7ae00bf2d5f','Original abdominal quiz root');let text=bytes.toString();for(const [a,b]of edits){assert.equal(text.split(a).length,2);text=text.replace(a,b);}const result=Buffer.from(text);assert.equal(sha(result),'a504a6a124ff7ffc16d937ea58e64e7acabcbeed32eeef88789badc8561fef2e','Full successor abdominal quiz root');return result;}
