import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  contentValidator,
} from './content-contract-tools.mjs';

const args = process.argv.slice(2);
assert(
  args.every((arg) =>
    ['--scope=shoulder', '--scope=body', '--check'].includes(arg),
  ),
  'Unknown export argument',
);
assert(
  args.filter((arg) => arg.startsWith('--scope=')).length <= 1,
  'Choose one export scope',
);
const scope = args.includes('--scope=body') ? 'body' : 'shoulder';
const context = await contentContext();
const records = context[scope];
const validate = await contentValidator(context.registry);
for (const record of records) validate(record);
const output = JSON.stringify(records, null, 2) + '\n';
const target = new URL(`content/exports/${scope}.v2.json`, contentRoot);
if (args.includes('--check')) {
  assert.equal(
    (await readFile(target, 'utf8')).replace(/\r\n/g, '\n'),
    output,
    'Content export is stale',
  );
} else {
  await mkdir(new URL('content/exports/', contentRoot), { recursive: true });
  await writeFile(target, output);
}
console.log(
  `${scope}: ${records.length} draft records with complete source bindings; no clinical approvals, studies or DB writes.`,
);
