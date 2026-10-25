// Synthetic SQL evidence only: load the actual authorizer and declared DDL.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
const root=path.resolve(process.env.VM_ATLAS_ACCESS_SQL_ROOT??fileURLToPath(new URL('../',import.meta.url)));
const require=createRequire(path.join(root,'package.json')),ts=require('typescript');
assert.equal(ts.version,'5.9.3','Pinned schema parser');
const sha=b=>createHash('sha256').update(b).digest('hex');
const pins={
 'lib/atlas-delivery-access.ts':'9132a02889576aa2639e3429699ab059cb58d7a093b01fb1913058f728b18582',
 'lib/atlas-model-storage.ts':'7fa1b566184443fe4ac527eb24a4f7785887e6f123dc073c1670a9a160ddc79a',
 'lib/atlas-delivery-policy.ts':'abb153d0050ee101d07ce5eb0938e122a3602ac91f3a76a977c87991be9c34ba',
 'db/bootstrap.ts':'978520337570733343c8f669e6f38d1d5887222db1c06987ee484e99835a664b',
};
const text={};for(const [name,expected]of Object.entries(pins)){const bytes=fs.readFileSync(path.join(root,name));assert.equal(sha(bytes),expected,'Actual source bytes: '+name);text[name]=bytes.toString('utf8');}
const platform=fs.readFileSync(path.join(root,'db/platform.ts'),'utf8');
const parse=(name,source)=>ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const platformTree=parse('platform.ts',platform),ensure=platformTree.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='ensurePlatformSchema');assert(ensure);
const ast=ts.createPrinter({removeComments:true,newLine:ts.NewLineKind.LineFeed}).printNode(ts.EmitHint.Unspecified,ensure,platformTree);
assert.equal(sha(ast),'c20018dcdc879c8ec1545f9bef2854a54f28e1c0e78606a38123fd0a9a5a9057','Actual ensurePlatformSchema AST; unrelated entitlement function edits cannot alter declared schema');
const tableNames=['users','account_security_profiles','courses','enrolments','organizations','organization_memberships','organization_entitlements'];
const ddl=new Map();
function collect(node,allowed){if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)){const sql=node.text,match=sql.match(/^CREATE TABLE IF NOT EXISTS ([a-z_]+) /);if(match&&allowed.includes(match[1])){assert(!ddl.has(match[1]),'One actual declaration per selected table');ddl.set(match[1],sql);}}ts.forEachChild(node,child=>collect(child,allowed));}
collect(parse('bootstrap.ts',text['db/bootstrap.ts']),tableNames.slice(0,4));collect(ensure,tableNames.slice(4));assert.deepEqual([...ddl.keys()].sort(),[...tableNames].sort());
export const schemaEvidence=Object.freeze({tableNames:[...tableNames],ddlSha256:sha(JSON.stringify(tableNames.map(name=>[name,ddl.get(name)]))),platformAstSha256:sha(ast),platformWholeSourceObservedSha256:sha(platform),sourcePins:pins});
const access=await import(pathToFileURL(path.join(root,'lib/atlas-delivery-access.ts')).href);
const policy=await import(pathToFileURL(path.join(root,'lib/atlas-delivery-policy.ts')).href);
export const authorizeAtlasDelivery=access.authorizeAtlasDelivery;
export const actualPolicy=policy.ATLAS_DELIVERY_POLICY;
export const clock=new Date('2026-10-25T12:00:00.000Z');
const iso=clock.toISOString();
export function createSqlFixture(config={}){
 const subject=config.subject??'synthetic-learner',userId='edu:'+subject,database=new DatabaseSync(':memory:');
 for(const name of tableNames)database.exec(ddl.get(name));
 const insert=(table,values)=>{const names=Object.keys(values);database.prepare('INSERT INTO '+table+' ('+names.join(',')+') VALUES ('+names.map(()=>'?').join(',')+')').run(...Object.values(values));};
 insert('users',{id:userId,external_subject:config.externalSubject??'sites:'+subject,email:'synthetic@example.invalid',display_name:'Synthetic SQL fixture',roles:config.roles??'learner',created_at:iso,last_seen_at:iso});
 if(config.profile!==false)insert('account_security_profiles',{user_id:userId,status:config.accountStatus??'active',identity_provider:'synthetic',registered_at:iso,last_authenticated_at:iso,terms_version:'synthetic',privacy_version:'synthetic',updated_at:iso});
 const organizations=config.organizations??[{id:'synthetic-org',status:'active'}];
 for(const org of organizations)insert('organizations',{id:org.id,slug:org.id,name:'Synthetic organization',kind:'institution',status:org.status,created_at:iso});
 const memberships=config.memberships??[{organization_id:'synthetic-org',status:'active'}];
 for(const member of memberships)insert('organization_memberships',{organization_id:member.organization_id,user_id:userId,role:'learner',status:member.status,joined_at:iso});
 const entitlements=config.entitlements??[{organization_id:'synthetic-org',atlas_access:1,studio_access:0,status:'active',valid_until:null}];
 for(const ent of entitlements)insert('organization_entitlements',{organization_id:ent.organization_id,plan:'synthetic',learner_limit:1,educator_limit:0,storage_bytes:0,atlas_access:ent.atlas_access,studio_access:ent.studio_access??0,reporting_access:0,embeds_access:0,status:ent.status,valid_until:ent.valid_until,version:1,updated_at:iso});
 if(config.lecture){insert('courses',{id:'synthetic-lecture',code:'synthetic-paid',title:'Synthetic lecture',description:'No real content',status:'published'});insert('enrolments',{id:'synthetic-enrolment',user_id:userId,course_id:'synthetic-lecture',status:'active',enrolled_at:iso});}
 const sessions=[],queries=[];
 const session=Object.freeze({prepare(sql){assert.match(sql,/^\s*SELECT\b/i,'Authorizer cannot provision or write');queries.push(sql);const statement=database.prepare(sql);return {bind(...values){return {async first(column){const row=statement.get(...values);return column?(row?.[column]??null):(row??null);}};}};}});
 const db=new Proxy(Object.freeze({withSession(mode){sessions.push(mode);assert.equal(mode,'first-primary');return session;}}),{get(target,key){assert.equal(key,'withSession','No direct database operations, provisioning or batch');return target[key];}});
 const snapshot=()=>JSON.stringify(tableNames.map(name=>[name,database.prepare('SELECT * FROM '+name+' ORDER BY rowid').all()]));
 const schema=()=>JSON.stringify(database.prepare("SELECT type,name,sql FROM sqlite_master ORDER BY type,name").all());
 let original=snapshot(),originalSchema=schema(),changes=database.prepare('SELECT total_changes() AS n').get().n;
 database.exec('PRAGMA query_only=ON');
 return {subject,db,sessions,queries,arrangeMembershipStatus(status){database.exec('PRAGMA query_only=OFF');database.prepare('UPDATE organization_memberships SET status=? WHERE user_id=?').run(status,userId);original=snapshot();originalSchema=schema();changes=database.prepare('SELECT total_changes() AS n').get().n;database.exec('PRAGMA query_only=ON');},verify(){assert.equal(snapshot(),original,'No row changes or implicit provisioning');assert.equal(schema(),originalSchema,'No schema changes');assert.equal(database.prepare('SELECT total_changes() AS n').get().n,changes,'No writes');},close(){database.close();}};
}