// Pure coordination: callers own the child process, source checks, receipts, and durable storage.
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const message = error => error instanceof Error ? error.message : String(error);

export async function runController({steps, fingerprint, verifySource, execute, validateReceipt, loadState, writeState, now = () => new Date().toISOString()}) {
  if (!Array.isArray(steps) || steps.length === 0 || steps.some(id => typeof id !== 'string' || !id) || new Set(steps).size !== steps.length) throw new Error('Require unique, ordered step ids');
  if (typeof fingerprint !== 'string' || !fingerprint) throw new Error('Require a source fingerprint');
  for (const [name, adapter] of Object.entries({verifySource, execute, validateReceipt, loadState, writeState})) {
    if (typeof adapter !== 'function') throw new Error(`Missing ${name} adapter`);
  }
  const prior = await loadState();
  let state;
  if (prior != null) {
    if (prior.schema !== 'vm-sequential-verification/1' || prior.fingerprint !== fingerprint || JSON.stringify(prior.steps) !== JSON.stringify(steps)) throw new Error('Saved source fingerprint or ordered step plan differs');
    if (!prior.terminal || !['passed', 'deferred'].includes(prior.status)) throw new Error('Saved state is nonterminal or failed; inspect it before resuming');
    if (!Array.isArray(prior.completed) || prior.completed.length > steps.length || prior.completed.some((item, index) => item?.id !== steps[index] || !own(item, 'receipt'))) throw new Error('Saved completed steps are not an exact prefix');
    if (prior.status === 'passed' && (prior.completed.length !== steps.length || prior.current !== null)) throw new Error('Invalid passed state');
    if (prior.status === 'deferred' && (prior.completed.length === steps.length || prior.current?.id !== steps[prior.completed.length])) throw new Error('Invalid deferred state');
    state = structuredClone(prior);
  } else {
    state = {schema:'vm-sequential-verification/1', fingerprint, steps:[...steps], completed:[], current:null, terminal:false, status:'running', updatedAt:now()};
    await writeState(structuredClone(state));
  }
  const save = async () => { state.updatedAt = now(); await writeState(structuredClone(state)); };
  const sourceCheck = async () => { if (await verifySource(fingerprint) !== fingerprint) throw new Error('Source drift'); };
  const finish = async (status, error) => { state.terminal = true; state.status = status; state.error = error; await save(); return structuredClone(state); };
  try {
    await sourceCheck();
    for (const item of state.completed) {
      if (await validateReceipt(item.id, item.receipt, fingerprint) !== true) throw new Error(`Saved receipt invalid: ${item.id}`);
    }
    if (state.status === 'passed') return structuredClone(state);
  } catch (error) {
    state.current ??= {id:steps[state.completed.length], phase:'resume-check'};
    return finish('failed', message(error));
  }
  for (let index = state.completed.length; index < steps.length; index++) {
    const id = steps[index];
    state.terminal = false; state.status = 'running'; state.current = {id, phase:'source-before', startedAt:now()}; delete state.error;
    await save();
    try {
      await sourceCheck();
      state.current.phase = 'child'; await save();
      let result;
      try { result = await execute(id, fingerprint); }
      catch (error) {
        await sourceCheck();
        if (error?.code === 'ADMISSION_DEFERRED') return finish('deferred', message(error));
        throw error;
      }
      state.current.phase = 'source-after'; await save();
      await sourceCheck();
      if (result?.kind === 'deferred') return finish('deferred', result.reason ?? 'Admission deferred');
      if (result?.code !== 0 || result.signal || result.error) throw new Error(`Child did not pass: ${id}`);
      state.current.phase = 'receipt'; await save();
      if (!own(result, 'receipt') || await validateReceipt(id, result.receipt, fingerprint) !== true) throw new Error(`Receipt invalid: ${id}`);
      state.completed.push({id, receipt:result.receipt}); state.current = null; await save();
    } catch (error) { return finish('failed', message(error)); }
  }
  return finish('passed', undefined);
}
