import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const evidence=process.env.EVIDENCE_DIR||'test-results/mobile';await mkdir(evidence,{recursive:true});
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2,locale:'zh-CN'});
// Use real browser events/rendering, but a fixed simulation timestep so GPU
// startup stalls do not masquerade as a changed movement-speed ratio.
function fixedFrameClock(){
  const raf=window.requestAnimationFrame;let last=-1;window.__mobileTestTime=0;
  window.requestAnimationFrame=fn=>raf(time=>{if(time!==last){last=time;window.__mobileTestTime+=1000/60;}fn(window.__mobileTestTime);});
}
await page.addInitScript(fixedFrameClock);
const cdp=await page.context().newCDPSession(page),errors=[],cases=[];
page.on('pageerror',e=>errors.push(e.message));
const snapshot=()=>page.evaluate(()=>__corridorQA.snapshot());
const frames=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const contact=(id,x,y)=>({id,x,y,radiusX:8,radiusY:8,force:1});
const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
const place=async()=>{await page.evaluate(()=>__corridorQA.place(0,2,0));await frames();};
async function stopped(){
  assert.deepEqual((await snapshot()).input.joystick,{x:0,y:0});
  const before=(await snapshot()).player;await page.waitForTimeout(150);
  const after=(await snapshot()).player;assert.equal(after.x,before.x);assert.equal(after.z,before.z);
  assert.equal(await page.locator('#stick').evaluate(el=>el.style.transform),'');
}
await page.goto('http://127.0.0.1:4178/?qa=1');
await page.waitForFunction(()=>window.__corridorQA,null,{timeout:90000});
await page.click('#start');await frames();
let rect=await page.locator('#joystick').boundingBox(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
// Reproduce the old failure with actual pointer input and a broken host capture API.
for(const behavior of ['no-op','throws']){
  await place();await page.evaluate(behavior=>{document.getElementById('joystick').setPointerCapture=()=>{if(behavior==='throws')throw new Error('capture unavailable');};},behavior);
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-55);
  assert.ok((await snapshot()).input.joystick.y<-.9);
  await page.mouse.move(x,200);await page.mouse.up();await stopped();
}
cases.push('capture missing/throwing: drag outside and release stops movement and recenters');
await place();
await touch('touchStart',[contact(1,x,y)]);await touch('touchMove',[contact(1,x,y-55)]);
await page.waitForTimeout(1400);assert.ok((await snapshot()).input.joystick.y<-.9);
await touch('touchEnd',[]);await stopped();
cases.push('native touch held stationary remains active; release stops immediately');
// The joystick finger stays down while a second finger taps run mode.
await place();const run=await page.locator('#move-mode').boundingBox(),rx=run.x+run.width/2,ry=run.y+run.height/2;
await touch('touchStart',[contact(1,x,y-40)]);
await touch('touchStart',[contact(1,x,y-40),contact(2,rx,ry)]);
assert.equal((await snapshot()).settings.running,true);
// CDP touchEnd lists the contacts to end, rather than the remaining contacts.
await touch('touchEnd',[contact(2,rx,ry)]);
assert.ok((await snapshot()).input.joystick.y<-.7);
await page.waitForTimeout(100);assert.equal((await snapshot()).settings.running,true);
await touch('touchEnd',[]);await stopped();
assert.equal(await page.locator('#move-mode').getAttribute('aria-pressed'),'true');
cases.push('second finger toggles running once without releasing movement; its release preserves the joystick');
await touch('touchStart',[contact(1,x,y-40)]);await touch('touchCancel',[]);await stopped();
cases.push('native touchcancel clears all joystick movement');
// Missing Pointer Events are handled by the Touch Events path as well.
await page.evaluate(()=>{
  const stick=document.getElementById('joystick'),b=stick.getBoundingClientRect();
  const first=new Touch({identifier:71,target:stick,clientX:b.x+b.width/2,clientY:b.y+5});
  const other=new Touch({identifier:72,target:document.body,clientX:300,clientY:300});
  stick.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[first],changedTouches:[first]}));
  document.body.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[other],changedTouches:[first]}));
});await stopped();
cases.push('touch-only release outside the control works with another finger remaining down');
await page.reload();await page.waitForFunction(()=>window.__corridorQA,null,{timeout:90000});
assert.equal((await snapshot()).settings.running,true);await page.click('#start');await frames();
// Measure the actual movement loop, including the persisted speed preference.
const speeds=[];
for(const running of [true,false]){
  if((await snapshot()).settings.running!==running)await page.click('#move-mode');
  await place();await page.keyboard.down('KeyW');
  const a=await page.evaluate(()=>({z:__corridorQA.snapshot().player.z,t:window.__mobileTestTime}));
  await page.waitForTimeout(700);
  const b=await page.evaluate(()=>({z:__corridorQA.snapshot().player.z,t:window.__mobileTestTime}));
  await page.keyboard.up('KeyW');speeds.push((a.z-b.z)/(b.t-a.t)*1000);
}
assert.ok(speeds[0]>speeds[1]*1.3&&speeds[0]<speeds[1]*1.75,JSON.stringify(speeds));
cases.push('running persists through reload and moves about 1.52x walking speed');
for(const viewport of [{width:844,height:390},{width:390,height:844}]){
  rect=await page.locator('#joystick').boundingBox();
  await touch('touchStart',[contact(1,rect.x+rect.width/2,rect.y+5)]);
  await page.setViewportSize(viewport);await page.waitForTimeout(180);await stopped();
  await touch('touchEnd',[]);
  for(const id of ['joystick','touch-actions','pause']){
    const b=await page.locator('#'+id).boundingBox();
    assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=viewport.width+1&&b.y+b.height<=viewport.height+1,JSON.stringify({id,viewport,b}));
  }
}
cases.push('portrait/landscape resize clears held input and keeps controls inside the viewport');
await page.click('#settings-open');
for(const [language,walk,run] of [['en','Walk','Run'],['ja','歩く','走る'],['zh-CN','行走','奔跑']]){
  await page.selectOption('#language',language);await page.click('#settings-done');
  assert.equal(await page.locator('#move-mode small').textContent(),walk);
  await page.click('#move-mode');assert.equal(await page.locator('#move-mode small').textContent(),run);
  assert.equal(await page.locator('#move-mode').getAttribute('aria-pressed'),'true');
  await page.click('#move-mode');assert.equal(await page.locator('#move-mode small').textContent(),walk);
  await page.click('#settings-open');
}
cases.push('Chinese, English and Japanese labels follow both the selected language and speed');
await page.selectOption('#control-mode','keys');await page.click('#settings-done');
const key=page.locator('[data-key="KeyW"]'),kb=await key.boundingBox();
await key.evaluate(el=>{el.setPointerCapture=()=>{};});await place();
await page.mouse.move(kb.x+kb.width/2,kb.y+kb.height/2);await page.mouse.down();
assert.ok((await snapshot()).input.virtual.includes('KeyW'));
await page.mouse.move(300,250);await page.mouse.up();assert.deepEqual((await snapshot()).input.virtual,[]);
cases.push('virtual keys also release outside without capture');
await page.click('#settings-open');await page.selectOption('#control-mode','stick');await page.click('#settings-done');
rect=await page.locator('#joystick').boundingBox();await touch('touchStart',[contact(1,rect.x+rect.width/2,rect.y+5)]);
await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await stopped();assert.equal((await snapshot()).phase,'paused');
await touch('touchEnd',[]);await page.click('#resume');
rect=await page.locator('#joystick').boundingBox();await touch('touchStart',[contact(1,rect.x+rect.width/2,rect.y+5)]);
await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await stopped();await touch('touchEnd',[]);
cases.push('blur pauses and releases; pagehide also clears held joystick state');
await page.screenshot({path:path.join(evidence,'mobile-portrait.png')});
await page.setViewportSize({width:844,height:390});await page.waitForTimeout(180);await page.screenshot({path:path.join(evidence,'mobile-landscape.png')});
const desktop=await browser.newPage({viewport:{width:1280,height:720},locale:'en'});desktop.on('pageerror',e=>errors.push(e.message));
await desktop.addInitScript(fixedFrameClock);await desktop.goto('http://127.0.0.1:4178/?qa=1');await desktop.waitForFunction(()=>window.__corridorQA,null,{timeout:90000});
await desktop.click('#start');assert.equal(await desktop.evaluate(()=>__corridorQA.snapshot().controls),'off');
const keyboardSpeeds=[];
for(const shift of [false,true,false]){
  await desktop.evaluate(()=>__corridorQA.place(0,2,0));await desktop.keyboard.down('KeyW');if(shift)await desktop.keyboard.down('ShiftLeft');
  const a=await desktop.evaluate(()=>({z:__corridorQA.snapshot().player.z,t:window.__mobileTestTime}));await desktop.waitForTimeout(700);
  const b=await desktop.evaluate(()=>({z:__corridorQA.snapshot().player.z,t:window.__mobileTestTime}));
  await desktop.keyboard.up('KeyW');await desktop.keyboard.up('ShiftLeft');keyboardSpeeds.push((a.z-b.z)/(b.t-a.t)*1000);
}
assert.ok(keyboardSpeeds[1]>keyboardSpeeds[0]*1.3&&keyboardSpeeds[1]>keyboardSpeeds[2]*1.3,JSON.stringify(keyboardSpeeds));
assert.equal(await desktop.evaluate(()=>__corridorQA.snapshot().settings.running),false);
cases.push('desktop WASD and held Shift retain temporary faster walking; release restores walking');
assert.deepEqual(errors,[]);
const report={result:'PASS',scope:'Local Chrome events and rendering with fixed 60 Hz simulation timestamps; physical iPhone Safari validation still required',cases,speeds,keyboardSpeeds,pageErrors:errors};
await writeFile(path.join(evidence,'mobile-regression.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));await browser.close();
