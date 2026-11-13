// Hold state belongs to one contact. Global release listeners remain effective
// when a WebView cannot provide pointer capture or a finger leaves the control.
export function bindJoystick(element,{enabled,onChange}){
  let mode=null,pointerId=null,pointerType=null,touchId=null;
  const win=element.ownerDocument.defaultView,doc=element.ownerDocument;
  const findTouch=(list,id)=>Array.from(list||[]).find(t=>t.identifier===id);
  function reset(){
    const id=pointerId;
    mode=null;pointerId=null;pointerType=null;touchId=null;
    onChange(0,0);
    try{if(id!==null&&element.hasPointerCapture?.(id))element.releasePointerCapture(id);}catch{}
  }
  function move(contact){
    if(!enabled()){reset();return;}
    const b=element.getBoundingClientRect(),radius=Math.max(1,b.width*.38);
    let x=(contact.clientX-b.left-b.width/2)/radius,y=(contact.clientY-b.top-b.height/2)/radius;
    const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
    onChange(x,y);
  }
  element.addEventListener('pointerdown',event=>{
    if(!enabled()||mode!==null||event.button!==0)return;
    if(event.pointerType!=='touch')event.preventDefault();
    mode='pointer';pointerId=event.pointerId;pointerType=event.pointerType;
    // Touch has implicit capture; do not suppress its Touch Events fallback.
    if(pointerType!=='touch')try{element.setPointerCapture(event.pointerId);}catch{}
    move(event);
  });
  win.addEventListener('pointermove',event=>{
    if(mode!=='pointer'||event.pointerId!==pointerId)return;
    if(event.buttons===0){reset();return;}
    move(event);
  },true);
  function endPointer(event){
    if(event.pointerId===pointerId)reset();
  }
  win.addEventListener('pointerup',endPointer,true);
  win.addEventListener('pointercancel',endPointer,true);
  element.addEventListener('lostpointercapture',event=>{
    if(mode==='pointer'&&event.pointerId===pointerId)reset();
  });
  element.addEventListener('touchstart',event=>{
    if(!enabled()||mode==='touch'||(mode==='pointer'&&pointerType!=='touch'))return;
    const contact=event.changedTouches[0];if(!contact)return;
    mode='touch';touchId=contact.identifier;
    // Retain pointerId to accept a matching pointercancel/up as well.
    event.preventDefault();move(contact);
  },{passive:false});
  win.addEventListener('touchmove',event=>{
    if(mode!=='touch')return;
    const contact=findTouch(event.touches,touchId);
    if(!contact){reset();return;}
    event.preventDefault();move(contact);
  },{capture:true,passive:false});
  function endTouch(event){
    if(mode==='touch'&&!findTouch(event.touches,touchId))reset();
    else if(mode==='pointer'&&pointerType==='touch'&&event.touches.length===0)reset();
  }
  win.addEventListener('touchend',endTouch,true);
  win.addEventListener('touchcancel',endTouch,true);
  // A new contact can reveal a missed release from a previous native gesture.
  win.addEventListener('touchstart',event=>{
    if(mode==='touch'&&!findTouch(event.touches,touchId))reset();
  },true);
  win.addEventListener('blur',reset);
  win.addEventListener('pagehide',reset);
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)reset();});
  element.addEventListener('contextmenu',event=>{event.preventDefault();reset();});
  return {reset};
}
