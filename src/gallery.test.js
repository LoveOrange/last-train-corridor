import test from 'node:test';
import assert from 'node:assert/strict';
import {createGallery,normalizeGallery} from './gallery.js';
import {Run,ANOMALIES} from './rules.js';
import {PassageLoop,fromHall,bridgeZ} from './layout.js';

function storage(){const data=new Map(),writes=[];return {data,writes,getItem:key=>data.get(key),setItem(key,value){writes.push(value);data.set(key,value);}};}
const commit=(id,correct=true)=>({type:'commit',result:{correct,anomaly:id?{id}:null}});

test('only committed correct anomalies unlock; failure, normal and preview do not write',async()=>{
  const store=storage(),gallery=await createGallery(store);
  for(const event of [null,commit('eyes',false),commit(null),commit('unknown'),{...commit('eyes'),type:'view'}])await gallery.record(event);
  assert.deepEqual(gallery.ids(),[]);assert.equal(store.writes.length,0);
  await gallery.record(commit('eyes'));await gallery.record(commit('eyes'));
  assert.deepEqual(gallery.ids(),['eyes']);assert.equal(store.writes.length,1);
  await gallery.record(commit('red-lights',false));
  assert.deepEqual((await createGallery(store)).ids(),['eyes']);
});

test('real crossing preserves locked preview until arrival, including reversal and final correct decision',async()=>{
  const store=storage(),gallery=await createGallery(store),run=new Run(()=>.4),loop=new PassageLoop(run);
  run.anomaly=ANOMALIES.find(a=>a.id==='eyes');
  // Returning from the first room crosses boundary -1, then reaches its far landing.
  const x=fromHall(-1,12,0).x,z=bridgeZ(-1);
  await gallery.record(loop.update(x,z+.1));assert.deepEqual(gallery.ids(),[]);
  await gallery.record(loop.update(x,z-.1));assert.deepEqual(gallery.ids(),[]);
  await gallery.record(loop.update(x,z+.1));assert.deepEqual(gallery.ids(),[]);
  await gallery.record(loop.update(x,z+2.1));assert.deepEqual(gallery.ids(),['eyes']);
  loop.reset();assert.deepEqual(gallery.ids(),['eyes']);
  run.progress=7;run.anomaly=ANOMALIES.find(a=>a.id==='red-lights');
  await gallery.record(loop.update(x,z+.1));await gallery.record(loop.update(x,z+2.1));
  assert.equal(run.won,true);assert.deepEqual(gallery.ids(),['eyes','red-lights']);
});

test('rapid discoveries persist in order and reload without duplicates or unknown entries',async()=>{
  const store=storage(),gallery=await createGallery(store);
  await Promise.all(ANOMALIES.map(a=>gallery.record(commit(a.id))));
  assert.equal((await createGallery(store)).ids().length,20);
  assert.deepEqual(normalizeGallery(['eyes','bogus','eyes',null]),['eyes']);
  assert.deepEqual(normalizeGallery({eyes:true}),[]);
});

test('unavailable or corrupt storage keeps a session collection without overwriting unread records',async()=>{
  let writes=0;
  for(const getItem of [()=>{throw Error('blocked');},()=>'{bad json']){
    const gallery=await createGallery({getItem,setItem(){writes++;}});
    await gallery.record(commit('eyes'));assert.deepEqual(gallery.ids(),['eyes']);assert.equal(gallery.saved(),false);
  }
  assert.equal(writes,0);
  const gallery=await createGallery({getItem:()=>null,setItem(){throw Error('quota');}});
  await gallery.record(commit('eyes'));assert.equal(gallery.has('eyes'),true);assert.equal(gallery.saved(),false);
});
