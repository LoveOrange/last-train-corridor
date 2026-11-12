export const ANOMALIES = [
  {id:'wrong-sign',label:'出口指示牌的方向反了'},
  {id:'eyes',label:'海报里的图案变成了一只眼睛'},
  {id:'red-water',label:'地面上出现了暗红色的水迹'},
  {id:'extra-door',label:'墙上多了一扇设备门'},
  {id:'ceiling',label:'前方的天花板异常降低'},
  {id:'double-clock',label:'墙上的时钟变成了两个'},
  {id:'dark-end',label:'通道尽头的灯全都熄灭了'},
  {id:'watcher',label:'尽头出现了一个一直站着的人影'},
  {id:'red-sign',label:'出口牌变成了红色的「请勿离开」'},
  {id:'missing-door',label:'第一扇设备门消失了'},
  {id:'inverted-poster',label:'第一张海报整个倒了过来'},
  {id:'floating-cone',label:'维修路锥悬浮在半空中'},
  {id:'giant-clock',label:'墙上的时钟变得异常巨大'},
  {id:'missing-guide',label:'贯穿地面的盲道消失了'},
  {id:'red-lights',label:'通道里的照明全都变成了红色'},
  {id:'extra-cameras',label:'墙上多出了一整排监控摄像头'},
  {id:'blocked-exit',label:'出口前出现了一道卷帘门'},
  {id:'wall-message',label:'墙上出现了「你已经来过这里」'},
  {id:'footprints',label:'地面上多出了一串深色脚印'},
  {id:'handprints',label:'墙面上多出了一排手印'},
];
export class Run {
  constructor(random=Math.random){this.random=random;this.reset();}
  reset(){this.progress=0;this.round=0;this.anomaly=null;this.won=false;this.deck=[];this.history=[];}
  next({baseline=false}={}){
    this.round++;
    if(baseline){this.anomaly=null;return null;}
    if(!this.deck.length){this.deck=[...ANOMALIES];for(let i=this.deck.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];}}
    this.anomaly=this.random()<0.63?this.deck.pop():null;
    return this.anomaly;
  }
  capture(){return {progress:this.progress,round:this.round,anomaly:this.anomaly,won:this.won,deck:[...this.deck],history:[...this.history]};}
  preview(direction){
    const draft=new Run(this.random);Object.assign(draft,this.capture());
    const result=draft.choose(direction);
    if(result){if(result.won)draft.anomaly=null;else draft.next({baseline:!result.correct});}
    return {result,state:draft.capture()};
  }
  commit(preview){const {deck,history,...state}=preview.state;Object.assign(this,state,{deck:[...deck],history:[...history]});}
  choose(direction){
    if(this.won)return null;
    if(!['forward','back'].includes(direction))throw new Error('Unknown direction');
    const correct=(direction==='back')===Boolean(this.anomaly);
    const result={correct,direction,anomaly:this.anomaly,previous:this.progress};
    this.progress=correct?this.progress+1:0;
    this.won=this.progress>=8;
    this.history.push(result);
    return {...result,progress:this.progress,won:this.won};
  }
}

// Failure explanations belong to the previous passage and are opt-in only.
export function failureHint(result,difficulty='normal'){
  if(difficulty!=='easy'||!result||result.correct)return null;
  return result.anomaly?`刚才，${result.anomaly.label}。发现异常时应原路返回。`:'刚才的通道没有异常，应继续前进。';
}
