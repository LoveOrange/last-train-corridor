import test from 'node:test';
import assert from 'node:assert/strict';
import {QUALITY,pixelRatio,AdaptiveResolution} from './quality.js';
import {normalizeSettings} from './settings.js';

test('existing preferences default to balanced and all three presets survive storage',()=>{
  for(const value of [undefined,{}, {quality:'ultra'}])assert.equal(normalizeSettings(value).quality,'balanced');
  for(const quality of Object.keys(QUALITY))assert.equal(normalizeSettings(JSON.parse(JSON.stringify({quality}))).quality,quality);
});
test('retina phones and 4K windows stay within the preset pixel budget',()=>{
  for(const profile of Object.values(QUALITY))for(const [w,h,dpr] of [[390,844,3],[1920,1080,2],[3840,2160,2]]){
    const ratio=pixelRatio(profile,w,h,dpr);
    assert.ok(w*h*ratio*ratio<=profile.pixels+1);
    assert.ok(ratio<=dpr&&ratio<=profile.dpr);
    assert.ok(pixelRatio(profile,w,h,dpr,.6)<ratio);
  }
});
function feed(controller,ms,count){let changes=0;for(let i=0;i<count;i++)changes+=Number(controller.sample(ms));return changes;}
test('sustained sub-60 FPS lowers resolution promptly and never below the floor',()=>{
  for(const fps of [45,55,58]){const c=new AdaptiveResolution();assert.ok(feed(c,1000/fps,80)>0);assert.ok(c.scale<1);}
  const c=new AdaptiveResolution();assert.ok(feed(c,1000/45,60)>0);assert.ok(c.scale<1);
  feed(c,1000/30,1000);assert.equal(c.scale,.55);
});
test('steady 60/120 FPS keeps quality and slow recovery avoids rapid oscillation',()=>{
  for(const fps of [60,120]){const c=new AdaptiveResolution();assert.equal(feed(c,1000/fps,1800),0);assert.equal(c.scale,1);}
  const c=new AdaptiveResolution();feed(c,1000/30,120);c.resetWindow();const low=c.scale;
  feed(c,1000/60,360);assert.equal(c.scale,low);
  feed(c,1000/60,450);assert.ok(c.scale>low&&c.scale<=low+.051);
});
test('single stalls and time spent paused do not force a quality drop',()=>{
  const c=new AdaptiveResolution();feed(c,1000/60,100);c.sample(80);feed(c,1000/60,100);assert.equal(c.scale,1);
  c.resetWindow();feed(c,1000/30,20);c.resetWindow();c.sample(20000);feed(c,1000/60,180);assert.equal(c.scale,1);
  feed(c,1000/30,100);c.reset();assert.equal(c.scale,1);
});
