import assert from 'node:assert/strict';

// Compare exact message data, not VM-specific Object/Array prototypes. Reject
// properties that structuredClone could otherwise silently discard.
function messageData(value,ancestors=new Set()) {
  if(value===null||typeof value!=='object'){
    assert(['undefined','string','number','boolean'].includes(typeof value)||value===null);
    if(typeof value==='number')assert(Number.isFinite(value));
    return structuredClone(value);
  }
  assert(!ancestors.has(value),'cyclic lesson data');ancestors.add(value);
  const prototype=Object.getPrototypeOf(value);
  assert(Array.isArray(value)||prototype===null||Object.getPrototypeOf(prototype)===null,'plain lesson data only');
  for(const key of Reflect.ownKeys(value)){
    assert.equal(typeof key,'string','symbol metadata is not lesson data');
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    assert(Object.hasOwn(descriptor,'value'),'accessors are not lesson data');
    assert(descriptor.enumerable||(Array.isArray(value)&&key==='length'),'hidden metadata is not lesson data');
    messageData(descriptor.value,ancestors);
  }
  ancestors.delete(value);return structuredClone(value);
}
const sameData=(actual,expected,label)=>assert.deepEqual(messageData(actual),messageData(expected),label);

// A single cell can bypass the preserved historical fallback only after every
// source, predecessor, current lesson and Review binding is proved.
export function assertTonguePalateQuizTransition({row, structure, tab, priorLesson,
  before, predecessor, predecessorTopic, after, introduced, topic,
  introducedTopic, currentResolver, worksheet}) {
  assert.equal(tab, 'quiz');
  assert.deepEqual(structure, row.identity, 'complete pinned source identity');
  assert.equal(row.previous.readiness, 'generated-identification');
  sameData(priorLesson, row.previous, 'f1 historical quiz predecessor');
  sameData(before, row.previous, 'original baseline quiz predecessor');
  sameData(predecessor, row.previous, 'exact a247 quiz predecessor');
  sameData(predecessorTopic, {tab, ...row.previous}, 'a247 Review predecessor');
  assert.equal(introduced.readiness, 'draft');
  assert.notDeepEqual(introduced, row.previous, 'source-backed quiz transition');
  sameData(after, introduced, 'exact 6036 quiz lesson');
  sameData(after, currentResolver(structure, tab), 'current source-bound resolver');
  sameData(topic, {tab, ...after}, 'current Review quiz topic');
  sameData(topic, introducedTopic, '6036 Review quiz topic');
  assert.equal(worksheet.approval, false, 'no carried clinical approval');
  assert.equal(worksheet.status, 'worksheet-not-submitted', 'unsigned Review worksheet');
}
