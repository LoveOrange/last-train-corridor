import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSettings,DEFAULTS} from './settings.js';
test('stored settings recover from old, missing or malformed data',()=>{
  for(const value of [null,undefined,'bad',[]])assert.deepEqual(normalizeSettings(value),DEFAULTS);
  assert.deepEqual(normalizeSettings({controls:'hacked',volume:'1',muted:1}),DEFAULTS);
});
test('touch and sound preferences persist with safe numeric bounds',()=>{
  const settings=normalizeSettings({controls:'keys',controlSize:99,sensitivity:-1,music:0,volume:.3,voice:Infinity,muted:true});
  assert.equal(settings.controls,'keys');assert.equal(settings.controlSize,1.35);assert.equal(settings.sensitivity,.4);assert.equal(settings.voice,DEFAULTS.voice);assert.equal(settings.music,0);assert.equal(settings.muted,true);
  assert.deepEqual(normalizeSettings(JSON.parse(JSON.stringify(settings))),settings);
});
test('ordinary mode is the default for new and existing saved preferences',()=>{
  assert.equal(normalizeSettings().difficulty,'normal');assert.equal(normalizeSettings({controls:'keys'}).difficulty,'normal');
  assert.equal(normalizeSettings({difficulty:'easy'}).difficulty,'easy');assert.equal(normalizeSettings({difficulty:'cheat'}).difficulty,'normal');
});
