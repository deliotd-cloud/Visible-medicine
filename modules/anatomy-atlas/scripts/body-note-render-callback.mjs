// Test-only source selection. Never imported by the viewer or review workflow.
import assert from 'node:assert/strict';
import ts from 'typescript';

export function bodyNoteRenderCallback(source) {
  assert.equal(typeof source, 'string', 'Body note source must be text');
  const ast = ts.createSourceFile('body.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.equal(ast.parseDiagnostics.length, 0, 'Body note source must parse');
  const matches = [];
  const named = (node, name) => ts.isIdentifier(node) && node.text === name;
  function visit(node) {
    if (ts.isArrowFunction(node) && ts.isBlock(node.body) && node.parameters.length === 1 &&
        named(node.parameters[0].name, 'value') && !node.parameters[0].dotDotDotToken &&
        node.body.statements.some(statement => ts.isVariableStatement(statement) &&
          statement.declarationList.declarations.some(declaration => {
            const call = declaration.initializer;
            return named(declaration.name, 'content') && call && ts.isCallExpression(call) &&
              named(call.expression, 'bodyContent') && call.arguments.length === 2 &&
              named(call.arguments[0], 'selected') && named(call.arguments[1], 'value');
          }))) matches.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(matches.length, 1, 'Exactly one direct body note rendering callback is required');
  return matches[0].getText(ast);
}
