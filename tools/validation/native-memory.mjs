import assert from 'node:assert/strict';import {freemem} from 'node:os';
export function wholeMiB(bytes){
  assert(Number.isSafeInteger(bytes)&&bytes>=0,'Require a valid non-negative physical-memory byte count');
  return Math.floor(bytes/1048576);
}
export function availablePhysicalMiB({readBytes=freemem,platform=process.platform}={}){
  assert.equal(platform,'win32','This admission probe is verified for Windows');
  return wholeMiB(readBytes());
}
