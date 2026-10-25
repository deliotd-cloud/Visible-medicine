import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const BASELINE_SHA256={
  'lib/platform-governance.ts':'d72d61cec8c24e2bf75d4c935401f97ecf4fe1251c5ece4f0fcfbec8a2a2756a',
  'lib/institution-operations.ts':'ccedc7376884fa89c6ad9fbece3ed95eca6c86c910961a50e7e11869c721a836',
};
export const CANDIDATE_SHA256={
  'lib/platform-governance.ts':'8310baceef6ed1ba25f0f2ace1d1e511fce22f7f4502904199168ca1a39d44cf',
  'lib/institution-operations.ts':'a89425f4404b977bb9e124a3e3c29caddf501350bdca0afca52c9427a04a2d94',
};
const globalSeams=[
  ["export async function validateEmbedLaunch(tokenValue: unknown, parentOriginValue: unknown) {\r\n  await ensureDatabase();\r\n  await ensurePlatformSchema();",
   "export async function validateEmbedLaunch(tokenValue: unknown, parentOriginValue: unknown) {\r\n  await ensurePlatformSchema();"],
  ["export async function verifyCertificate(codeValue: unknown) {\r\n  await ensureDatabase();\r\n  await ensurePlatformSchema();",
   "export async function verifyCertificate(codeValue: unknown) {\r\n  await ensurePlatformSchema();"],
];
const institutionSeams=[
  ['import { appendAudit, ensureDatabase, ensureEducationUser } from "@/db/bootstrap";',
   'import { appendAudit, ensureEducationUser } from "@/db/bootstrap";'],
  ['    throw new InstitutionOperationsError("Rate limit configuration is invalid.", 500);\n  await ensureDatabase();\n  await ensurePlatformSchema();',
   '    throw new InstitutionOperationsError("Rate limit configuration is invalid.", 500);\n  await ensurePlatformSchema();'],
  ['export async function submitPilotApplication(auth: AuthContext | null, input: Record<string, unknown>) {\r\n  await ensureDatabase();\r\n  await ensurePlatformSchema();',
   'export async function submitPilotApplication(auth: AuthContext | null, input: Record<string, unknown>) {\r\n  await ensurePlatformSchema();'],
];
export function invertGuestCorePrerequisites(source,path){
  assert.equal(typeof source,'string');
  assert(Object.hasOwn(BASELINE_SHA256,path),'unknown source path');
  let inverse=source;
  for(const [after,before] of path==='lib/platform-governance.ts'?globalSeams:institutionSeams){
    assert.equal(inverse.split(after).length,2,'missing or duplicated exact guest core seam');
    inverse=inverse.replace(after,before);
  }
  assert.equal(createHash('sha256').update(inverse).digest('hex'),BASELINE_SHA256[path],
    'platform source outside the two approved seams changed');
  return inverse;
}
