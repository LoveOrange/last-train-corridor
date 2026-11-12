import test from 'node:test';
import assert from 'node:assert/strict';
import {Run,ANOMALIES,failureHint} from './rules.js';
import {PassageLoop,bridgeZ,fromHall,toHall,floorRects,pointOnFloor,canStand,slideMove,BEND_RECTS,bendWalls} from './layout.js';
const red=ANOMALIES.find(a=>a.id==='red-lights');
function approach(loop,step){const b=Math.min(loop.index,loop.index+step),p=fromHall(b,12,-49-step*.05);return loop.update(p.x,p.z);}
function arrive(loop,step){const b=Math.min(loop.index,loop.index+step),p=fromHall(b,12,-49-step*2.05);return loop.update(p.x,p.z);}
function travel(loop,step){approach(loop,step);return arrive(loop,step);}
test('preview is reversible; only arrival at the far numbered landing submits a choice',()=>{
  const run=new Run(()=>.2),loop=new PassageLoop(run);run.anomaly=red;const original=run.capture();
  const view=approach(loop,-1);assert.equal(view.type,'view');assert.deepEqual(run.capture(),original);assert.equal(view.room.progress,1);
  const b=-1;for(let i=0;i<20;i++){let p=fromHall(b,12,-49.05);loop.update(p.x,p.z);p=fromHall(b,12,-48.95);loop.update(p.x,p.z);}
  assert.deepEqual(run.capture(),original);assert.equal(loop.crossings,0);
  const p=fromHall(-1,12,-49.05);loop.update(p.x,p.z);assert.equal(loop.room().anomaly,'red-lights');
  assert.equal(travel(loop,-1).result.correct,true);assert.equal(run.progress,1);assert.equal(run.history.length,1);
});
test('red lights seen immediately after arrival can be escaped with one return',()=>{
  const run=new Run(()=>0),loop=new PassageLoop(run);run.deck=[red];
  travel(loop,1);assert.equal(run.progress,1);assert.equal(run.anomaly.id,'red-lights');
  // No extra movement into the observation hall, and no hidden arming distance.
  const result=travel(loop,-1).result;assert.equal(result.correct,true);assert.equal(run.progress,2);assert.notEqual(run.anomaly?.id,'red-lights');
});
test('turning back from either connecting passage preserves the same room and deck',()=>{
  const run=new Run(()=>.2),loop=new PassageLoop(run);run.anomaly=red;const original=run.capture();
  for(const step of [-1,1]){const first=approach(loop,step).room;const b=Math.min(loop.index,loop.index+step);let p=fromHall(b,12,-49+step*.05);loop.update(p.x,p.z);assert.equal(loop.viewIndex,loop.index);assert.deepEqual(run.capture(),original);assert.deepEqual(approach(loop,step).room,first);p=fromHall(b,12,-49+step*.05);loop.update(p.x,p.z);}
  assert.equal(travel(loop,1).result.correct,false);assert.equal(run.progress,0);assert.equal(run.anomaly,null);assert.equal(run.history.length,1);
});
test('forward and back are relative to the latest entry direction',()=>{
  const run=new Run(()=>.9),loop=new PassageLoop(run);assert.equal(travel(loop,1).result.correct,true);
  run.anomaly=red;assert.equal(travel(loop,-1).result.correct,true);assert.equal(loop.heading,-1);
  assert.equal(travel(loop,-1).result.correct,true);assert.equal(loop.index,-1);assert.equal(run.progress,3);
});
test('mistakes reset to a normal 00 landing; hints appear only after committing in easy mode',()=>{
  const run=new Run(()=>.9),loop=new PassageLoop(run);run.anomaly=red;
  const pending=approach(loop,1);assert.equal(failureHint(pending.result,'easy'),null);assert.equal(run.anomaly,red);
  const result=arrive(loop,1).result;assert.equal(result.correct,false);assert.equal(run.progress,0);assert.equal(run.anomaly,null);assert.equal(failureHint(result),null);assert.match(failureHint(result,'easy'),/红色/);
});
test('08 waits for the far landing and supports forward and reversed exit stairwells',()=>{
  for(const reversed of [false,true]){const run=new Run(()=>.9),loop=new PassageLoop(run);for(let i=0;i<7;i++)travel(loop,1);
    if(reversed)run.anomaly=red;const step=reversed?-1:1;approach(loop,step);assert.equal(loop.exitUnlocked,false);assert.equal(run.progress,7);arrive(loop,step);assert.equal(loop.exitUnlocked,true);assert.equal(run.history.length,8);
    const entrance=fromHall(loop.index,0,reversed?-34:0),stairs=fromHall(loop.index,0,reversed?-22:-12),finish=fromHall(loop.index,0,-17);
    assert.equal(loop.atExit(entrance.x,entrance.z),false);assert.ok(loop.floorHeight(stairs.x,stairs.z)>0);assert.equal(loop.atExit(finish.x,finish.z),true);
    travel(loop,-step);assert.equal(run.history.length,8);
  }
});
test('diagonal units and collision work on both sides of the origin',()=>{
  for(let i=-4;i<=4;i++){const p=fromHall(i,1,-9);assert.deepEqual(toHall(i,p.x,p.z),{x:1,z:-9});assert.ok(canStand(p.x,p.z,floorRects(i)));}
  const rects=floorRects(0);assert.equal(canStand(5,-20,rects),false);assert.equal(canStand(0,-46,rects),false);
  assert.equal(slideMove(2.75,-20,.15,0,rects).x,2.75);assert.ok(slideMove(2.75,-20,.15,-.15,rects).z<-20);
});
test('the complete four-turn connector has no collision seams in either direction',()=>{
  for(const b of [-2,-1,0,1]){const rects=floorRects(b),route=[[0,-38],[0,-43],[12,-43],[12,-55],[24,-55],[24,-60]];
    for(let j=1;j<route.length;j++)for(let k=0;k<=150;k++){const t=k/150,a=route[j-1],c=route[j],p=fromHall(b,a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t);assert.ok(canStand(p.x,p.z,rects),`bridge ${b}, segment ${j}, sample ${k}`);}
  }
});
test('both halls are hidden at view switches and at both commit boundaries',()=>{
  for(const b of [-1,0,1]){const rects=floorRects(b);
    for(const x of [10.24,12,13.76])for(const z of [-51.2,-51,-49.2,-49,-48.8,-47,-46.8])for(const index of [b,b+1])for(const tx of [-2.99,0,2.99])for(const tz of [-38.99,-30,-17,0,4.99]){
      const origin=fromHall(b,x,z),target=fromHall(index,tx,tz);let blocked=false;
      for(let k=1;k<500;k++){const t=k/500;if(!pointOnFloor(origin.x+(target.x-origin.x)*t,origin.z+(target.z-origin.z)*t,rects)){blocked=true;break;}}
      assert.ok(blocked,JSON.stringify({b,origin,target}));
    }
  }
});
test('rendered connector walls match collision outlines and leave only the hall mouths open',()=>{
  for(const {x,z,ry} of bendWalls()){const dx=Math.sin(ry)*.01,dz=Math.cos(ry)*.01;assert.ok(pointOnFloor(x+dx,z+dz,BEND_RECTS));assert.equal(pointOnFloor(x-dx,z-dz,BEND_RECTS),false);}
  assert.ok(!bendWalls().some(w=>w.z===-39||w.z===-59));
});

test('a new hall keeps posters left and equipment doors right relative to either entry',()=>{
  for(const index of [-3,0,4])for(const heading of [-1,1]){
    const entrance=fromHall(index,0,1.2,heading),poster=fromHall(index,-2.93,-9,heading),door=fromHall(index,2.93,-13,heading);
    assert.ok((poster.x-entrance.x)*heading<0,'posters must remain on entry-relative left');
    assert.ok((door.x-entrance.x)*heading>0,'doors must remain on entry-relative right');
    assert.ok((poster.z-entrance.z)*-heading>0,'posters must remain ahead of the entrance');
    const local=toHall(index,poster.x,poster.z,heading);assert.ok(Math.abs(local.x+2.93)<1e-10&&Math.abs(local.z+9)<1e-10);
  }
});
test('returning from a connector retains the original round entry orientation',()=>{
  const run=new Run(()=>.9),loop=new PassageLoop(run);run.anomaly=red;travel(loop,-1);
  const original=loop.room();assert.equal(original.heading,-1);
  approach(loop,1);assert.equal(loop.room(loop.viewIndex).heading,1);
  const p=fromHall(-1,12,-48.95);loop.update(p.x,p.z);
  assert.deepEqual(loop.room(loop.viewIndex),original);assert.equal(run.progress,1);
});
