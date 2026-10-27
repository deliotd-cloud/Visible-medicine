import assert from 'node:assert/strict';
import test from 'node:test';
import {createHeadViewHistory,HEAD_VIEW_ENTRY_KEY,type HeadHistoryScope} from '../lib/head-view-history.ts';

let serial=0;
const makeHistory=(limit=8)=>createHeadViewHistory(limit,()=>`opaque-entry-${++serial}`);
function fixture(){
  const unmapped={id:'synthetic-unmapped',label:'Original structure',family:'vessels',representation:'mask',
    mask:{file:'synthetic-mask.bin',sha256:'b'.repeat(64)},points_ras_mm:[[1,2,3]]};
  const mapped={id:'synthetic-mapped',label:'Mapped structure',family:'brain',representation:'point'};
  const definition={image:{shape_kji:[80,120,150],sha256:'a'.repeat(64),file:'synthetic.nii',dtype:'int16'},entries:[unmapped,mapped]};
  const pkg={manifest:{studies:{CT:definition,MRI:definition}},source:'folder'};
  const study={definition,geometry:{shapeKJI:[80,120,150]}};
  return {scope:{pkg,study,modality:'CT',revision:'synthetic-revision'} as unknown as HeadHistoryScope,unmapped,mapped};
}
const view={cursor:[67,60,40],layout:'axial' as const,windowing:[40,80] as [number,number]};

test('ordinary unmapped selection and mapped destination remain independent through Back and Forward',()=>{
  const history=makeHistory(),{scope,unmapped,mapped}=fixture();
  const ordinary='/atlas/ct-head',linked='/atlas/ct-head?concept=synthetic&headRevision=synthetic-revision';
  const back=history.ensure({framework:'retained'},ordinary)!;
  assert(history.save(back.state,ordinary,scope,view));
  assert(history.saveSelection(back.state,ordinary,scope,unmapped as never));
  const forward=history.ensure(history.freshExternalState(back.state),linked)!;
  assert(history.save(forward.state,linked,scope,{...view,cursor:[71,61,41]}));
  assert(history.saveSelection(forward.state,linked,scope,mapped as never));
  assert.deepEqual(history.read(back.state,ordinary,scope),view);
  assert.equal(history.readSelection(back.state,ordinary,scope),unmapped);
  assert.equal(history.readSelection(forward.state,linked,scope),mapped);
  assert.equal(history.readSelection(back.state,linked,scope),null,'copied URL cannot claim prior entry');
  assert.deepEqual(back.state,{framework:'retained',[HEAD_VIEW_ENTRY_KEY]:back.token},'browser state contains only opaque token');
  assert(!JSON.stringify(back.state).includes(unmapped.id));
});

test('only exact unique current-study entries are admitted and source/revision changes refuse restoration',()=>{
  const history=makeHistory(),{scope,unmapped}=fixture(),href='/atlas/ct-head';
  const state=history.ensure({},href)!.state;
  assert(history.saveSelection(state,href,scope,unmapped as never));
  assert.equal(history.saveSelection(state,href,scope,{...unmapped} as never),false);
  assert.equal(history.readSelection(state,href,{...scope,revision:'next'}),null);
  assert.equal(history.readSelection(state,href,{...scope,modality:'MRI'}),null);
  assert.equal(history.readSelection(state,href,{...scope,pkg:fixture().scope.pkg}),null);
  assert.equal(history.readSelection(state,href,{...scope,study:fixture().scope.study}),null);
  scope.study.definition.entries.splice(0,1);
  assert.equal(history.readSelection(state,href,scope),null,'unavailable entry is never substituted');
  scope.study.definition.entries.push(unmapped as never,unmapped as never);
  assert.equal(history.readSelection(state,href,scope),null,'ambiguous identity is never chosen');
});

test('explicit clear, replacement, eviction and new process remove selection; view updates preserve it',()=>{
  const history=makeHistory(2),{scope,unmapped}=fixture(),href='/atlas/ct-head';
  const state=history.ensure({},href)!.state;
  assert(history.saveSelection(state,href,scope,unmapped as never));
  assert(history.save(state,href,scope,view));
  assert.equal(history.readSelection(state,href,scope),unmapped);
  assert(history.saveSelection(state,href,scope,null));
  assert.equal(history.readSelection(state,href,scope),null,'Clear cannot resurrect');
  assert(history.saveSelection(state,href,scope,unmapped as never));
  history.clearPackage(scope.pkg);
  assert.equal(history.readSelection(state,href,scope),null);
  const replaced=history.ensure(state,href)!.state;
  assert(history.saveSelection(replaced,href,scope,unmapped as never));
  assert.equal(makeHistory().readSelection(replaced,href,scope),null,'reload has no receipt');
  history.ensure({},'/atlas/mri-head');history.ensure({},'/atlas/ct-head?other');
  assert.equal(history.readSelection(replaced,href,scope),null,'evicted receipt stays unavailable');
});

test('same ID with changed annotation content cannot restore, including mutation of the saved object',()=>{
  for(const change of [
    (entry:Record<string,unknown>)=>{entry.label='Different structure';},
    (entry:Record<string,unknown>)=>{entry.representation='point';},
    (entry:Record<string,unknown>)=>{entry.mask={file:'other-mask.bin',sha256:'c'.repeat(64)};},
    (entry:Record<string,unknown>)=>{entry.points_ras_mm=[[9,8,7]];},
  ]){
    const history=makeHistory(),{scope,unmapped}=fixture(),href='/atlas/ct-head';
    const state=history.ensure({},href)!.state;
    assert(history.saveSelection(state,href,scope,unmapped as never));
    change(unmapped);
    assert.equal(history.readSelection(state,href,scope),null,'saved object mutation is refused');
  }
  const history=makeHistory(),{scope,unmapped}=fixture(),href='/atlas/ct-head';
  const state=history.ensure({},href)!.state;
  assert(history.saveSelection(state,href,scope,unmapped as never));
  scope.study.definition.entries[0]={...unmapped,label:'Same ID, new annotation'} as never;
  assert.equal(history.readSelection(state,href,scope),null,'replacement by same ID is refused');
});

test('byte-identical configured remount admits selection under existing source policy',()=>{
  const history=makeHistory(),{scope,unmapped}=fixture(),href='/atlas/ct-head';
  scope.pkg.source='configured-local';
  const state=history.ensure({},href)!.state;
  assert(history.saveSelection(state,href,scope,unmapped as never));
  const copy=fixture().scope;
  copy.pkg.source='configured-local';
  assert.deepEqual(history.readSelection(state,href,copy),copy.study.definition.entries[0]);
  copy.study.definition.entries[0].label='Changed despite same image hash';
  assert.equal(history.readSelection(state,href,copy),null);
});

test('malformed replacement refuses without throwing and invalidates stale selection in the same receipt',()=>{
  const history=makeHistory(),{scope,unmapped}=fixture(),href='/atlas/ct-head';
  const state=history.ensure({},href)!.state;
  assert(history.saveSelection(state,href,scope,unmapped as never));
  for(const bad of [undefined,{},Object.assign(Object.create(null),{id:'synthetic-unmapped'}),
    {...unmapped,source:{cycle:null}}, {...unmapped,label:'x'.repeat(70000)}]){
    if((bad as {source?:{cycle:unknown}})?.source)(bad as {source:{cycle:unknown}}).source.cycle=bad;
    assert.equal(history.saveSelection(state,href,scope,bad as never),false);
  }
  assert.equal(history.readSelection(state,href,scope),null);
  assert(history.saveSelection(state,href,scope,unmapped as never),'valid entry remains saveable');
  scope.study.definition.entries[0]=null as never;
  assert.equal(history.readSelection(state,href,scope),null);
});

test('rejected ordinary B cannot resurrect ordinary A after mapped C and Back',()=>{
  const history=makeHistory(),{scope,unmapped,mapped}=fixture();
  const ordinary='/atlas/ct-head',linked='/atlas/ct-head?concept=synthetic&headRevision=synthetic-revision';
  const back=history.ensure({},ordinary)!;
  assert(history.save(back.state,ordinary,scope,view));
  assert(history.saveSelection(back.state,ordinary,scope,unmapped as never));
  const tooLarge={...unmapped,id:'synthetic-B',label:'B'.repeat(70000)};
  scope.study.definition.entries.push(tooLarge as never);
  assert.equal(history.saveSelection(back.state,ordinary,scope,tooLarge as never),false);
  assert.equal(history.readSelection(back.state,ordinary,scope),null,'A was invalidated immediately');
  assert(history.save(back.state,ordinary,scope,view),'native view remains available');
  assert.deepEqual(history.read(back.state,ordinary,scope),view);
  const forward=history.ensure(history.freshExternalState(back.state),linked)!;
  assert(history.saveSelection(forward.state,linked,scope,mapped as never));
  assert.equal(history.readSelection(forward.state,linked,scope),mapped);
  assert.equal(history.readSelection(back.state,ordinary,scope),null,'Back may show no selection, never stale A');
});
