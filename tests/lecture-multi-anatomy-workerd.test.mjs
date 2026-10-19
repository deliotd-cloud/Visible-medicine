import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
const source=readFileSync(new URL('../lib/lecture-related-repository.ts',import.meta.url),'utf8');
const parsed=ts.createSourceFile('lecture-related-repository.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);

function candidateSql(){
  const matches=[];
  const visit=node=>{
    if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&
      node.expression.name.text==='prepare'&&node.arguments.length===1&&
      ts.isNoSubstitutionTemplateLiteral(node.arguments[0])){
      const sql=node.arguments[0].text;
      if(sql.startsWith('SELECT w.id')&&sql.includes('json_each'))matches.push(sql);
    }
    ts.forEachChild(node,visit);
  };
  visit(parsed);
  assert.equal(matches.length,1,'one actual coarse candidate query must be extracted');
  const sql=matches[0];
  assert.equal((sql.match(/\?/g)??[]).length,7,'preserve the seven bound values');
  assert.match(sql,/SELECT w\.id\s+FROM workbooks w/);
  assert.doesNotMatch(sql,/SELECT\s+\*/i);
  return sql;
}

const sql=candidateSql();
console.log(JSON.stringify({sourceSha256:createHash('sha256').update(source).digest('hex'),
  mode:'actual coarse SQL in isolated local workerd D1; synthetic candidate IDs only, no publication or access authority'}));

test('local workerd D1 executes plural and legacy coarse matching with bounded access predicates',{timeout:30000},async()=>{
  const options={name:'synthetic-lecture-coarse',modules:true,
    script:'export default {fetch(){return new Response("synthetic");}}',
    compatibilityDate:'2026-08-23',host:'127.0.0.1',port:0,
    d1Databases:{DB:'synthetic-lecture-coarse-only'},d1Persist:false};
  const mf=new Miniflare({...convertV4MiniflareOptions(options),telemetry:{enabled:false}});
  try{
    const db=await mf.getD1Database('DB');
    await db.batch([
      'CREATE TABLE workbooks(id TEXT PRIMARY KEY,module_id TEXT,mode TEXT,version INTEGER,status TEXT)',
      'CREATE TABLE modules(id TEXT PRIMARY KEY,course_id TEXT)',
      'CREATE TABLE lecture_versions(workbook_id TEXT,version INTEGER,manifest_json TEXT)',
      'CREATE TABLE workbook_assignments(workbook_id TEXT,learner_id TEXT,status TEXT)',
      'CREATE TABLE enrolments(course_id TEXT,user_id TEXT,status TEXT)',
      'CREATE TABLE cohort_workbook_assignments(workbook_id TEXT,cohort_id TEXT,status TEXT)',
      'CREATE TABLE cohort_members(cohort_id TEXT,learner_id TEXT,status TEXT)',
      'CREATE TABLE cohorts(id TEXT PRIMARY KEY,course_id TEXT,status TEXT)',
      'CREATE TABLE course_ownership(course_id TEXT,organization_id TEXT)',
    ].map(statement=>db.prepare(statement)));
    await db.prepare('INSERT INTO modules VALUES (?,?)').bind('module-own','course-own').run();
    await db.prepare('INSERT INTO modules VALUES (?,?)').bind('module-foreign','course-foreign').run();
    await db.prepare('INSERT INTO course_ownership VALUES (?,?)').bind('course-own','org-own').run();
    await db.prepare('INSERT INTO course_ownership VALUES (?,?)').bind('course-foreign','org-foreign').run();
    await db.prepare('INSERT INTO enrolments VALUES (?,?,?)').bind('course-own','learner','active').run();

    const conceptId='synthetic-pons',headRevision='a'.repeat(64);
    const target={conceptId,headRevision};
    const other={conceptId:'synthetic-other',headRevision};
    const slides=value=>JSON.stringify({slides:value});
    const add=async(id,manifestJson,{module='module-own',assignment=true,status='published'}={})=>{
      await db.prepare('INSERT INTO workbooks VALUES (?,?,?,?,?)').bind(id,module,'lecture',2,status).run();
      await db.prepare('INSERT INTO lecture_versions VALUES (?,?,?)').bind(id,2,manifestJson).run();
      if(assignment)await db.prepare('INSERT INTO workbook_assignments VALUES (?,?,?)').bind(id,'learner','active').run();
    };
    await add('01-plural-secondary',slides([{anatomyReferences:[other,target]}]));
    await add('02-legacy',slides([{anatomyReference:target}]));
    await add('03-malformed-json','{ malformed');
    await add('04-scalar',slides([{anatomyReferences:'bad'}]));
    await add('05-null',slides([{anatomyReferences:null}]));
    await add('06-malformed-collection',slides([{anatomyReferences:[null,'bad',7,{conceptId:'other',headRevision}]}]));
    await add('07-foreign',slides([{anatomyReferences:[target]}]),{module:'module-foreign'});
    await add('08-unallocated',slides([{anatomyReferences:[target]}]),{assignment:false});
    await add('09-unpublished',slides([{anatomyReferences:[target]}]),{status:'draft'});
    const query=async({user='learner',org=null,limit=17,offset=0}={})=>
      (await db.prepare(sql).bind(user,user,org,conceptId,headRevision,limit,offset).all()).results.map(row=>row.id);
    assert.deepEqual(await query(),['01-plural-secondary','02-legacy']);
    assert.deepEqual(await query({user:'staff',org:'org-foreign'}),['07-foreign']);
    assert.deepEqual(await query({user:'staff',org:'org-own'}),
      ['01-plural-secondary','02-legacy','08-unallocated']);
    await db.prepare('UPDATE enrolments SET status=? WHERE user_id=?').bind('withdrawn','learner').run();
    assert.deepEqual(await query(),[]);
    await db.prepare('UPDATE enrolments SET status=? WHERE user_id=?').bind('active','learner').run();

    for(let number=10;number<28;number++)await add(`${number}-plural`,slides([{anatomyReferences:[other,target]}]));
    const firstPage=await query();
    const secondPage=await query({offset:16});
    assert.equal(firstPage.length,17,'one extra candidate is fetched beyond the 16 item group');
    assert.equal(secondPage[0],firstPage[16],'offset remains candidate based');
    assert.deepEqual([...new Set([...firstPage.slice(0,16),...secondPage])],
      ['01-plural-secondary','02-legacy',...Array.from({length:18},(_,index)=>`${index+10}-plural`)]);
  }finally{await mf.dispose();}
});
