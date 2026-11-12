export const STORAGE_KEY='last-passage-settings-v2';
export const DEFAULTS={language:'auto',difficulty:'normal',quality:'balanced',controls:'auto',controlSize:1,sensitivity:1,volume:.65,music:.6,sfx:.75,voice:.8,muted:false,reducedMotion:false};
export function normalizeSettings(value={}){
  if(!value||typeof value!=='object')value={};
  const result={...DEFAULTS};
  if(['auto','zh-CN','en','ja'].includes(value.language))result.language=value.language;
  if(['normal','easy'].includes(value.difficulty))result.difficulty=value.difficulty;
  if(['smooth','balanced','high'].includes(value.quality))result.quality=value.quality;
  if(['auto','stick','keys','off'].includes(value.controls))result.controls=value.controls;
  for(const [key,min,max] of [['controlSize',.8,1.35],['sensitivity',.4,2],['volume',0,1],['music',0,1],['sfx',0,1],['voice',0,1]]){
    if(typeof value[key]==='number'&&Number.isFinite(value[key]))result[key]=Math.min(max,Math.max(min,value[key]));
  }
  for(const key of ['muted','reducedMotion'])if(typeof value[key]==='boolean')result[key]=value[key];
  return result;
}
export function readSettings(){try{return normalizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{return {...DEFAULTS};}}
export function saveSettings(value){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(normalizeSettings(value)));}catch{/* Private browsing may disable storage; settings still work this session. */}}
