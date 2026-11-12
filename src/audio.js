import {resolveLanguage,selectVoice,translate} from './i18n.js';
// All instruments, room tone, impulse response and footsteps are synthesized locally.
const midi=n=>440*2**((n-69)/12);
const CHORDS=[[38,57,60,64],[41,57,60,67],[34,53,57,60],[33,55,58,64]];
const MELODY=[[74,81,76],[72,79,69],[77,74,81],[76,70,73]];
export class Ambience {
  constructor(onCaption=()=>{}){
    this.context=null;this.enabled=false;this.paused=true;this.stepAt=0;this.bar=0;this.nextBar=0;this.notes=0;this.onCaption=onCaption;this.settings={volume:.65,music:.6,sfx:.75,voice:.8,muted:false};
    this.language='zh-CN';this.speech=globalThis.speechSynthesis;
    this.refreshVoices();this.speech?.addEventListener('voiceschanged',()=>this.refreshVoices());
  }
  refreshVoices(){this.voice=selectVoice(this.speech?.getVoices()||[],this.language);this.voiceState=translate(this.language,this.voice?'voiceReady':this.speech?'voiceMissing':'voiceUnavailable');}
  configure(settings,language=resolveLanguage(settings.language)){if(language!==this.language)this.speech?.cancel();this.language=language;this.settings={...settings};this.enabled=!settings.muted&&settings.volume>0;this.refreshVoices();this.applyLevels();if(!this.enabled||!settings.voice)this.speech?.cancel();}
  applyLevels(){if(!this.context)return;const t=this.context.currentTime;this.master.gain.setTargetAtTime(this.enabled&&!this.paused?this.settings.volume:0,t,.12);this.musicBus.gain.setTargetAtTime(this.settings.music,t,.12);this.sfxBus.gain.setTargetAtTime(this.settings.sfx,t,.12);}
  async activate(){
    if(!this.enabled)return false;
    if(!this.context){
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
      const c=this.context=new C();this.master=c.createGain();this.master.gain.value=0;
      const limiter=c.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=5;
      this.analyser=c.createAnalyser();this.analyser.fftSize=256;this.master.connect(limiter).connect(this.analyser).connect(c.destination);
      this.musicBus=c.createGain();this.musicBus.connect(this.master);this.sfxBus=c.createGain();this.sfxBus.connect(this.master);
      this.reverb=c.createConvolver();const impulse=c.createBuffer(2,c.sampleRate*2.8,c.sampleRate);
      for(let ch=0;ch<2;ch++){const a=impulse.getChannelData(ch);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.exp(-i/a.length*7);}
      this.reverb.buffer=impulse;const wet=c.createGain();wet.gain.value=.3;this.reverb.connect(wet).connect(this.musicBus);
      const hum=c.createOscillator(),humGain=c.createGain();hum.frequency.value=100;humGain.gain.value=.012;hum.connect(humGain).connect(this.sfxBus);hum.start();
      const air=c.createBuffer(1,c.sampleRate*4,c.sampleRate),a=air.getChannelData(0);let p=0;for(let i=0;i<a.length;i++){p=(p+(Math.random()*2-1)*.018)/1.018;a[i]=p;}
      const source=c.createBufferSource();source.buffer=air;source.loop=true;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=500;const gain=c.createGain();gain.gain.value=.32;source.connect(filter).connect(gain).connect(this.sfxBus);source.start();
      this.nextBar=c.currentTime+.15;
    }
    await this.context.resume();this.applyLevels();return true;
  }
  tone(note,at,duration,amplitude,type='sine',bus=this.musicBus,pan=0){
    const c=this.context,o=c.createOscillator(),g=c.createGain(),p=c.createStereoPanner();o.type=type;o.frequency.value=midi(note);p.pan.value=pan;
    g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(amplitude,at+Math.min(.8,duration*.12));g.gain.exponentialRampToValueAtTime(.0001,at+duration);
    o.connect(g).connect(p).connect(bus);if(bus===this.musicBus)p.connect(this.reverb);
    o.start(at);o.stop(at+duration+.02);this.notes++;
    o.onended=()=>{o.disconnect();g.disconnect();p.disconnect();};
  }
  update(){
    if(!this.context||!this.enabled||this.paused||this.context.state!=='running')return;
    const now=this.context.currentTime;if(this.nextBar<now-.5)this.nextBar=now+.1;
    if(now+.2<this.nextBar)return;
    // A slow, four-chord original loop. No musical cue reveals whether an anomaly is present.
    const at=this.nextBar,index=this.bar++%4,beat=60/48;
    CHORDS[index].forEach((n,i)=>{this.tone(n,at,beat*9,i===0?.046:.022,'sine',this.musicBus,(i-1.5)*.22);if(i>0)this.tone(n+.04,at,beat*8,.009,'sine',this.musicBus,-.35);});
    MELODY[index].forEach((n,i)=>{this.tone(n,at+(i*2+1)*beat,3.2,.034,'sine',this.musicBus,i%2?.5:-.5);this.tone(n+12,at+(i*2+1)*beat,1.7,.006);});
    this.nextBar+=beat*8;
  }
  step(speed=1){
    if(!this.enabled||this.paused||!this.context)return;const c=this.context,now=c.currentTime;if(now-this.stepAt<.34/speed)return;this.stepAt=now;
    const buffer=c.createBuffer(1,c.sampleRate*.13,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*9);
    const src=c.createBufferSource();src.buffer=buffer;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;const gain=c.createGain();gain.gain.value=.2;
    src.connect(filter).connect(gain).connect(this.sfxBus);src.start();src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};
  }
  chime(success){if(!this.context||!this.enabled)return;[0,.16].forEach((d,i)=>this.tone(success?[69,76][i]:[57,53][i],this.context.currentTime+d,.7,.07,'sine',this.sfxBus));}
  announce(text,{preview=false}={}){
    this.onCaption(text);this.refreshVoices();
    if(!this.speech||!this.voice||!this.enabled||!this.settings.voice||(this.paused&&!preview))return;
    this.speech.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=this.voice.lang;u.voice=this.voice;u.rate=.82;u.pitch=.85;u.volume=this.settings.volume*this.settings.voice;
    u.onerror=e=>{if(!['canceled','interrupted'].includes(e.error))this.voiceState=translate(this.language,'voiceError');};this.speech.speak(u);
  }
  pause(paused){this.paused=paused;this.applyLevels();if(paused)this.speech?.cancel();}
  snapshot(){const data=new Float32Array(256);this.analyser?.getFloatTimeDomainData(data);return {enabled:this.enabled,paused:this.paused,state:this.context?.state||'uninitialized',bars:this.bar,notes:this.notes,rms:Math.sqrt(data.reduce((s,n)=>s+n*n,0)/data.length),voice:this.voiceState};}
}
