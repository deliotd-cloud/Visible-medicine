import test from 'node:test';
import {runOriginalNoticeRole} from './viewer-notice-roles.mjs';

test('complete original three-case original notice digest controls executes in its exact context',async()=>{
  await runOriginalNoticeRole('guard');
});
