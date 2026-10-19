import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';

test('shared response exposes Yes/No, conditional bone field, submission lock and pending/scored states',async()=>{
  const bundle=await build({stdin:{contents:`
    import {renderToStaticMarkup} from 'react-dom/server';
    import {FractureCaseResponse} from './components/FractureCaseResponse';
    export const render = props => renderToStaticMarkup(<FractureCaseResponse {...props}/>);
    export const tree = props => FractureCaseResponse(props);
  `,loader:'tsx',resolveDir:process.cwd()},jsx:'automatic',bundle:true,write:false,format:'esm',platform:'node',packages:'external'});
  // Import a temporary code-only test module beside node_modules for package resolution.
  const {mkdtemp,writeFile,rm}=await import('node:fs/promises');
  const {pathToFileURL}=await import('node:url');
  const {resolve}=await import('node:path');
  const dir=await mkdtemp(resolve('.local/fracture-component-test-'));
  try {
    const file=resolve(dir,'test.mjs');await writeFile(file,bundle.outputFiles[0].contents);
    const {render,tree}=await import(pathToFileURL(file).href);
    let saved='';
    const base={id:'synthetic',index:0,response:'',answerKey:{status:'reviewed',fracturePresent:true,acceptedBoneAnswers:['radius']},editable:true,onChange:(_id:string,value:string)=>{saved=value;}};
    let html=render(base);assert.match(html,/>Yes</);assert.match(html,/>No</);assert.doesNotMatch(html,/What bone is fractured/);
    const flatten=(node:any):any[]=> !node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(flatten)];
    const elements=flatten(tree(base));
    elements.find(n=>n.type==='button'&&n.props.children==='Yes').props.onClick();
    assert.deepEqual(JSON.parse(saved),{choice:'yes',bone:'',submitted:false});
    html=render({...base,response:saved});assert.match(html,/What bone is fractured/);
    const submitted=JSON.stringify({choice:'yes',bone:'radius',submitted:true});
    html=render({...base,response:submitted});assert.match(html,/fieldset disabled/);assert.match(html,/Scoring preview: 2\/2/);
    html=render({...base,response:submitted,answerKey:{...base.answerKey,status:'pending'}});assert.match(html,/Marking awaits a reviewed answer key/);assert.doesNotMatch(html,/Scoring preview: 2/);
    html=render({...base,response:JSON.stringify({choice:'no',bone:'',submitted:true})});assert.match(html,/Scoring preview: 0\/2/);assert.doesNotMatch(html,/What bone is fractured/);
  } finally {
    // Exact test-owned filenames only; no recursive removal.
    await rm(resolve(dir,'test.mjs'));await (await import('node:fs/promises')).rmdir(dir);
  }
});
