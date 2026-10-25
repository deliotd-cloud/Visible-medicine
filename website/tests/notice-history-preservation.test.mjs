import test from 'node:test';
import {runOriginalNoticeRole} from './viewer-notice-roles.mjs';

test('complete original one-case ced5/affc notice-admission theorem executes in its exact context',async()=>{
  await runOriginalNoticeRole('admission');
});
