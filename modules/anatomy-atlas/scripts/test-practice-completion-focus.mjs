// Regression for the actual BodyExplorer completion path. The historical
// baseline proves the reported failure came from committed component markup.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';

const baseline='20405ebcf79b25107334a073127cd1b396b47495';
const path='app/body-explorer.tsx';
const current=readFileSync(path,'utf8');
const parse=text=>ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const name=node=>ts.isJsxElement(node)?node.openingElement.tagName.getText():ts.isJsxSelfClosingElement(node)?node.tagName.getText():null;
const attributes=node=>ts.isJsxElement(node)?node.openingElement.attributes:ts.isJsxSelfClosingElement(node)?node.attributes:null;
const attr=(node,key)=>attributes(node)?.properties.find(p=>ts.isJsxAttribute(p)&&p.name.text===key);
const descendants=(node,predicate)=>{const found=[];const visit=child=>{if(predicate(child))found.push(child);ts.forEachChild(child,visit);};visit(node);return found;};
const contains=(parent,child)=>parent.pos<=child.pos&&parent.end>=child.end;
const inspect=text=>{
 const source=parse(text);
 const markers=descendants(source,n=>name(n)==='PracticePanelNavigation');
 const results=descendants(source,n=>name(n)==='section'&&attr(n,'className')?.initializer?.text==='vm-practice-result');
 const examBranches=descendants(source,n=>ts.isConditionalExpression(n)&&n.condition.getText(source)==='exam');
 return {source,markers,results,examBranches};
};

// HEAD before the repair: completion removed the only marker with the exam
// branch, and the visible result h2 was not a programmatic focus target.
let baselineSource;
try {baselineSource=execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8'});}
catch {baselineSource=null;} // Shallow export can omit historical objects.
if(baselineSource){
 const prior=inspect(baselineSource);
 assert.equal(prior.markers.length,1,'Baseline has one navigation marker');
 assert(prior.examBranches.some(branch=>contains(branch.whenTrue,prior.markers[0])),
  'Baseline marker existed only while the question branch rendered');
 assert.equal(prior.results.length,1,'Baseline has a completed-results section');
 const heading=descendants(prior.results[0],n=>name(n)==='h2')[0];
 assert(heading&&!attr(heading,'data-practice-results'),
  'Baseline results heading had no navigation target');
}

const live=inspect(current);
assert.equal(live.markers.length,1,'A single navigation marker serves the panel');
assert.equal(live.results.length,1,'The completed-results section remains present');
assert(!live.examBranches.some(branch=>contains(branch.whenTrue,live.markers[0])),
 'Navigation marker remains mounted after the exam branch closes');
const phase=attr(live.markers[0],'phase');
assert(phase,'BodyExplorer passes the explicit practice phase');
const phaseExpression=phase.initializer?.getText(live.source)??'';
assert(phaseExpression.includes("'results'")&&phaseExpression.includes("'question'")&&phaseExpression.includes("'feedback'")&&phaseExpression.includes('null'),
 'Phase wiring distinguishes results, active prompt, feedback, and idle');
const resultHeading=descendants(live.results[0],n=>name(n)==='h2')[0];
assert(resultHeading,'Completed results retain an h2');
assert(attr(resultHeading,'data-practice-results'),'Completed results provide the focus target');
assert.equal(attr(resultHeading,'tabIndex')?.initializer?.getText(live.source),'{-1}',
 'Results heading accepts programmatic focus without joining tab order');
const description=attr(resultHeading,'aria-describedby')?.initializer;
assert(description,'Results heading references its score summary');
const summary=descendants(live.results[0],n=>name(n)==='p')[0];
assert(summary,'Completed results retain the score summary');
const summaryId=attr(summary,'id')?.initializer;
assert(summaryId,'Score summary has an id');
assert.equal(description.getText(live.source),summaryId.getText(live.source),
 'Results heading is described by the actual score summary');
console.log(JSON.stringify({passed:true,baselineReproduced:!!baselineSource,markerOutsideExam:true,resultsHeading:true}));
