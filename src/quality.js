// All presets retain the same geometry, lighting cues and anomaly visibility.
export const QUALITY={
  smooth:{label:'流畅',dpr:1,pixels:900000,shadow:512,reflection:0,bloom:0,help:'优先流畅与续航，保留基础光照和阴影，关闭地面实时反射与泛光。'},
  balanced:{label:'均衡',dpr:1.25,pixels:1600000,shadow:768,reflection:512,bloom:.18,help:'推荐：保留柔和泛光与地面实时反射，兼顾画面和流畅度。'},
  high:{label:'高画质',dpr:1.5,pixels:3000000,shadow:1024,reflection:768,bloom:.23,help:'更清晰的画面、阴影与地面反射，适合性能充足的设备。'}
};
export function pixelRatio(profile,width,height,dpr=1,scale=1){
  return Math.min(dpr,profile.dpr,Math.sqrt(profile.pixels/Math.max(1,width*height)))*scale;
}

// Frame intervals include GPU/vsync stalls; simulation's clamped dt must not be used.
// Downshift promptly, recover slowly, and never count time spent paused/hidden.
export class AdaptiveResolution {
  constructor(){this.scale=1;this.resetWindow();}
  resetWindow(){this.ms=0;this.count=0;this.slow=0;this.worst=0;this.stable=0;}
  reset(){this.scale=1;this.resetWindow();}
  sample(frameMs){
    if(!Number.isFinite(frameMs)||frameMs<=0||frameMs>250){this.resetWindow();return false;}
    this.ms+=frameMs;this.count++;this.worst=Math.max(this.worst,frameMs);if(frameMs>22)this.slow++;
    if(this.ms<1200)return false;
    // Ignore one isolated stall, but react to sustained 55–58 FPS as well as 30 FPS.
    const average=(this.ms-this.worst)/(this.count-1),unstable=average>17.1||this.slow/this.count>.08;
    const old=this.scale;
    if(unstable){this.scale=Math.max(.55,this.scale-.1);this.stable=0;}
    else if(average<16.95&&this.slow/this.count<.02){
      this.stable+=this.ms;
      if(this.stable>=12000){this.scale=Math.min(1,this.scale+.05);this.stable=0;}
    }else this.stable=0;
    this.ms=0;this.count=0;this.slow=0;this.worst=0;
    return Math.abs(old-this.scale)>.001;
  }
}
