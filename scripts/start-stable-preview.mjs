// Same-process CLI handoff keeps the normal Vinext lock and shutdown behavior.
// No shell, extra arguments, dependency installation or authentication changes.
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

if (process.argv.length !== 2) throw new Error('Stable preview accepts no overrides; use loopback port 3000');
const root = fileURLToPath(new URL('../', import.meta.url));
if (resolve(process.cwd()) !== resolve(root)) throw new Error('Run stable preview from the website checkout');
process.env.VM_LOCAL_PREVIEW_STABLE = '1';
const cliUrl = new URL('../node_modules/vinext/dist/cli.js', import.meta.url);
const cli = fileURLToPath(cliUrl);
process.argv = [process.execPath, cli, 'dev', '-H', '127.0.0.1', '-p', '3000'];
console.log('[Visible Medicine] Local manual-reload preview: stop before source imports; restart after verification. Not an immutable snapshot.');
// Import the URL, not the Windows F:\\ path (which ESM reads as an F: scheme).
await import(cliUrl);
