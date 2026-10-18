import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const {stableMutationContext}=require('./studio-mutation-context-fixture.mjs');
const code = ts.transpileModule(readFileSync(new URL('../components/StudioForms.tsx', import.meta.url), 'utf8'), {
  compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText;
type Node = {type: unknown; props: Record<string, any>};
type Effect = {deps: unknown[]; cleanup?: () => void};
class Input {
  name: string; value: string; type: string; checked: boolean; disabled = false;
  constructor(name: string, value = '', type = 'text', checked = false) {Object.assign(this, {name, value, type, checked}); this.name=name; this.value=value; this.type=type; this.checked=checked;}
}
class Textarea extends Input {}
class Select extends Input {}
class LinkTarget {
  readonly anchor: {href:string;target:string;hasAttribute:(name:string)=>boolean};
  constructor(anchor: {href:string;target:string;hasAttribute:(name:string)=>boolean}) {this.anchor=anchor;}
  closest(selector:string) {return selector === 'a[href]' ? this.anchor : null;}
}
const recoveryScope = {actorId:'edu:synthetic-author',organizationId:'org:synthetic'};
const primary = `visible-medicine-studio-draft:${JSON.stringify(['v1',recoveryScope.actorId,recoveryScope.organizationId,'new-course'])}`;
const unscopedPrimary = 'visible-medicine-studio-draft:new-course', legacy = 'elivion-studio-draft:new-course';

function harness(options: {raw?: string; legacyRaw?: string; unscopedRaw?: string; getFails?: boolean; setFails?: boolean; removeFails?: boolean; controls?: Input[]; realCreateSubmit?:boolean; onSubmit?: (form: FormData) => Promise<void>;onValuesChange?:(form:FormData,recovered?:Record<string,string|string[]>)=>void;onDraftRecoveryChange?:(state:'none'|'recovered'|'attention')=>void} = {}) {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const slots: any[] = [], effects = new Map<number, Effect>(), listeners = new Set<(event: any) => void>(), storageListeners = new Set<(event:any)=>void>(),clickListeners = new Set<(event:any)=>void>(),timers = new Map<number, () => void>();
  const values = new Map<string, string>(), removed: string[] = [], reads:string[]=[];
  if (options.raw !== undefined) values.set(primary, options.raw);
  if (options.legacyRaw !== undefined) values.set(legacy, options.legacyRaw);
  if (options.unscopedRaw !== undefined) values.set(unscopedPrimary, options.unscopedRaw);
  let cursor = 0, dirty = true, pending: Array<() => void> = [], tree: Node, timerId = 0,unmounted=false,writesAfterUnmount=0;
  const controls = options.controls ?? [new Input('title')];
  const form = {elements: controls, querySelectorAll: () => controls.filter(control => control.type === 'checkbox')};
  class FixtureFormData {
    entries: Array<[string, string]>;
    constructor(element: typeof form) {this.entries = element.elements.filter(control => !control.disabled && (control.type !== 'checkbox' || control.checked)).map(control => [control.name, control.value]);}
    getAll(name: string) {return this.entries.filter(([key]) => key === name).map(([, value]) => value);}
    get(name: string) {return this.getAll(name)[0] ?? null;}
    keys() {return this.entries.map(([key]) => key).values();}
  }
  const storage = {
    getItem(key: string) {reads.push(key);if (options.getFails) throw new Error('Storage blocked'); return values.get(key) ?? null;},
    setItem(key: string, value: string) {if (options.setFails) throw new Error('Quota exceeded'); values.set(key, value);},
    removeItem(key: string) {removed.push(key); if (options.removeFails) throw new Error('Storage blocked'); values.delete(key);},
  };
  const lockRequests:Array<{name:string;action:()=>unknown;resolve:(value:unknown)=>void;reject:(error:unknown)=>void}>=[];
  const locks={held:false,request(name:string,action:()=>unknown){if(this.held)return new Promise((resolve,reject)=>lockRequests.push({name,action,resolve,reject}));try{return Promise.resolve(action());}catch(error){return Promise.reject(error);}}};
  const browserNavigator:{locks:typeof locks|undefined}={locks};
  let confirms = 0, confirmResult = false;
  const document = {location:{href:'https://visiblemedicine.test/studio/courses'},addEventListener(name:string,listener:(event:any)=>void,capture?:boolean){if(name==='click'){assert.equal(capture,true);clickListeners.add(listener);}},removeEventListener(name:string,listener:(event:any)=>void,capture?:boolean){if(name==='click'){assert.equal(capture,true);clickListeners.delete(listener);}}};
  const globals: Record<string, unknown> = {navigator:browserNavigator,localStorage: storage, document, Element:LinkTarget, HTMLInputElement: Input, HTMLTextAreaElement: Textarea, HTMLSelectElement: Select, FormData: FixtureFormData,
    window: {setTimeout(callback: () => void) {timers.set(++timerId, callback); return timerId;}, clearTimeout(id: number) {timers.delete(id);},
      confirm(){confirms++;return confirmResult;},
      addEventListener(name: string, listener: (event: any) => void) {if (name === 'beforeunload') listeners.add(listener);if(name==='storage')storageListeners.add(listener);},
      removeEventListener(name: string, listener: (event: any) => void) {if (name === 'beforeunload') listeners.delete(listener);if(name==='storage')storageListeners.delete(listener);}},
  };
  for (const [name, value] of Object.entries(globals)) {originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, {value, writable: true, configurable: true});}
  const equal = (a: unknown[] | undefined, b: unknown[]) => !!a && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const hooks = {
    ...React,
    useState(initial: unknown) {const slot = cursor++; if (!(slot in slots)) slots[slot] = initial; return [slots[slot], (value: unknown) => {if(unmounted)writesAfterUnmount++;const next = typeof value === 'function' ? (value as (old: unknown) => unknown)(slots[slot]) : value; if (!Object.is(next, slots[slot])) {slots[slot] = next; dirty = true;}}];},
    useRef(initial: unknown) {const slot = cursor++; if (!(slot in slots)) slots[slot] = {current: initial}; return slots[slot];},
    useEffect(create: () => void | (() => void), deps: unknown[]) {const slot = cursor++, old = effects.get(slot); if (!equal(old?.deps, deps)) pending.push(() => {old?.cleanup?.(); const cleanup = create(); effects.set(slot, {deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined});});},
    useLayoutEffect(create: () => void | (() => void), deps: unknown[]) {const slot = cursor++, old = effects.get(slot); if (!equal(old?.deps, deps)) pending.push(() => {old?.cleanup?.(); const cleanup = create(); effects.set(slot, {deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined});});},
  };
  const mod = {exports: {} as {CreateCourseForm: (props: {recoveryScope: typeof recoveryScope}) => Node}};
  const routes:string[]=[];let refreshes=0;
  new Function('require', 'module', 'exports', code)((name: string) => name === '../lib/studio-mutation-context.ts' ? stableMutationContext : name === 'react' ? hooks : name === 'next/navigation' ? {useRouter: () => ({push:(path:string)=>routes.push(path),refresh:()=>refreshes++})} : name === '@/lib/studio-templates' ? {STUDIO_COURSE_TEMPLATES: []} : require(name), mod, mod.exports);
  const outer = mod.exports.CreateCourseForm({recoveryScope}), action = outer.type as (props: Record<string, unknown>) => Node;
  const props = {...outer.props, draftRevision:undefined as string|undefined,onValuesChange:options.onValuesChange,onDraftRecoveryChange:options.onDraftRecoveryChange,onSubmit: options.onSubmit ?? (options.realCreateSubmit ? outer.props.onSubmit : async () => {})};
  function flush() {let passes = 0; do {assert(++passes < 20); dirty = false; cursor = 0; pending = []; tree = action(props); tree.props.ref.current = form; for (const effect of pending) effect();} while (dirty); return tree!;}
  function content(value: any): string {return Array.isArray(value) ? value.map(content).join('') : value?.props ? content(value.props.children) : typeof value === 'string' ? value : '';}
  function walk(value: any, match: (node: Node) => boolean): Node | undefined {if (Array.isArray(value)) {for (const child of value) {const found = walk(child, match); if (found) return found;} return;} if (!value?.props) return; return match(value) ? value : walk(value.props.children, match);}
  function change(value: string) {controls[0].value = value; tree.props.onChange(); flush();}
  function submit() {return tree.props.onSubmit({preventDefault() {}, currentTarget: form}) as Promise<void>;}
  function unmount(){unmounted=true;for(const effect of effects.values())effect.cleanup?.();effects.clear();}
  function dispose() {unmount();for (const [name, descriptor] of originals) {if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete (globalThis as any)[name];}}
  flush();
  return {routes,get refreshes(){return refreshes;},flush, change, submit, dispose,unmount,get writesAfterUnmount(){return writesAfterUnmount;},get confirms(){return confirms;},set confirmResult(value:boolean){confirmResult=value;},clickListeners,controls, values, reads, removed, listeners, storageListeners,locks,lockRequests,browserNavigator,options,click(href='/studio/workspace'){const event={target:new LinkTarget({href,target:'',hasAttribute:()=>false}),button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};for(const listener of clickListeners)listener(event);return event.defaultPrevented;},async settle(){await Promise.resolve();await Promise.resolve();if(!unmounted)flush();},releaseLock(){const request=lockRequests.shift();assert(request);try{request.resolve(request.action());}catch(error){request.reject(error);}if(!unmounted)flush();},external(key:string|null,raw:string|null,area:unknown=storage){if(key===null)values.clear();else if(raw===null)values.delete(key);else values.set(key,raw);for(const listener of storageListeners)listener({key,newValue:raw,storageArea:area});flush();},reorder(value:string){props.draftRevision=value;flush();},text: () => content(tree), find: (match: (node: Node) => boolean) => walk(tree, match), runTimers() {for (const [id, callback] of timers) {timers.delete(id); callback();} flush();}};
}

test('actual course creation keeps the device-local draft on uncertain acknowledgement and clears it only after confirmed save',async()=>{
 const oldFetch=globalThis.fetch;let body:unknown={},calls=0;
 globalThis.fetch=(async()=>{calls++;return {ok:true,status:200,json:async()=>body} as Response;}) as typeof fetch;
 const h=harness({realCreateSubmit:true});try{
  h.change('Unsent course title');await h.settle();const stored=h.values.get(primary);assert.ok(stored);
  await h.submit();h.flush();assert.equal(calls,1);assert.equal(h.values.get(primary),stored);assert.equal(h.removed.length,0);
  assert.equal(h.controls[0].value,'Unsent course title');assert.equal(h.routes.length,0);assert.equal(h.refreshes,0);
  assert.match(h.text(),/could not confirm/);assert.doesNotMatch(h.text(),/Saved successfully/);assert.equal(h.listeners.size,1);
  body={ok:true,action:'create-course',courseId:'course:confirmed'};
  await h.submit();h.flush();assert.equal(calls,1,'an unconfirmed save cannot be repeated immediately');
  const reconcile=()=>h.find(node=>node.type==='button'&&node.props.children==='I checked the saved item');
  assert.ok(reconcile());h.confirmResult=false;reconcile()!.props.onClick();h.flush();
  await h.submit();h.flush();assert.equal(calls,1,'cancelled reconciliation keeps the guard');
  h.confirmResult=true;reconcile()!.props.onClick();h.flush();
  await h.submit();h.flush();assert.equal(calls,2);assert.equal(h.values.has(primary),false);
  assert.deepEqual(h.routes,['/studio/courses/course%3Aconfirmed']);assert.equal(h.refreshes,1);assert.equal(h.listeners.size,0);assert.match(h.text(),/Saved successfully/);
 }finally{h.dispose();globalThis.fetch=oldFetch;}
});

test('Studio link guard blocks queued draft loss and allows confirmed departure',()=>{
 const h=harness();try{
  assert.equal(h.click(),false);assert.equal(h.confirms,0);
  h.locks.held=true;h.change('Queued input');assert.equal(h.values.size,0);
  assert.equal(h.click(),true);assert.equal(h.confirms,1);
  h.confirmResult=true;assert.equal(h.click(),false);assert.equal(h.confirms,2);
  h.releaseLock();assert.equal(h.click(),false);assert.equal(h.confirms,2);
 }finally{h.dispose();assert.equal(h.clickListeners.size,0);}
});

test('Studio link guard follows failed storage and cross-tab invalidation, then clears after save',async()=>{
 const failed=harness({setFails:true});try{failed.change('Local failure');await failed.settle();assert.equal(failed.click(),true);}finally{failed.dispose();}
 const h=harness();try{h.change('Stored');assert.equal(h.click(),false);h.external(primary,'{"title":"Other tab"}');assert.equal(h.click(),true);await h.submit();h.flush();assert.equal(h.click(),false);}finally{h.dispose();assert.equal(h.clickListeners.size,0);}
});

test('reorder-only edits snapshot committed checkbox order and set the unsaved guard',()=>{
 const controls=[new Input('workbookIds','a','checkbox',true),new Input('workbookIds','b','checkbox',true)];
 const h=harness({controls});try{
   assert.equal(h.values.size,0);assert.equal(h.listeners.size,0);
   controls.reverse();h.reorder('["b","a"]');
   assert.deepEqual(JSON.parse(h.values.get(primary)!).workbookIds,['b','a']);assert.equal(h.listeners.size,1);
   assert.match(h.text(),/Unsubmitted changes saved on this device only/);
 }finally{h.dispose();}
});

test('recovery callback retains serialized selection order independently of current DOM order',()=>{
 let restored:Record<string,string|string[]>|undefined;
 const h=harness({raw:JSON.stringify({workbookIds:['b','a']}),controls:[new Input('workbookIds','a','checkbox'),new Input('workbookIds','b','checkbox')],onValuesChange:(_form,recovered)=>{restored=recovered;}});
 try{h.runTimers();assert.deepEqual(restored?.workbookIds,['b','a']);assert.deepEqual(h.controls.map(x=>x.checked),[true,true]);}finally{h.dispose();}
});

test('recovered unsent draft is dirty, announced and protected by unload warning', () => {
  const h = harness({raw: JSON.stringify({title: 'Recovered course'})});
  try {h.runTimers(); assert.equal(h.controls[0].value, 'Recovered course'); assert.match(h.text(), /Unsubmitted changes saved on this device only/); assert.match(h.text(), /Recovered an unsent/); assert.equal(h.listeners.size, 1); const event = {prevented: false, returnValue: undefined as unknown, preventDefault() {this.prevented = true;}}; [...h.listeners][0](event); assert.equal(event.prevented, true); assert.equal(event.returnValue, '');} finally {h.dispose();}
});

test('singleton checkbox value, grouped values and old boolean value shapes recover within a scoped draft', () => {
  for (const [saved, expected] of [[{workbookIds: 'one', enrolmentOpen: 'on'}, [true, false, true]], [{workbookIds: ['one', 'two'], enrolmentOpen: 'false'}, [true, true, false]], [{workbookIds: 'false', enrolmentOpen: 'true'}, [false, false, true]]] as const) {
    const h = harness({raw: JSON.stringify(saved), controls: [new Input('workbookIds', 'one', 'checkbox'), new Input('workbookIds', 'two', 'checkbox'), new Input('enrolmentOpen', 'on', 'checkbox')]});
    try {assert.deepEqual(h.controls.map(control => control.checked), expected);} finally {h.dispose();}
  }
});

test('malformed draft or blocked reads do not crash, delete bytes or overwrite current input', () => {
  for (const options of [{raw: '{bad'}, {raw: '[]'}, {raw: '{"title":42}'}, {raw: '{"title":"old"}', getFails: true, removeFails: true}]) {
    const h = harness({...options, controls: [new Input('title', 'Current input')]});
    try {assert.equal(h.controls[0].value, 'Current input'); assert.match(h.text(), /could not be recovered.*not been deleted/); assert.equal(h.removed.length, 0); assert.equal(h.values.get(primary), options.raw);} finally {h.dispose();}
  }
});

test('quota failure keeps input and unload guard without claiming device protection; later write recovers', async () => {
  const h = harness({setFails: true});
  try {h.change('Unsent course');await h.settle(); assert.equal(h.controls[0].value, 'Unsent course'); assert.match(h.text(), /not saved on this device/); assert.match(h.text(), /storage is unavailable/); assert.equal(h.listeners.size, 1); h.options.setFails = false; h.change('Protected course'); assert.match(h.text(), /saved on this device only/); assert.doesNotMatch(h.text(), /storage is unavailable/); assert.equal(JSON.parse(h.values.get(primary)!).title, 'Protected course');} finally {h.dispose();}
});

test('server failure retains current draft, dirty state and exact error', async () => {
  const h = harness({onSubmit: async () => {throw new Error('Server unavailable');}});
  try {h.change('Keep this'); await h.submit(); h.flush(); assert.match(h.text(), /Server unavailable/); assert.doesNotMatch(h.text(), /Saved successfully/); assert.equal(JSON.parse(h.values.get(primary)!).title, 'Keep this'); assert.equal(h.listeners.size, 1); assert.equal(h.find(node => node.type === 'fieldset')?.props.disabled, false);} finally {h.dispose();}
});

test('successful save clears only the scoped namespace and unload warning', async () => {
  const h = harness({legacyRaw: JSON.stringify({title: 'Legacy draft'})});
  try {h.change('Submitted'); await h.submit(); h.flush(); assert.match(h.text(), /Saved successfully/); assert.match(h.text(), /No unsaved changes/); assert.equal(h.values.has(primary), false); assert.equal(h.values.get(legacy), JSON.stringify({title: 'Legacy draft'})); assert.deepEqual(h.removed, [primary]); assert.equal(h.listeners.size, 0); assert(!h.reads.includes(legacy));} finally {h.dispose();}
});

test('storage cleanup failure cannot turn confirmed server success into an action error', async () => {
  let calls = 0;
  const h = harness({removeFails: true, onSubmit: async () => {calls++;}});
  try {h.change('Saved server version'); await h.submit(); h.flush(); assert.equal(calls, 1); assert.match(h.text(), /Saved successfully/); assert.match(h.text(), /old device-local draft could not be cleared/); assert.equal(h.find(node => node.props.role === 'alert'), undefined); assert.equal(h.listeners.size, 0); assert.deepEqual(h.removed, [primary],'an absent legacy key needs no removal');} finally {h.dispose();}
});

for(const key of [primary,legacy])test(`successful save preserves an intervening write to ${key.split(':')[0]}`,async()=>{
 let complete!:()=>void;
 const h=harness({legacyRaw:JSON.stringify({title:'Old legacy'}),onSubmit:()=>new Promise<void>(resolve=>{complete=resolve;})});
 try{
   h.change('This tab submitted');const pending=h.submit();h.flush();
   const newer=JSON.stringify({title:'Other tab newer'});h.values.set(key,newer); // Event may not have arrived yet.
   complete();await pending;h.flush();
   assert.equal(h.values.get(key),newer);assert(!h.removed.includes(key));assert.match(h.text(),/Saved successfully/);
   if(key===primary)assert.match(h.text(),/different device-local draft was kept/);
   else {assert.doesNotMatch(h.text(),/different device-local draft was kept/);assert(!h.reads.includes(legacy));}
   assert.equal(h.controls[0].value,'This tab submitted');
   assert.equal(h.listeners.size,0,'confirmed server save clears this tab’s unsaved warning');
 }finally{h.dispose();}
});

test('another tab’s draft is not overwritten by typing or reorder-only edits',async()=>{
 const h=harness();try{
   h.change('This tab old');const newer=JSON.stringify({title:'Other tab'});h.external(primary,newer);
   assert.match(h.text(),/not saved on this device/);assert.equal(h.controls[0].value,'This tab old');
   h.change('Keep my current input');h.reorder('new-order');
   assert.equal(h.values.get(primary),newer);assert.equal(h.controls[0].value,'Keep my current input');assert.equal(h.listeners.size,1);
   assert.match(h.text(),/will not be replaced automatically/);
   await h.submit();h.flush();assert.equal(h.values.get(primary),newer);assert.match(h.text(),/different device-local draft was kept/);
 }finally{h.dispose();assert.equal(h.storageListeners.size,0);}
});

test('missed storage events, removal and clear do not resurrect retired drafts',()=>{
 for(const mode of ['silent-write','remove','clear']){
  const h=harness();try{
   h.change('Initial');if(mode==='silent-write')h.values.set(primary,'{"title":"Other"}');else h.external(mode==='clear'?null:primary,null);
   h.change('Unsent current');assert.equal(h.controls[0].value,'Unsent current');assert.match(h.text(),/not saved on this device/);
   assert.equal(h.values.get(primary),mode==='silent-write'?'{"title":"Other"}':undefined);assert.equal(h.listeners.size,1);
  }finally{h.dispose();}
 }
});

test('unrelated storage events do not invalidate this form’s saved draft',()=>{
 const h=harness();try{
  h.change('Mine');h.external('unrelated:key','other');h.external(primary,h.values.get(primary)!,{});
  assert.match(h.text(),/Unsubmitted changes saved on this device only/);assert.doesNotMatch(h.text(),/another tab/);
 }finally{h.dispose();}
});

test('unreadable cleanup preserves bytes while retaining confirmed Studio success',async()=>{
 const h=harness();try{
  h.change('Stored input');const raw=h.values.get(primary);h.options.getFails=true;await h.submit();h.flush();
  assert.equal(h.values.get(primary),raw);assert.equal(h.removed.length,0);assert.match(h.text(),/Saved successfully/);assert.match(h.text(),/could not be cleared/);
 }finally{h.dispose();}
});

test('same-key draft writes and successful cleanup serialize; pending own write is not mistaken for another tab',async()=>{
 const h=harness();try{
  h.locks.held=true;h.change('Queued and submitted');const pending=h.submit();await h.settle();
  assert.equal(h.lockRequests.length,2);assert(h.lockRequests.every(r=>r.name===`visible-medicine:studio-draft:${JSON.stringify(['v1',recoveryScope.actorId,recoveryScope.organizationId,'new-course'])}`));
  assert.equal(h.values.size,0);h.releaseLock();assert.equal(JSON.parse(h.values.get(primary)!).title,'Queued and submitted');
  h.releaseLock();await pending;h.flush();assert.equal(h.values.size,0);assert.match(h.text(),/Saved successfully/);assert.doesNotMatch(h.text(),/different device-local draft/);
 }finally{h.dispose();}
});

test('queued writes discard older revisions; new edits while cleanup waits keep their draft and warning',async()=>{
 const h=harness();try{
  h.locks.held=true;h.change('Old');h.change('Current');h.releaseLock();assert.equal(h.values.size,0);h.releaseLock();assert.equal(JSON.parse(h.values.get(primary)!).title,'Current');
  const pending=h.submit();await h.settle();assert.equal(h.lockRequests.length,1);
  h.change('Newer than submission');h.releaseLock();await pending;h.flush();assert.equal(h.removed.length,0);assert.match(h.text(),/Newer changes are still unsent/);
  // Success re-snapshots newer input with any advanced hidden comparison
  // fields. The superseded queued write stays inert; the latest one persists.
  assert.equal(h.lockRequests.length,2);
  h.releaseLock();assert.equal(JSON.parse(h.values.get(primary)!).title,'Current');
  h.releaseLock();assert.equal(JSON.parse(h.values.get(primary)!).title,'Newer than submission');assert.equal(h.listeners.size,1);
 }finally{h.dispose();}
});

test('without browser locks local writes and cleanup fail closed while Studio saving remains available',async()=>{
 const h=harness({raw:'{"title":"Retained draft"}'});try{
  h.browserNavigator.locks=undefined;h.change('Unsent current');await h.settle();
  assert.equal(h.values.get(primary),'{"title":"Retained draft"}');assert.match(h.text(),/storage is unavailable/);assert.equal(h.listeners.size,1);
  await h.submit();h.flush();assert.equal(h.values.get(primary),'{"title":"Retained draft"}');assert.equal(h.removed.length,0);assert.match(h.text(),/Saved successfully/);assert.match(h.text(),/could not be cleared/);
 }finally{h.dispose();}
});

test('unmount retires queued draft writes before they acquire a lock',()=>{
 const h=harness();h.locks.held=true;h.change('Queued old page');h.dispose();h.releaseLock();
 assert.equal(h.values.size,0);assert.equal(h.removed.length,0);
});

for(const replace of [false,true])test(`unmounted create does not clean submitted or newer device bytes: ${replace}`,async()=>{
 let saved!:()=>void;
 const h=harness({onSubmit:()=>new Promise<void>(resolve=>{saved=resolve;})});
 try{
  h.change('Submitted create');h.locks.held=true;const pending=h.submit();h.unmount();
  if(replace)h.values.set(primary,'{"title":"New page draft"}');
  saved();await h.settle();assert.equal(h.lockRequests.length,0);await pending;
  assert.equal(h.values.get(primary),replace?'{"title":"New page draft"}':JSON.stringify({title:'Submitted create'}));assert.equal(h.writesAfterUnmount,0);
 }finally{h.dispose();}
});

test('a new edit clears the previous saved confirmation', async () => {
  const h = harness();
  try {h.change('Saved revision'); await h.submit(); h.flush(); assert.match(h.text(), /Saved successfully/); h.change('Unsent revision'); assert.doesNotMatch(h.text(), /Saved successfully/); assert.match(h.text(), /Unsubmitted changes/);} finally {h.dispose();}
});

test('pending save disables fieldset and duplicate submission; newer queued changes survive success', async () => {
  let finish!: () => void, calls = 0, submittedTitle: unknown;
  const h = harness({onSubmit: async form => {calls++; submittedTitle = form.get('title'); await new Promise<void>(resolve => {finish = resolve;});}});
  try {h.change('Submitted snapshot'); const pending = h.submit(); h.flush(); assert.equal(h.find(node => node.type === 'fieldset')?.props.disabled, true); assert.equal(h.find(node => node.type === 'button')?.props.disabled, true); await h.submit(); assert.equal(calls, 1); h.change('Newer queued input'); finish(); await pending; h.flush(); assert.equal(submittedTitle, 'Submitted snapshot'); assert.equal(JSON.parse(h.values.get(primary)!).title, 'Newer queued input'); assert.equal(h.removed.length, 0); assert.equal(h.listeners.size, 1); assert.match(h.text(), /Newer changes are still unsent/); assert.equal(h.find(node => node.type === 'fieldset')?.props.disabled, false);} finally {h.dispose();}
});

test('draft recovery status reports only generic committed recovery, not draft fields',()=>{
 const states:string[]=[],h=harness({raw:JSON.stringify({title:'PRIVATE DRAFT TEXT'}),onDraftRecoveryChange:state=>states.push(state)});
 try{h.runTimers();assert.deepEqual(states,['none','recovered']);assert.equal(h.controls[0].value,'PRIVATE DRAFT TEXT');assert(!JSON.stringify(states).includes('PRIVATE'));assert.equal(h.removed.length,0);}finally{h.dispose();}
});

test('draft recovery status distinguishes absence and unreadable recovery without deleting bytes',()=>{
 for(const raw of [undefined,'invalid json']){const states:string[]=[],h=harness({raw,onDraftRecoveryChange:state=>states.push(state)});
  try{h.runTimers();assert.deepEqual(states,raw===undefined?['none']:['none','attention']);assert.equal(h.controls[0].value,'');assert.equal(h.values.get(primary),raw);assert.equal(h.removed.length,0);}finally{h.dispose();}
 }
});

test('draft recovery status survives failed save and clears only after exact successful save',async()=>{
 let fail=true;const states:string[]=[],h=harness({raw:'{"title":"Recovered"}',onDraftRecoveryChange:state=>states.push(state),onSubmit:async()=>{if(fail)throw Error('Synthetic refused save');}});
 try{h.runTimers();await h.submit();h.flush();assert.equal(states.at(-1),'recovered');assert.equal(h.values.get(primary),'{"title":"Recovered"}');fail=false;await h.submit();h.flush();assert.equal(states.at(-1),'none');assert.equal(h.values.size,0);}finally{h.dispose();}
});

test('draft recovery status retains newer edits and reports retained cleanup conflict without exposing bytes',async()=>{
 for(const newer of [true,false]){let complete!:()=>void;const states:string[]=[],h=harness({raw:'{"title":"Recovered"}',onDraftRecoveryChange:state=>states.push(state),onSubmit:()=>new Promise<void>(resolve=>{complete=resolve;})});
  try{h.runTimers();const pending=h.submit();if(newer)h.change('Newer input');else h.values.set(primary,'{"title":"Other tab"}');complete();await pending;h.flush();assert.equal(states.at(-1),newer?'recovered':'attention');assert.equal(h.controls[0].value,newer?'Newer input':'Recovered');assert(!JSON.stringify(states).includes('input'));}finally{h.dispose();}
 }
});

test('draft recovery status cannot publish a stale successful save after form unmount',async()=>{
 let complete!:()=>void;const states:string[]=[],h=harness({raw:'{"title":"Recovered"}',onDraftRecoveryChange:state=>states.push(state),onSubmit:()=>new Promise<void>(resolve=>{complete=resolve;})});
 try{h.runTimers();const pending=h.submit();h.unmount();const before=[...states];complete();await pending;assert.deepEqual(states,before);assert.equal(h.writesAfterUnmount,0);}finally{h.dispose();}
});

test('draft recovery status timers cannot resurrect recovery or attention after an exact successful save',async()=>{
 for(const raw of ['{"title":"Recovered"}','invalid json']){const states:string[]=[],h=harness({raw,onDraftRecoveryChange:state=>states.push(state)});
  try{
   await h.submit();h.flush();const retained=raw==='invalid json';
   assert.equal(states.at(-1),retained?'attention':'none');const committed=[...states];
   h.runTimers();assert.deepEqual(states,committed,'stale timers cannot publish another recovery status');
   assert.equal(h.values.get(primary),retained?raw:undefined);assert.doesNotMatch(h.text(),/Recovered an unsent/);assert.match(h.text(),/Saved successfully/);
  }finally{h.dispose();}
 }
});

test('draft recovery refuses incompatible retained fields before applying any value',()=>{
 const raw=JSON.stringify({title:'Retained synthetic title',code:['incompatible scalar value']});
 const states:string[]=[],recovered:unknown[]=[];
 const h=harness({raw,controls:[new Input('title','Current title'),new Input('code','Current code')],onDraftRecoveryChange:state=>states.push(state),onValuesChange:(_form,saved)=>recovered.push(saved)});
 try{
  h.runTimers();assert.deepEqual(h.controls.map(control=>control.value),['Current title','Current code']);
  assert.deepEqual(recovered,[]);assert.deepEqual(states,['none','attention']);
  assert.equal(h.values.get(primary),raw);assert.equal(h.removed.length,0);assert.equal(h.listeners.size,0);
  assert.doesNotMatch(h.text(),/Recovered an unsent/);assert.match(h.text(),/could not be recovered/);
 }finally{h.dispose();}
});

test('unrecoverable scoped bytes remain intact while editing and saving',async()=>{
 for(const raw of ['invalid json','{"title":["unsupported scalar array"]}','{"unknownField":"Unmatched synthetic draft"}']){
  const states:string[]=[],h=harness({raw,controls:[new Input('title','Current input')],onDraftRecoveryChange:state=>states.push(state)});
  try{
   h.runTimers();assert.equal(h.controls[0].value,'Current input');assert.equal(states.at(-1),'attention');
   h.change('New synthetic edit');await h.settle();assert.equal(h.values.get(primary),raw);assert.equal(h.values.size,1);
   assert.equal(h.controls[0].value,'New synthetic edit');assert.equal(h.listeners.size,1);
   assert.match(h.text(),/not saved on this device/);assert.doesNotMatch(h.text(),/Unsubmitted changes saved on this device only/);
   await h.submit();h.flush();assert.match(h.text(),/Saved successfully/);assert.equal(h.values.get(primary),raw);
   assert.equal(h.values.size,1);assert.equal(h.removed.length,0);assert.equal(h.listeners.size,0);assert.equal(states.at(-1),'attention');
  }finally{h.dispose();}
 }
});

test('unscoped historical primary and legacy bytes are not read, restored or deleted',async()=>{
 for(const raw of ['invalid json','{"title":"Unknown author"}']){
  const h=harness({unscopedRaw:raw,legacyRaw:raw,controls:[new Input('title','Current input')]});
  try{
   assert.equal(h.controls[0].value,'Current input');assert(!h.reads.includes(unscopedPrimary));assert(!h.reads.includes(legacy));
   h.change('New scoped edit');await h.settle();assert.equal(h.values.get(unscopedPrimary),raw);assert.equal(h.values.get(legacy),raw);
   assert.equal(JSON.parse(h.values.get(primary)!).title,'New scoped edit');
   await h.submit();h.flush();assert.deepEqual(h.removed,[primary]);assert.equal(h.values.get(unscopedPrimary),raw);assert.equal(h.values.get(legacy),raw);
  }finally{h.dispose();}
 }
});

test('draft recovery keeps an unused legacy namespace after exact successful save',async()=>{
 for(const legacyRaw of ['{"title":"Different synthetic legacy draft"}','invalid legacy json']){
  const h=harness({raw:'{"title":"Selected current draft"}',legacyRaw});
  try{
   h.runTimers();assert.equal(h.controls[0].value,'Selected current draft');h.change('Submitted current draft');await h.submit();h.flush();
   assert.match(h.text(),/Saved successfully/);assert.equal(h.values.has(primary),false);
   assert.equal(h.values.get(legacy),legacyRaw);assert(!h.removed.includes(legacy));
   assert.doesNotMatch(h.text(),/different device-local draft was kept/);assert(!h.reads.includes(legacy));
  }finally{h.dispose();}
 }
});

test('draft recovery retires scoped bytes but preserves byte-identical unscoped legacy copies',async()=>{
 const raw='{"title":"Same synthetic draft"}',h=harness({raw,legacyRaw:raw});
 try{h.runTimers();await h.submit();h.flush();assert.equal(h.values.get(primary),undefined);assert.equal(h.values.get(legacy),raw);assert.deepEqual(h.removed,[primary]);assert.match(h.text(),/Saved successfully/);assert(!h.reads.includes(legacy));}finally{h.dispose();}
});
