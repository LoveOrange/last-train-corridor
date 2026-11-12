import test from 'node:test';
import assert from 'node:assert/strict';
import {Run,ANOMALIES} from './rules.js';
test('normal passage: proceed; anomaly: return; mistakes reset progress',()=>{
  const r=new Run();assert.equal(r.anomaly,null);assert.equal(r.choose('forward').progress,1);
  r.anomaly=ANOMALIES[0];assert.equal(r.choose('back').progress,2);
  assert.equal(r.choose('forward').progress,0);
  r.anomaly=null;assert.equal(r.choose('back').correct,false);
});
test('eight consecutive correct decisions win exactly once and reset permits replay',()=>{
  const r=new Run();for(let i=0;i<7;i++)assert.equal(r.choose('forward').won,false);
  assert.equal(r.choose('forward').won,true);assert.equal(r.choose('forward'),null);
  r.reset();assert.equal(r.progress,0);assert.equal(r.won,false);assert.equal(r.anomaly,null);
});
test('anomaly deck has no repeats before exhausted and ordinary passages remain possible',()=>{
  const r=new Run(()=>0.2);const seen=new Set();for(let i=0;i<ANOMALIES.length;i++){r.next();seen.add(r.anomaly.id);}assert.equal(seen.size,ANOMALIES.length);
  r.random=()=>0.9;r.next();assert.equal(r.anomaly,null);
});

test("at least sixteen unique, described anomalies are available",()=>{assert.ok(ANOMALIES.length>=16);assert.equal(new Set(ANOMALIES.map(a=>a.id)).size,ANOMALIES.length);assert.ok(ANOMALIES.every(a=>a.label));});
