/** Wait for q, stdin EOF, or SIGINT, then release all input/signal handles. */
export async function waitForSyntheticStop({ input = process.stdin, signalTarget = process } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (reason, error) => {
      if (settled) return;
      settled = true;
      input.off('data', onData);
      input.off('end', onEnd);
      input.off('error', onError);
      signalTarget.off('SIGINT', onSigint);
      input.pause();
      input.unref?.(); // A resumed Windows pipe may stay referenced after pause().
      if (error) reject(error);
      else resolve(reason);
    };
    const onData = chunk => { if (String(chunk).includes('q')) finish('q'); };
    const onEnd = () => finish('eof');
    const onError = error => finish(undefined, error);
    const onSigint = () => finish('sigint');
    input.on('data', onData);
    input.once('end', onEnd);
    input.once('error', onError);
    signalTarget.once('SIGINT', onSigint);
    if (input.errored) { finish(undefined, input.errored); return; }
    if (input.readableEnded || input.destroyed) { finish('eof'); return; }
    input.resume();
  });
}

/** Close the synthetic HTTP listener before recording a terminal receipt. */
export async function closeSyntheticServer(server) {
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  });
}

/** Always close the listener; keep an input error as the primary failure. */
export async function waitAndCloseSyntheticServer(server, options) {
  let stopError;
  try {
    return await waitForSyntheticStop(options);
  } catch (error) {
    stopError = error;
    throw error;
  } finally {
    try {
      await closeSyntheticServer(server);
    } catch (closeError) {
      if (stopError) {
        throw new AggregateError([stopError, closeError], 'Input and server close both failed', { cause: stopError });
      }
      throw closeError;
    }
  }
}
