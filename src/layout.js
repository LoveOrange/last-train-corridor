// One unit follows the reference plan: numbered landing, turn, observation hall,
// turn, numbered landing. Adjacent units share a four-turn connecting passage.
import {stairHeight} from './stairs.js';
export const HALL_SPACING=24,HALL_ADVANCE=64,PLAYER_RADIUS=.24;
export const START={x:-6,z:9,yaw:-Math.PI/2};
export const cellAt=(x,z)=>Math.floor((15-z)/HALL_ADVANCE);
// Rotate the complete room around its centre, never mirror its textures.
const orient=(x,z,heading)=>heading===1?{x,z}:{x:-x,z:-z-34};
export function toHall(index,x,z,heading=1){return orient(x-index*HALL_SPACING,z+index*HALL_ADVANCE,heading);}
export function fromHall(index,x,z,heading=1){const p=orient(x,z,heading);return {x:p.x+index*HALL_SPACING,z:p.z-index*HALL_ADVANCE};}
export function bridgeZ(boundary){return -49-boundary*HALL_ADVANCE;}
// Disjoint floor rectangles, also used to build the visible walls.
export const BEND_RECTS=[
  {x0:-3,x1:3,z0:-41,z1:-39},
  {x0:-3,x1:10,z0:-45,z1:-41},
  {x0:10,x1:14,z0:-57,z1:-41},
  {x0:14,x1:27,z0:-57,z1:-53},
  {x0:21,x1:27,z0:-59,z1:-57},
];
export function bendWalls(){
  const xs=[...new Set(BEND_RECTS.flatMap(r=>[r.x0,r.x1]))].sort((a,b)=>a-b),zs=[...new Set(BEND_RECTS.flatMap(r=>[r.z0,r.z1]))].sort((a,b)=>a-b),edges=[];
  const inside=(x,z)=>pointOnFloor(x,z,BEND_RECTS);
  for(let a=0;a<xs.length-1;a++)for(let b=0;b<zs.length-1;b++){
    const x0=xs[a],x1=xs[a+1],z0=zs[b],z1=zs[b+1],x=(x0+x1)/2,z=(z0+z1)/2;
    if(!inside(x,z))continue;
    for(const [px,pz,w,ry,open] of [[x0,z,z1-z0,Math.PI/2,!inside(x0-.01,z)],[x1,z,z1-z0,-Math.PI/2,!inside(x1+.01,z)],[x,z0,x1-x0,0,!inside(x,z0-.01)],[x,z1,x1-x0,Math.PI,!inside(x,z1+.01)]]){
      if(!open||(pz===-39&&px>=-3&&px<=3)||(pz===-59&&px>=21&&px<=27))continue;
      edges.push({x:px,z:pz,w,ry});
    }
  }
  return edges;
}
export function floorRects(center){
  const rects=[];
  for(let i=center-1;i<=center+1;i++){const p=fromHall(i,0,0);rects.push({x0:p.x-3,x1:p.x+3,z0:p.z-39,z1:p.z+5});}
  for(let b=center-2;b<=center+1;b++)for(const r of BEND_RECTS){const p=fromHall(b,0,0);rects.push({x0:p.x+r.x0,x1:p.x+r.x1,z0:p.z+r.z0,z1:p.z+r.z1});}
  return rects;
}
export const pointOnFloor=(x,z,rects)=>rects.some(r=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1);
export function canStand(x,z,rects,props=[]){
  for(const dx of [-PLAYER_RADIUS,0,PLAYER_RADIUS])for(const dz of [-PLAYER_RADIUS,0,PLAYER_RADIUS])if(!pointOnFloor(x+dx,z+dz,rects))return false;
  return !props.some(p=>Math.abs(x-p.x)<p.w/2+PLAYER_RADIUS&&Math.abs(z-p.z)<p.d/2+PLAYER_RADIUS);
}
export function slideMove(x,z,dx,dz,rects,props=[]){
  if(canStand(x+dx,z,rects,props))x+=dx;
  if(canStand(x,z+dz,rects,props))z+=dz;
  return {x,z};
}
export function isHiddenCrossing(boundary,x,z){const p=toHall(boundary,x,z);return p.x>=10.24&&p.x<=13.76&&Math.abs(p.z+49)<=.25;}
export class PassageLoop {
  constructor(run){this.run=run;this.reset();}
  reset(){this.run.reset();this.index=0;this.viewIndex=0;this.heading=1;this.exitUnlocked=false;this.crossings=0;this.previews=new Map();}
  room(index=this.index){
    if(index===this.index)return {index,heading:this.heading,anomaly:this.run.anomaly?.id||null,progress:this.run.progress,exit:this.exitUnlocked};
    const p=this.previews.get(index);return {index,heading:Math.sign(index-this.index),anomaly:p.state.anomaly?.id||null,progress:p.state.progress,exit:p.state.won};
  }
  update(x,z){
    const next=cellAt(x,z),boundary=Math.min(this.viewIndex,next);
    if(next!==this.viewIndex&&Math.abs(next-this.viewIndex)===1&&isHiddenCrossing(boundary,x,z)){
      if(next!==this.index&&!this.previews.has(next))this.previews.set(next,this.run.preview(next-this.index===this.heading?'forward':'back'));
      this.viewIndex=next;
      return {type:'view',room:this.room(next),result:null};
    }
    if(this.viewIndex===this.index)return null;
    const step=this.viewIndex-this.index,b=Math.min(this.index,this.viewIndex),p=toHall(b,x,z);
    // The far end of the buffer is a numbered landing, before the next hall can
    // be seen. Returning before this boundary preserves the original round.
    if(p.x<10.24||p.x>13.76||(step===1?p.z>-51:p.z<-47))return null;
    const preview=this.previews.get(this.viewIndex);this.run.commit(preview);
    this.index=this.viewIndex;this.heading=step;this.exitUnlocked=this.run.won;this.crossings++;this.previews.clear();
    return {type:'commit',room:this.room(),result:preview.result};
  }
  exitCoordinate(x,z){return toHall(this.index,x,z,this.heading).z;}
  floorHeight(x,z){return this.exitUnlocked?stairHeight(this.exitCoordinate(x,z)):0;}
  atExit(x,z){return this.exitUnlocked&&this.exitCoordinate(x,z)<-16.3;}
  snapshot(){return {index:this.index,viewIndex:this.viewIndex,heading:this.heading,exitUnlocked:this.exitUnlocked,crossings:this.crossings,pending:this.viewIndex!==this.index};}
}
