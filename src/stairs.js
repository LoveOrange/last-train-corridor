// Shared dimensions for the visible treads, walking ramp and connected handrails.
export const STAIRS={startZ:-8,count:12,tread:.5,rise:.12};
export const STAIR_TOP=STAIRS.count*STAIRS.rise;
export const STAIR_END=STAIRS.startZ-STAIRS.count*STAIRS.tread;
export function stairHeight(z,stepped=false){
  const step=(STAIRS.startZ-z)/STAIRS.tread;
  return Math.max(0,Math.min(STAIRS.count,stepped?Math.ceil(step):step))*STAIRS.rise;
}
export function handrailProfile(){
  const points=[STAIRS.startZ+1,STAIRS.startZ,STAIR_END,STAIR_END-2].map(z=>({z,y:stairHeight(z)+1}));
  const beams=points.slice(1).map((b,i)=>{const a=points[i];return {
    z:(a.z+b.z)/2,y:(a.y+b.y)/2,length:Math.hypot(b.z-a.z,b.y-a.y),pitch:Math.atan2(b.y-a.y,a.z-b.z)
  };});
  // Put slope supports on tread centres, avoiding ambiguous step edges.
  const posts=[STAIRS.startZ+.5,...[0,4,8,11].map(i=>STAIRS.startZ-(i+.5)*STAIRS.tread),STAIR_END-1.5].map(z=>{
    const bottom=stairHeight(z,true),top=stairHeight(z)+1;
    return {z,y:(bottom+top)/2,height:top-bottom};
  });
  return {beams,posts};
}
