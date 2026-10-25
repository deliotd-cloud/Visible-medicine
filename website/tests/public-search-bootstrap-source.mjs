import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const ORIGINAL_PLATFORM_SHA256='142458d43a4d0fb095090a971c46450d3faffd271331ce536776fda977a574b0';
const oldImport='import { appendAudit, ensureEducationUser } from "@/db/bootstrap";';
const newImport='import { appendAudit, ensureDatabase, ensureEducationUser } from "@/db/bootstrap";';
const oldCall="export async function searchEducation(queryValue: unknown, kindValue: unknown = 'all') {\r\n  await ensurePlatformSchema();";
const newCall="export async function searchEducation(queryValue: unknown, kindValue: unknown = 'all') {\r\n  await ensureDatabase();\r\n  await ensurePlatformSchema();";

export function invertPublicSearchBootstrap(source){
  assert.equal(typeof source,'string');
  for(const seam of [newImport,newCall])assert.equal(source.split(seam).length,2,`missing or duplicated exact bootstrap seam: ${seam}`);
  const inverse=source.replace(newImport,oldImport).replace(newCall,oldCall);
  assert.equal(createHash('sha256').update(inverse).digest('hex'),ORIGINAL_PLATFORM_SHA256,'platform source outside the two approved seams changed');
  return inverse;
}
