import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LANGUAGES,messages,resolveLanguage,selectVoice,translate} from './i18n.js';
import {normalizeSettings,readSettings,saveSettings,STORAGE_KEY} from './settings.js';
import {ANOMALIES,failureHint} from './rules.js';
import {Ambience} from './audio.js';

test('browser language matching respects priority, saved choices and unsupported languages',()=>{
  assert.equal(resolveLanguage('auto',['fr-FR','ja-JP','en-US']),'ja');
  assert.equal(resolveLanguage('auto',['zh-TW','en-US']),'zh-CN');
  assert.equal(resolveLanguage('auto',['en-GB','ja-JP']),'en');
  assert.equal(resolveLanguage('zh-CN',['ja-JP']),'zh-CN');
  assert.equal(resolveLanguage('ja',['zh-CN']),'ja');
  assert.equal(resolveLanguage('auto',['de-DE']),'en');
  assert.equal(resolveLanguage('auto',[]),'en');
});

test('saved language round-trips and older preferences keep their controls and quality',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),data=new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)}});
  try{
    for(const language of [...LANGUAGES,'auto']){
      saveSettings({language,controls:'keys',quality:'smooth',music:.3});
      assert.equal(readSettings().language,language);assert.equal(readSettings().controls,'keys');
    }
    data.set(STORAGE_KEY,JSON.stringify({quality:'high',controls:'keys'}));
    assert.equal(readSettings().language,'auto');assert.equal(readSettings().quality,'high');
    assert.equal(normalizeSettings({language:'invalid'}).language,'auto');
  }finally{if(original===undefined)delete globalThis.localStorage;else Object.defineProperty(globalThis,'localStorage',original);}
});

test('every UI and anomaly message exists in all languages with matching placeholders',()=>{
  const keys=Object.keys(messages['zh-CN']);
  const placeholders=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  for(const language of LANGUAGES){
    assert.deepEqual(Object.keys(messages[language]),keys);
    for(const key of keys){
      assert.equal(typeof messages[language][key],'string',`${language}: ${key}`);
      assert.ok(messages[language][key].trim(),`${language}: ${key}`);
      assert.deepEqual(placeholders(messages[language][key]),placeholders(messages['zh-CN'][key]));
    }
    for(const anomaly of ANOMALIES)assert.ok(translate(language,'anomaly.'+anomaly.id));
  }
  const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
  for(const [,key] of html.matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g))assert.ok(keys.includes(key),key);
  for(const text of Object.values(messages.en))assert.doesNotMatch(text,/\p{Script=Han}/u);
  assert.equal(translate('en','scene.exit',{number:'07'}),'SOUTH EXIT 07');
});

test('language never reveals an anomaly in normal mode; easy explanations refer to the failed room',()=>{
  for(const language of LANGUAGES)for(const anomaly of [...ANOMALIES,null]){
    const mistake={correct:false,anomaly};
    assert.equal(failureHint(mistake,'normal',language),null);
    assert.equal(failureHint({...mistake,correct:true},'easy',language),null);
    const hint=failureHint(mistake,'easy',language);
    assert.ok(hint.includes(anomaly?translate(language,'anomaly.'+anomaly.id):translate(language,'failureNormal')));
    assert.doesNotMatch(hint,/undefined|\{\w+\}/);
  }
});

test('speech chooses the selected language and never falls back to an unrelated voice',()=>{
  const voices=[{lang:'zh-TW'},{lang:'en-US'},{lang:'ja-JP'},{lang:'zh_CN'}];
  assert.equal(selectVoice(voices,'zh-CN'),voices[3]);
  assert.equal(selectVoice(voices,'en'),voices[1]);
  assert.equal(selectVoice(voices,'ja'),voices[2]);
  assert.equal(selectVoice([{lang:'en-US'}],'ja'),undefined);
  assert.equal(selectVoice([],'en'),undefined);
});

test('missing speech voices still deliver translated subtitles and can become available later',()=>{
  const previous=globalThis.speechSynthesis;let voices=[],spoken=0,caption='';
  globalThis.speechSynthesis={getVoices:()=>voices,addEventListener(){},cancel(){},speak(){spoken++;}};
  try{
    const audio=new Ambience(text=>caption=text);audio.configure(normalizeSettings({language:'ja'}),'ja');
    audio.announce(translate('ja','announceTest'),{preview:true});
    assert.equal(caption,translate('ja','announceTest'));assert.equal(spoken,0);
    assert.equal(audio.voiceState,translate('ja','voiceMissing'));
    voices=[{lang:'ja-JP'}];audio.refreshVoices();assert.equal(audio.voiceState,translate('ja','voiceReady'));
    audio.configure(normalizeSettings({language:'en'}),'en');
    assert.equal(audio.voice,undefined);assert.equal(audio.voiceState,translate('en','voiceMissing'));
  }finally{if(previous===undefined)delete globalThis.speechSynthesis;else globalThis.speechSynthesis=previous;}
});
