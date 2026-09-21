import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {LECTURE_SCHEMA} from "../db/lecture.ts";

test("lecture migration preserves existing data and bootstrap matches additive schema",()=>{
  const db=new DatabaseSync(":memory:");const fresh=new DatabaseSync(":memory:");
  try {
    db.exec("PRAGMA foreign_keys=ON");
    const directory=new URL("../drizzle/",import.meta.url);
    const files=readdirSync(directory).filter(name=>name.endsWith(".sql")).sort();
    for(const file of files.filter(name=>!name.startsWith("0007_"))) {
      const previous=readFileSync(new URL(file,directory),"utf8"); db.exec(previous);fresh.exec(previous);
    }
    db.exec(`INSERT INTO users VALUES('test-author','test-subject','author@example.invalid','Test author','instructor','2026-09-21','2026-09-21');
      INSERT INTO courses VALUES('test-course','TEST','Synthetic course','No clinical content','draft');
      INSERT INTO modules VALUES('test-module','test-course','Content',1);
      INSERT INTO workbooks VALUES('test-workbook','test-module','Existing assessment','assessment',1,'draft',60,0);`);
    const before=db.prepare("SELECT * FROM workbooks").all();
    const migration=files.find(name=>name.startsWith("0007_"));assert.ok(migration);
    const sql=readFileSync(new URL(migration,directory),"utf8");
    assert.doesNotMatch(sql,/\b(?:DROP|DELETE|UPDATE|ALTER)\b(?! no action)/i);
    db.exec(sql);
    const shape=(name:string)=>db.prepare(`PRAGMA table_info(${name})`).all();
    const names=["lecture_drafts","lecture_reviews","lecture_versions"];
    const migrated=names.map(shape);
    for(const statement of LECTURE_SCHEMA)fresh.exec(statement);
    assert.deepEqual(names.map(name=>fresh.prepare(`PRAGMA table_info(${name})`).all()),migrated);
    for(const statement of LECTURE_SCHEMA)db.exec(statement);
    assert.deepEqual(names.map(shape),migrated);
    assert.deepEqual(db.prepare("SELECT * FROM workbooks").all(),before);
    for(const name of names)assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM ${name}`).get()?.count,0);
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(),[]);
  } finally {db.close();fresh.close();}
});
