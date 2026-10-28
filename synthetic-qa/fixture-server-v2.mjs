import http from 'node:http';
import { once } from 'node:events';
import { waitAndCloseSyntheticServer } from './synthetic-shutdown-v2.mjs';

const mode = process.argv[2] ?? 'normal';
if (!['normal', 'pre-ended', 'pre-destroyed'].includes(mode)) throw new Error('Bad fixture mode');
const server = http.createServer((_request, response) => response.end('synthetic fixture'));
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const counts = () => ({
  inputDataListeners: process.stdin.listenerCount('data'),
  inputEndListeners: process.stdin.listenerCount('end'),
  inputErrorListeners: process.stdin.listenerCount('error'),
  sigintListeners: process.listenerCount('SIGINT')
});
if (process.send) process.on('message', message => {
  if (message === 'emit-sigint') process.emit('SIGINT');
  if (message === 'emit-input-error') process.stdin.emit('error', new Error('synthetic input failure'));
});
if (mode === 'pre-ended') {
  process.stdin.resume();
  await once(process.stdin, 'end');
} else if (mode === 'pre-destroyed') {
  process.stdin.destroy();
}
console.log(JSON.stringify({ event: 'ready', pid: process.pid, port, tty: Boolean(process.stdin.isTTY), mode, ...counts() }));
try {
  const reason = await waitAndCloseSyntheticServer(server);
  console.log(JSON.stringify({ event: 'closed', reason, pid: process.pid, port, ...counts() }));
} catch (error) {
  console.log(JSON.stringify({ event: 'failed', error: error.message, errorName: error.name,
    listening: server.listening, pid: process.pid, port, ...counts() }));
  process.exitCode = 23;
}
