import test from 'node:test';
import assert from 'node:assert/strict';
import {STAIRS,STAIR_END,STAIR_TOP,stairHeight,handrailProfile} from './stairs.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('every support meets the rendered handrail and starts on a visible tread',()=>{
  const {beams,posts}=handrailProfile();
  for(const post of posts){
    const beam=beams.find(b=>Math.abs(post.z-b.z)<=Math.cos(b.pitch)*b.length/2);
    assert.ok(beam);assert.ok(post.height>.85);
    near(post.y+post.height/2,beam.y-(post.z-beam.z)*Math.tan(beam.pitch));
    near(post.y-post.height/2,stairHeight(post.z,true));
  }
});
test('handrail segments join exactly and rise with the stairs in both room orientations',()=>{
  const {beams}=handrailProfile();
  for(const heading of [1,-1]){
    const ends=beams.map(b=>[-1,1].map(s=>({z:heading*(b.z+s*Math.cos(b.pitch)*b.length/2),y:b.y-s*Math.sin(b.pitch)*b.length/2})));
    for(let i=1;i<ends.length;i++){near(ends[i-1][0].z,ends[i][1].z);near(ends[i-1][0].y,ends[i][1].y);}
    near(ends[1][1].y,1);near(ends[1][0].y,1+STAIR_TOP);
  }
  near(stairHeight(STAIRS.startZ),0);near(stairHeight(STAIR_END),STAIR_TOP);
  near(beams[0].pitch,0);near(beams.at(-1).pitch,0);
});
