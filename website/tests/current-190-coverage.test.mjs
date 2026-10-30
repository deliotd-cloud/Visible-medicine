import assert from 'node:assert/strict';import test from 'node:test';import fs from 'node:fs';import {createHash} from 'node:crypto';import {runOriginalCoverage} from './coverage-delivery-roles.mjs';
test('complete original four-case6d coverage theorem remains exact at its authentic delivery',()=>{
 const inputs={
  VM_COVERAGE_HISTORICAL_SITE:['F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website',null],
  VM_COVERAGE_HISTORICAL_RECEIPT:['F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/VERIFIED_SOURCE.json','1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3'],
  VM_COVERAGE_485_INDEX:['F:/VisibleMedicine/staging/20261020-combined-website-ui/website/docs/anatomy-coverage/index.json','9020eac8ed2fee77ef04b63357eabd23471f99e3e966d5b2c427010ee3478579'],
 };
 const previous=new Map();try{for(const [name,[historical,expected]] of Object.entries(inputs)){previous.set(name,process.env[name]);const selected=process.env[name]??historical;if(expected)assert.equal(createHash('sha256').update(fs.readFileSync(selected)).digest('hex'),expected,name);process.env[name]=selected;}runOriginalCoverage();}finally{for(const [name,value] of previous){if(value===undefined)delete process.env[name];else process.env[name]=value;}}
});