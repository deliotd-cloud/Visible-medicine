// Pure invocation budget. The controller still owns all source and receipt checks.
export function oneNewStepPerInvocation(execute) {
  if (typeof execute !== 'function') throw new TypeError('Require execute adapter');
  let completedHere = 0;
  return async (id, fingerprint) => {
    if (completedHere >= 1) return {
      kind: 'deferred',
      reason: {kind: 'invocation-step-limit', maxNewSteps: 1, completedHere, nextStep: id},
    };
    const result = await execute(id, fingerprint);
    if (result?.code === 0 && !result.signal && !result.error && result.kind !== 'deferred') completedHere++;
    return result;
  };
}
