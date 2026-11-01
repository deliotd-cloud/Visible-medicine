import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
test('renderer seal successor retains its full predecessor contract',()=>{
 const old=read("tests/fixtures/current-atlas-delivery-before-renderer-seal.txt");assert.equal(sha(old),"0c01664ba5e7d41c8ac82890561e156c64ba0f6d3da2c4310bad5ec40dc763b5");
 const pin=read("tests/fixtures/current-atlas-delivery-before-renderer-seal.json");assert.equal(sha(pin),"b58f72a9cb55f161280dccfc33f113be4ae78965726f916a93c7539b73623d5a");
 assert.throws(()=>validateCurrentAtlasDelivery({pin:JSON.parse(pin)}));
 const marker="\n\ntest('catalog checkout delivery preserves its full predecessor contract'",parts=read("tests/current-atlas-delivery.test.mjs").toString().split(marker);assert.equal(parts.length,2);
 let prefix=parts[0];for(const [from,to]of [["c881cc45a1b0c0f2f617130738e9b1f2597af54e","0d9750af66d92aa5a421b34ac6d0c8dd3e5bfd66"],["552218b5c8aa9760b6066c5765a2cb2b4edb794e","495d07f5d9aff482dae7c9c30a962acaa7947b50"],["1916","1917"]])prefix=prefix.replaceAll(to,from);
 const from="let restored=read('tests/fixtures/current-atlas-delivery-before-renderer-seal.txt').toString()",to="let restored=read('tests/current-atlas-delivery.test.mjs').toString()";assert.equal(parts[1].split(from).length,2);
 assert.equal(prefix+marker+parts[1].replace(from,to),old.toString());
 assert(currentAtlasDeliveryRoot());
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 const rows=binding.inputs.filter(r=>r.path==='scripts/verify-native-body-renderer-seal.mjs');assert.equal(rows.length,1);assert.equal(rows[0].sha256,sha(read(rows[0].path)));
});
