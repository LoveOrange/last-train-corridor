import {ANOMALIES} from './rules.js';

export const GALLERY_KEY='last-passage-gallery-v1';
const known=new Set(ANOMALIES.map(a=>a.id));
export function normalizeGallery(value){
  if(!Array.isArray(value))return [];
  return [...new Set(value.filter(id=>known.has(id)))];
}

// The adapter can be browser storage or the mini tool's asynchronous bridge.
export async function createGallery(storage){
  let unlocked=[],saved=true,queue=Promise.resolve();
  try{
    const raw=await storage.getItem(GALLERY_KEY);
    unlocked=normalizeGallery(raw?JSON.parse(raw):[]);
  }catch{saved=false;}
  return {
    ids:()=>[...unlocked],
    has:id=>unlocked.includes(id),
    saved:()=>saved,
    record(event){
      const result=event?.result,id=result?.anomaly?.id;
      // A reversible room preview must never grant a collection entry.
      if(event?.type!=='commit'||!result?.correct||!known.has(id)||unlocked.includes(id))return queue;
      unlocked.push(id);
      const data=JSON.stringify(unlocked);
      queue=queue.then(async()=>{
        if(!saved)return;
        try{await storage.setItem(GALLERY_KEY,data);}catch{saved=false;}
      });
      return queue;
    }
  };
}
