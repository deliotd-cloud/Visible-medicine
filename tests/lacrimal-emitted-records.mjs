import assert from 'node:assert/strict';
import {parseExpressionAt} from 'acorn';

function property(object, name) {
  assert.equal(object?.type, 'ObjectExpression', `${name} parent object`);
  const matches = object.properties.filter(item => item.type === 'Property' && !item.computed &&
    (item.key.name ?? item.key.value) === name);
  assert.equal(matches.length, 1, `${name} property occurs exactly once`);
  return matches[0].value;
}

function string(node, label) {
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0 && node.quasis.length === 1)
    return node.quasis[0].value.cooked;
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  assert.fail(`${label} is a static string`);
}

function emittedObject(runtime, at) {
  // Acorn supplies actual object-property boundaries; a comma expression may follow
  // this record in a minified array, so select only the first expression.
  const expression = parseExpressionAt(runtime, at, {ecmaVersion: 'latest'});
  const object = expression.type === 'SequenceExpression' ? expression.expressions[0] : expression;
  assert.equal(object.type, 'ObjectExpression', 'emitted pin record');
  return object;
}

export function assertLacrimalEmittedPin(runtime, {id, fma, file, sourceHash, group}) {
  const needle = `id:\`${id}\``;
  const records = [];
  for (let found = runtime.indexOf(needle); found >= 0; found = runtime.indexOf(needle, found + needle.length)) {
    const at = runtime.lastIndexOf('{identity:', found);
    if (runtime.slice(at, found) !== '{identity:{') continue;
    const object = emittedObject(runtime, at);
    if (object.start !== at || object.end <= found) continue;
    // The module also contains base/review records with the same identity. The
    // source teaching pin is the record with its own anatomy property.
    if (object.properties.some(item => item.type === 'Property' && (item.key.name ?? item.key.value) === 'anatomy'))
      records.push(object);
  }
  assert.equal(records.length, 1, `${id} one emitted teaching pin`);
  const record = records[0];
  const identity = property(record, 'identity');
  assert.equal(string(property(identity, 'id'), 'id'), id, `${id} identity`);
  assert.equal(string(property(identity, 'fmaId'), 'fmaId'), fma, `${id} FMA`);
  assert.equal(string(property(record, 'group'), 'group'), group, `${id} group`);
  property(record, 'anatomy');
  const sources = property(identity, 'sources');
  assert.equal(sources.type, 'ArrayExpression', `${id} sources array`);
  assert.equal(sources.elements.length, 1, `${id} one source component`);
  assert.equal(string(property(sources.elements[0], 'file'), 'file'), file, `${id} source file`);
  assert.equal(string(property(sources.elements[0], 'sha256'), 'sha256'), sourceHash, `${id} source hash`);
  const review = property(property(identity, 'validation'), 'anatomicalReview');
  assert.equal(runtime.slice(review.start, review.end), '!1', `${id} unvalidated`);
}
