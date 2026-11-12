import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildScene } from './scene.js';
import { Run,ANOMALIES,failureHint } from './rules.js';
import { Ambience } from './audio.js';
import {PassageLoop,START} from './layout.js';
import {readSettings,saveSettings} from './settings.js';
import {QUALITY,pixelRatio,AdaptiveResolution} from './quality.js';
import {resolveLanguage,translate,translateDocument} from './i18n.js';

const $=id=>document.getElementById(id),canvas=$('world');
const touch=matchMedia('(pointer:coarse)').matches,systemReduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
const settings=readSettings();let language=resolveLanguage(settings.language);const t=(key,values)=>translate(language,key,values);const reduced=()=>systemReduceMotion||settings.reducedMotion;
const run=new Run(),loop=new PassageLoop(run),audio=new Ambience(showCaption);let phase='intro',renderer,composer,world,camera,bloom;
const keys=new Set(),virtualKeys=new Set(),keyPointers=new Map(),player={...START,pitch:0,bob:0},joystick={x:0,y:0};
let lookPointer=null,lastLook={x:0,y:0},lastTime=0,elapsed=0,turnTarget=null,messageTimer=null,renderRequest=0,ready=false,renderedFrames=0,resizePending=true;
const drawingSize={width:0,height:0,ratio:0};
const resolution=new AdaptiveResolution();
const params=new URLSearchParams(location.search),qa=location.hostname==='127.0.0.1'&&params.has('qa');
document.body.classList.toggle('touch',touch);
const frameTimes=[];
let settingsReturn='intro',captionTimer,controlHintTimer,settingsOpener=null,stickPointer=null,lastCrossing=null,captionKey=null,messageContent=null;
const hasKey=key=>keys.has(key)||virtualKeys.has(key);
const controlMode=()=>settings.controls==='auto'?(touch?'stick':'off'):settings.controls;
function showCaption(text){clearTimeout(captionTimer);$('broadcast-text').textContent=text;$('broadcast').hidden=false;if(phase==='settings'){$('voice-caption').textContent=text;$('voice-caption').hidden=false;}captionTimer=setTimeout(()=>$('broadcast').hidden=true,Math.max(6000,text.length*240));}
function updateControls(){const mode=controlMode();document.body.classList.toggle('has-controls',mode!=='off');document.documentElement.style.setProperty('--control-scale',Math.min(settings.controlSize,mode==='keys'?Math.max(.8,(innerWidth-48)/302):1.35));$('touch-controls').hidden=phase!=='playing'||mode==='off';$('joystick').hidden=mode!=='stick';$('virtual-keys').hidden=mode!=='keys';}
function applySettings(){saveSettings(settings);audio.configure(settings,language);updateControls();$('sound').textContent=t(audio.enabled?'soundOn':'soundOff');$('sound').setAttribute('aria-label',t(audio.enabled?'mute':'unmute'));}
function syncSettings(){ $('language').value=$('intro-language').value=settings.language;$('quality').value=settings.quality;$('quality-help').textContent=t('quality.'+settings.quality);$('difficulty').value=settings.difficulty;$('control-mode').value=settings.controls;$('muted').checked=settings.muted;$('reduced-motion').checked=settings.reducedMotion;for(const input of document.querySelectorAll('[data-setting]')){input.value=settings[input.dataset.setting];$(input.id+'-value').textContent=input.dataset.setting==='sensitivity'?`${Number(input.value).toFixed(1)}×`:`${Math.round(Number(input.value)*100)}%`;}audio.refreshVoices();$('voice-status').textContent=audio.voiceState;}
function openSettings(e){settingsOpener=e?.currentTarget;settingsReturn=phase;phase='settings';stopRendering();hideInputs();updateControls();audio.pause(true);document.exitPointerLock?.();syncSettings();$('voice-caption').hidden=true;document.body.classList.add('settings-open');$('settings').showModal();}
function closeSettings(){if(!$('settings').open)return;$('settings').close();document.body.classList.remove('settings-open');$('broadcast').hidden=true;if(settingsReturn==='playing')play();else{phase=settingsReturn;updateControls();requestRender();settingsOpener?.focus();}}
for(const id of ['settings-open','intro-settings','pause-settings'])$(id).addEventListener('click',openSettings);for(const id of ['settings-close','settings-done'])$(id).addEventListener('click',closeSettings);$('settings').addEventListener('cancel',e=>{e.preventDefault();closeSettings();});
$('quality').addEventListener('change',e=>{settings.quality=e.target.value;resolution.reset();applyQuality();applySettings();syncSettings();});
$('control-mode').addEventListener('change',e=>{settings.controls=e.target.value;hideInputs();applySettings();});
for(const input of document.querySelectorAll('[data-setting]'))input.addEventListener('input',()=>{settings[input.dataset.setting]=Number(input.value);applySettings();syncSettings();});
$('difficulty').addEventListener('change',e=>{settings.difficulty=e.target.value;applySettings();if(settings.difficulty==='normal'){clearTimeout(messageTimer);messageContent=null;$('message').classList.remove('visible');$('message').replaceChildren();}});
$('muted').addEventListener('change',e=>{settings.muted=e.target.checked;applySettings();});$('reduced-motion').addEventListener('change',e=>{settings.reducedMotion=e.target.checked;applySettings();});
$('test-voice').addEventListener('click',()=>{audio.activate().catch(()=>{});announce('announceTest',{preview:true});$('voice-status').textContent=audio.enabled&&settings.voice?audio.voiceState:t('voiceMuted');});
function announce(key,options){captionKey=key;audio.announce(t(key),options);}
function updateStats(){$('run-stats').textContent=t('runStats',{passages:run.history.length,anomalies:run.history.filter(r=>r.anomaly).length});}
function applyLanguage(){
  const next=resolveLanguage(settings.language),changed=language!==next;language=next;
  document.documentElement.lang=language;document.title=language==='en'?t('title'):t('title')+' · The Last Passage';
  document.querySelector('meta[name="description"]').content=t('description');translateDocument(document,language);
  $('intro-controls').textContent=t(touch?'mobileControls':'desktopControls');$('start-label').textContent=t(ready?'start':'loading');
  applySettings();syncSettings();updateStats();renderMessage();
  if(captionKey){$('broadcast-text').textContent=$('voice-caption').textContent=t(captionKey);}
  if(changed)world?.setLanguage(language);requestRender();
}
for(const id of ['language','intro-language'])$(id).addEventListener('change',e=>{settings.language=e.target.value;applyLanguage();});
window.addEventListener('languagechange',()=>{if(settings.language==='auto')applyLanguage();});
applyLanguage();
function renderMessage(){if(!messageContent)return;const {title,detail}=messageContent;$('message').replaceChildren();const text=document.createElement('span');text.textContent=title();$('message').append(text);if(detail){const small=document.createElement('small');small.textContent=detail();$('message').append(small);}}
function showMessage(title,detail=null,duration=4000){clearTimeout(messageTimer);messageContent={title,detail};renderMessage();$('message').classList.add('visible');messageTimer=setTimeout(()=>{$('message').classList.remove('visible');messageContent=null;},duration);}
function hideInputs(){keys.clear();virtualKeys.clear();keyPointers.clear();document.querySelectorAll('[data-key]').forEach(b=>b.classList.remove('pressed'));joystick.x=joystick.y=0;$('stick').style.transform='';lookPointer=null;stickPointer=null;}
function requestMouse(){if(touch||controlMode()!=='off')return;try{const p=canvas.requestPointerLock?.();p?.catch(()=>{});}catch{}}
function resetPosition(){Object.assign(player,{...START,pitch:0,bob:0});turnTarget=null;hideInputs();}
function play(){
  const first=phase==='intro';
  if(first){$('intro').hidden=true;$('hud').hidden=false;loop.reset();resetPosition();world.reset();const test=params.get('preview');if(qa&&ANOMALIES.some(a=>a.id===test)){run.anomaly=ANOMALIES.find(a=>a.id===test);world.setAnomaly(test);}}
  phase='playing';$('paused').hidden=true;$('crosshair').hidden=false;$('walk-hint').hidden=false;clearTimeout(controlHintTimer);controlHintTimer=setTimeout(()=>$('walk-hint').hidden=true,7000);updateControls();audio.pause(false);audio.activate().catch(()=>showMessage(()=>t('audioError'),()=>t('audioErrorDetail')));if(first)announce('announceStart');lastTime=0;resolution.resetWindow();requestRender();requestMouse();canvas.focus();
}
function pause(){if(phase!=='playing')return;phase='paused';stopRendering();$('paused').hidden=false;$('crosshair').hidden=true;updateControls();hideInputs();document.exitPointerLock?.();audio.pause(true);$('broadcast').hidden=true;$('resume').focus();}
function restart(){
  loop.reset();resetPosition();world.reset();lastCrossing=null;clearTimeout(messageTimer);messageContent=null;$('message').classList.remove('visible');$('message').replaceChildren();$('ending').hidden=true;$('paused').hidden=true;$('broadcast').hidden=true;$('hud').hidden=false;play();
}
function enterPassage(event){
  if(!event)return;
  // View changes prepare hidden rooms; only arrival at the far landing commits a decision.
  lastCrossing={...event,position:{x:player.x,z:player.z,yaw:player.yaw,pitch:player.pitch},progress:run.progress};
  const r=event.room;world.sync(r.index,r.anomaly,r.progress,r.heading,r.exit);
  const hint=failureHint(event.result,settings.difficulty,language);
  if(hint)showMessage(()=>t('resetTitle'),()=>failureHint(event.result,settings.difficulty,language),6500);
}
function finish(){
  if(phase!=='playing')return;phase='won';hideInputs();clearTimeout(messageTimer);messageContent=null;$('message').classList.remove('visible');$('message').replaceChildren();document.exitPointerLock?.();$('ending').hidden=false;$('hud').hidden=true;$('crosshair').hidden=true;$('walk-hint').hidden=true;updateControls();
  updateStats();$('replay').focus();announce('announceEnd');
}
function turn(){if(phase==='playing')turnTarget=player.yaw+Math.PI;}
$('start').addEventListener('click',play);$('resume').addEventListener('click',play);$('pause').addEventListener('click',pause);$('restart').addEventListener('click',restart);$('replay').addEventListener('click',()=>{$('hud').hidden=false;restart();});$('turn').addEventListener('click',turn);
$('sound').addEventListener('click',()=>{settings.muted=audio.enabled;if(!settings.muted&&settings.volume===0)settings.volume=.65;applySettings();if(audio.enabled)audio.activate().catch(()=>showMessage(()=>t('audioError')));});
window.addEventListener('keydown',e=>{if(phase==='settings')return;if(['Escape','KeyP'].includes(e.code)){e.preventDefault();if(phase==='playing')pause();else if(phase==='paused')play();return;}if(phase!=='playing')return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyQ'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyQ'&&!e.repeat)turn();});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();stopRendering();audio.pause(true);}else{if(phase==='playing'||phase==='won')audio.pause(false);requestRender();}});
let hadLock=false;document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;if(hadLock&&!locked&&phase==='playing')pause();hadLock=locked;});
document.addEventListener('mousemove',e=>{if(phase==='playing'&&document.pointerLockElement===canvas){player.yaw-=e.movementX*.0018*settings.sensitivity;player.pitch=THREE.MathUtils.clamp(player.pitch-e.movementY*.0018*settings.sensitivity,-1.25,1.25);turnTarget=null;}});
canvas.addEventListener('pointerdown',e=>{if(phase!=='playing'||document.pointerLockElement===canvas)return;lookPointer=e.pointerId;lastLook={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(phase!=='playing'||lookPointer!==e.pointerId||document.pointerLockElement===canvas)return;player.yaw-=(e.clientX-lastLook.x)*.004*settings.sensitivity;player.pitch=THREE.MathUtils.clamp(player.pitch-(e.clientY-lastLook.y)*.004*settings.sensitivity,-1.25,1.25);lastLook={x:e.clientX,y:e.clientY};turnTarget=null;});
const endLook=e=>{if(e.pointerId===lookPointer)lookPointer=null;};canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);canvas.addEventListener('contextmenu',e=>e.preventDefault());
const stick=$('joystick');
function setStick(e){const b=stick.getBoundingClientRect(),radius=b.width*.38;let x=(e.clientX-b.left-b.width/2)/radius,y=(e.clientY-b.top-b.height/2)/radius;const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}joystick.x=x;joystick.y=y;$('stick').style.transform=`translate(${x*32}px,${y*32}px)`;}
stick.addEventListener('pointerdown',e=>{if(phase!=='playing'||stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);setStick(e);});
stick.addEventListener('pointermove',e=>{if(phase==='playing'&&e.pointerId===stickPointer)setStick(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,e=>{if(e.pointerId===stickPointer){stickPointer=null;joystick.x=joystick.y=0;$('stick').style.transform='';}});
for(const button of document.querySelectorAll('[data-key]')){
  button.addEventListener('pointerdown',e=>{if(phase!=='playing')return;e.preventDefault();button.setPointerCapture(e.pointerId);keyPointers.set(e.pointerId,button.dataset.key);virtualKeys.add(button.dataset.key);button.classList.add('pressed');});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{const key=keyPointers.get(e.pointerId);keyPointers.delete(e.pointerId);if(key&&![...keyPointers.values()].includes(key)){virtualKeys.delete(key);button.classList.remove('pressed');}});
}
$('touch-controls').addEventListener('contextmenu',e=>e.preventDefault());
function stopRendering(){cancelAnimationFrame(renderRequest);renderRequest=0;lastTime=0;resolution.resetWindow();}
function requestRender(){if(ready&&!document.hidden&&!renderRequest)renderRequest=requestAnimationFrame(animate);}
function applyQuality(){if(!world||!composer)return;const profile=QUALITY[settings.quality];world.setQuality(profile);bloom.enabled=profile.bloom>0;bloom.strength=profile.bloom;resize();}
function resize(){
  // Resizing clears the canvas. Queue it for the next draw, never clear a
  // completed frame or leave an event-triggered resize waiting for a redraw.
  updateControls();resizePending=true;requestRender();
}
function applyDrawingSize(){
  if(!resizePending)return;resizePending=false;
  const w=innerWidth,h=innerHeight,ratio=pixelRatio(QUALITY[settings.quality],w,h,devicePixelRatio,resolution.scale);
  if(drawingSize.width===w&&drawingSize.height===h&&drawingSize.ratio===ratio)return;
  camera.aspect=w/h;camera.updateProjectionMatrix();
  renderer.setDrawingBufferSize(w,h,ratio);
  // Composer stays at pixel ratio 1 and receives physical dimensions directly:
  // one resize, rather than reallocating for pixel ratio and viewport separately.
  composer.setSize(canvas.width,canvas.height);
  Object.assign(drawingSize,{width:w,height:h,ratio});
}
function move(dt){
  if(hasKey('ArrowLeft')){player.yaw+=dt*1.6;turnTarget=null;}if(hasKey('ArrowRight')){player.yaw-=dt*1.6;turnTarget=null;}
  if(turnTarget!==null){if(reduced()){player.yaw=turnTarget;turnTarget=null;}else{player.yaw=THREE.MathUtils.damp(player.yaw,turnTarget,12,dt);if(Math.abs(player.yaw-turnTarget)<.01){player.yaw=turnTarget;turnTarget=null;}}}
  let forward=Number(hasKey('KeyW')||hasKey('ArrowUp'))-Number(hasKey('KeyS')||hasKey('ArrowDown'))-joystick.y,side=Number(hasKey('KeyD'))-Number(hasKey('KeyA'))+joystick.x;
  const len=Math.hypot(forward,side);if(len>1){forward/=len;side/=len;}const speed=(hasKey('ShiftLeft')||hasKey('ShiftRight'))?3.8:2.5;
  let dx=(-Math.sin(player.yaw)*forward+Math.cos(player.yaw)*side)*speed*dt,dz=(-Math.cos(player.yaw)*forward-Math.sin(player.yaw)*side)*speed*dt;
  const {x:nx,z:nz}=world.move(player.x,player.z,dx,dz);
  const moved=Math.hypot(nx-player.x,nz-player.z)>.001;player.x=nx;player.z=nz;
  if(moved){player.bob+=dt*(speed===3.8?11:8);audio.step(speed/2.5);}
  enterPassage(loop.update(player.x,player.z));
  if(loop.atExit(player.x,player.z))finish();
  const bob=reduced()?0:moved?Math.sin(player.bob)*.017:Math.sin(elapsed*.8)*.002;
  camera.position.set(player.x,1.67+bob+loop.floorHeight(player.x,player.z),player.z);camera.rotation.set(player.pitch,player.yaw,reduced()?0:moved?Math.sin(player.bob*.5)*.0015:0,'YXZ');
}
function animate(t){
  renderRequest=0;if(document.hidden)return;
  const frameMs=lastTime?t-lastTime:0,dt=frameMs?Math.min(frameMs/1000,.05):0;lastTime=t;elapsed+=dt;
  if(phase==='playing'){
    if(qa&&frameMs){frameTimes.push(frameMs);if(frameTimes.length>360)frameTimes.shift();}
    if(frameMs&&resolution.sample(frameMs))resizePending=true;
    move(dt);
  }else if(phase==='intro'||(phase==='settings'&&settingsReturn==='intro')){camera.position.set(START.x,1.68,START.z);camera.rotation.set(-.015,START.yaw,0,'YXZ');}
  applyDrawingSize();world.update(elapsed,player);renderer.info.reset();composer.render();renderedFrames++;
  if(phase==='playing')requestRender();else lastTime=0;
}
// Sound scheduling is independent of rendering, including the ending screen.
setInterval(()=>{if(!document.hidden&&(phase==='playing'||phase==='won'))audio.update();},100);
async function init(){
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
    camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.08,80);world=buildScene(renderer,language);renderer.info.autoReset=false;
    composer=new EffectComposer(renderer);composer.setPixelRatio(1);composer.addPass(new RenderPass(world.scene,camera));bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.23,.65,1.6);composer.addPass(bloom);composer.addPass(new OutputPass());
    composer.addPass(new ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse;varying vec2 vUv;float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float vign=smoothstep(.22,.82,length(vUv-.5));c*=1.-vign*.26;c=mix(vec3(dot(c,vec3(.2126,.7152,.0722))),c,.88);c*=vec3(.985,1.008,.977);c+=(hash(gl_FragCoord.xy)-.5)*.009;gl_FragColor=vec4(c,1.);}`}));
    applyQuality();window.addEventListener('resize',()=>{hideInputs();resolution.resetWindow();resize();});await world.warmup(camera);ready=true;requestRender();$('start-label').textContent=t('start');$('start').disabled=false;
    if(qa){window.__corridorQA={anomalies:ANOMALIES.map(a=>a.id),snapshot:()=>({phase,language,progress:run.progress,round:run.round,anomaly:run.anomaly?.id||null,loop:loop.snapshot(),lastCrossing,player:{...player},settings:{...settings},controls:controlMode(),input:{keys:[...keys],virtual:[...virtualKeys],joystick:{...joystick}},audio:audio.snapshot(),scene:world.state(),performance:{maxFrameMs:Math.max(0,...frameTimes),averageFrameMs:frameTimes.reduce((a,b)=>a+b,0)/(frameTimes.length||1),gpu:renderer.info.memory,renderedFrames,quality:settings.quality,scale:resolution.scale,pixelRatio:renderer.getPixelRatio(),width:canvas.width,height:canvas.height,reflection:world.reflector.visible,reflectionSize:world.reflector.getRenderTarget().width,bloom:bloom.enabled},render:renderer.info.render}),resetPerformance:()=>{frameTimes.length=0;},place:(x,z,yaw=0)=>{player.x=x;player.z=z;player.yaw=yaw;},anomaly:id=>{run.anomaly=ANOMALIES.find(a=>a.id===id)||null;loop.previews.clear();world.setAnomaly(run.anomaly?.id||null);},restart};}
  }catch(error){console.error('Corridor startup failed',error);$('error').hidden=false;}
}
init();
