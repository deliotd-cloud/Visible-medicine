import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const fixture = fileURLToPath(new URL('./fixture-server-v2.mjs', import.meta.url));
const timeoutMs = 5000;
function lineReader(stream) {
  let buffer = '';
  const queue = [];
  const waiting = [];
  stream.on('data', chunk => {
    buffer += chunk;
    for (let index; (index = buffer.indexOf('\n')) !== -1;) {
      const value = JSON.parse(buffer.slice(0, index));
      buffer = buffer.slice(index + 1);
      if (waiting.length) waiting.shift()(value);
      else queue.push(value);
    }
  });
  return () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for fixture output')), timeoutMs);
    waiting.push(value => { clearTimeout(timer); resolve(value); });
  });
}
async function assertPortCanBeRebound(port) {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', resolve);
  });
  await new Promise(resolve => probe.close(resolve));
}
async function exercise(kind) {
  const mode = kind === 'pre-ended' || kind === 'pre-destroyed' ? kind : 'normal';
  const child = spawn(process.execPath, [fixture, mode], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', value => { stderr += value; });
  const nextLine = lineReader(child.stdout);
  const deadline = setTimeout(() => child.kill(), timeoutMs);
  try {
    const exitPromise = once(child, 'exit');
    const readyLine = nextLine();
    if (kind === 'pre-ended') child.stdin.end();
    const ready = await readyLine;
    assert.equal(ready.event, 'ready');
    assert.equal(ready.tty, false);
    const terminalLine = nextLine();
    if (kind === 'q') child.stdin.write('q\n'); // Keep the pipe open.
    else if (kind === 'eof') child.stdin.end();
    else if (kind === 'sigint') child.send('emit-sigint');
    else if (kind === 'input-error') child.send('emit-input-error');
    const terminal = await terminalLine;
    child.disconnect();
    const [code, signal] = await exitPromise;
    assert.equal(signal, null);
    assert.equal(terminal.pid, ready.pid);
    if (kind === 'input-error') {
      assert.equal(terminal.event, 'failed'); // No success receipt on input error.
      assert.equal(terminal.error, 'synthetic input failure');
      assert.equal(terminal.listening, false);
      assert.equal(code, 23, stderr);
    } else {
      assert.equal(terminal.event, 'closed');
      assert.equal(terminal.reason, kind === 'pre-ended' || kind === 'pre-destroyed' ? 'eof' : kind);
      assert.equal(code, 0, stderr);
    }
    for (const field of ['inputDataListeners', 'inputEndListeners', 'inputErrorListeners', 'sigintListeners']) {
      assert.equal(terminal[field], ready[field], `${kind}: ${field}`);
    }
    await assertPortCanBeRebound(ready.port);
    console.log(JSON.stringify({ kind, pid: ready.pid, port: ready.port, exitCode: code, listenerClosed: true }));
  } finally {
    clearTimeout(deadline);
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
}
for (const kind of ['q', 'eof', 'sigint', 'pre-ended', 'pre-destroyed', 'input-error']) await exercise(kind);
