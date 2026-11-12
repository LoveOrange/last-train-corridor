import {translate} from './i18n.js';
import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {fromHall,floorRects,slideMove,BEND_RECTS,bendWalls,START} from './layout.js';
import {STAIRS,STAIR_END,STAIR_TOP,handrailProfile} from './stairs.js';
import { tiles as makeTiles,floorTexture as makeFloor,ceilingTexture as makeCeiling,label as makeLabel,poster as makePoster,shadowTexture as makeShadow,puddleTexture as makePuddle,canvasTexture,seeded } from './textures.js';

const standard=(color,roughness=.6,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const dark=standard('#28352f',.65,.3),steel=standard('#8e9890',.34,.8),trim=standard('#64766a',.45,.35),yellow=standard('#bca65a',.63,.05);
const unitBox=new T.BoxGeometry(1,1,1);
// Batch fixed box details only within their own parent. Anomaly groups keep their
// visibility/transforms, and independently toggled props stay separate.
function batchFixedBoxes(root,keep=new Set()){
  const groups=new Map();
  for(const child of [...root.children]){
    if(child.isGroup)batchFixedBoxes(child,keep);
    if(!child.isMesh||child.isInstancedMesh||child.geometry!==unitBox||keep.has(child))continue;
    const key=`${child.material.uuid}:${child.castShadow}:${child.receiveShadow}`;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(child);
  }
  for(const meshes of groups.values())if(meshes.length>1){
    const batch=new T.InstancedMesh(unitBox,meshes[0].material,meshes.length);
    batch.castShadow=meshes[0].castShadow;batch.receiveShadow=meshes[0].receiveShadow;
    meshes.forEach((mesh,i)=>{mesh.updateMatrix();batch.setMatrixAt(i,mesh.matrix);root.remove(mesh);});
    batch.computeBoundingSphere();root.add(batch);
  }
}
// The three recycled rooms and four bends share image sources and immutable decals.
const surfaceSources={},decalCache=new Map();
function surface(name,make){return (surfaceSources[name]??=make()).clone();}
const tiles=()=>surface('tile',makeTiles),floorTexture=()=>surface('floor',makeFloor),ceilingTexture=()=>surface('ceiling',makeCeiling);
function decal(key,make){if(!decalCache.has(key))decalCache.set(key,make());return decalCache.get(key);}
const label=(...args)=>decal('label:'+JSON.stringify(args),()=>makeLabel(...args));
const poster=(...args)=>decal('poster:'+JSON.stringify(args),()=>makePoster(...args));
const shadowTexture=()=>decal('shadow',makeShadow),puddleTexture=()=>decal('puddle',makePuddle);

const numberedSigns=new Map();
function signTexture(progress,wrong=false,language='zh-CN'){
  const key=`${language}:${progress}:${wrong}`;
  if(!numberedSigns.has(key))numberedSigns.set(key,label(`${wrong?'↓':'↑'}  ${translate(language,'scene.exit',{number:String(progress).padStart(2,'0')})}`,'SOUTH EXIT','#e9edda','#174a3b'));
  return numberedSigns.get(key);
}
function landingTexture(progress,language){return label(`←  ${translate(language,'scene.exit',{number:String(progress).padStart(2,'0')})}`,'SOUTH EXIT','#e9edda','#174a3b');}
function buildHall(language){
  const t=(key,values)=>translate(language,'scene.'+key,values),localizedBoards=[];
  const scene=new T.Group();
  const architecture=new T.Group();scene.add(architecture);const colliders=[];const allLights=[],fixtures=[];
  function box(w,h,d,x,y,z,mat=dark,parent=architecture){const m=new T.Mesh(unitBox,mat);m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function plane(w,h,x,y,z,mat,parent=architecture,ry=0){const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.y=ry;m.receiveShadow=true;parent.add(m);return m;}
  function board(texture,w,h,x,y,z,ry=0,parent=architecture,emissive=.13){const mat=new T.MeshStandardMaterial({map:texture,roughness:.45,metalness:.03,emissive:'#ffffff',emissiveMap:texture,emissiveIntensity:emissive});return plane(w,h,x,y,z,mat,parent,ry);}
  function localizedBoard(texture,...args){const mesh=board(texture(),...args);localizedBoards.push(()=>{mesh.material.map=mesh.material.emissiveMap=texture();});return mesh;}
  const tileMap=tiles();tileMap.wrapS=tileMap.wrapT=T.RepeatWrapping;tileMap.repeat.set(44/1.2,3.4/1.2);
  const wall=new T.MeshStandardMaterial({map:tileMap,roughness:.28,metalness:.04,bumpMap:tileMap,bumpScale:.012});
  wall.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRoomP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRoomP=(modelMatrix*vec4(position,1.)).xyz;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vRoomP;').replace('#include <opaque_fragment>','float edge=min(vRoomP.y,3.4-vRoomP.y);float age=sin(vRoomP.z*8.7)*sin(vRoomP.z*3.13+1.);outgoingLight*=mix(.51,1.,smoothstep(0.,.52,edge));outgoingLight*=1.-(age*.5+.5)*.09*exp(-vRoomP.y*2.);\n#include <opaque_fragment>');};
  plane(44,3.4,-3,1.7,-17,wall,architecture,Math.PI/2);plane(44,3.4,3,1.7,-17,wall,architecture,-Math.PI/2);
  const fMap=floorTexture();fMap.wrapS=fMap.wrapT=T.RepeatWrapping;fMap.repeat.set(6,44);
  const floorMat=new T.MeshStandardMaterial({map:fMap,roughness:.37,metalness:.15,bumpMap:fMap,bumpScale:.018});
  floorMat.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFloorP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvFloorP=position;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vFloorP;').replace('#include <opaque_fragment>','outgoingLight*=mix(.36,1.,smoothstep(0.,.65,3.-abs(vFloorP.x)));\n#include <opaque_fragment>');};
  const floor=plane(6,44,0,-.015,-17,floorMat);floor.rotation.x=-Math.PI/2;
  const cMap=ceilingTexture();cMap.wrapS=cMap.wrapT=T.RepeatWrapping;cMap.repeat.set(6,44);
  const ceiling=plane(6,44,0,3.4,-17,new T.MeshStandardMaterial({map:cMap,roughness:.9}));ceiling.rotation.x=Math.PI/2;
  for(const side of [-1,1]){
    box(.055,.20,44,side*2.965,.1,-17,trim);box(.035,.045,44,side*2.967,1.16,-17,trim);box(.05,.1,44,side*2.96,3.24,-17,dark);
    box(.055,.035,44,side*2.969,1.22,-17,new T.MeshStandardMaterial({color:'#b4a97c',roughness:.4}));
  }
  // Instanced ceramic tactile ribs: physical geometry catches the overhead lights.
  const guideBase=box(.54,.023,44,0,.008,-17,yellow);
  const ribs=new T.InstancedMesh(unitBox,yellow,5*86);let ri=0;const matrix=new T.Matrix4();
  for(let z=4;z>-39;z-=.5)for(let j=0;j<5;j++){matrix.compose(new T.Vector3(-.2+j*.1,.031,z-.22),new T.Quaternion(),new T.Vector3(.025,.025,.38));ribs.setMatrixAt(ri++,matrix);}ribs.receiveShadow=true;architecture.add(ribs);
  const normalLightMaterial=new T.MeshStandardMaterial({color:'#e6edd4',emissive:'#e5f2c9',emissiveIntensity:4.3,roughness:.3});
  for(let i=0;i<8;i++){
    const z=2-i*5.4;const group=new T.Group();architecture.add(group);group.position.z=z;
    for(const x of [-1.05,1.05]){box(.30,.10,2.05,x,3.30,0,dark,group);box(.22,.025,1.89,x,3.24,0,normalLightMaterial,group);for(let k=0;k<9;k++)box(.25,.015,.015,x,3.223,-.85+k*.21,steel,group);}
    fixtures.push(group);
    const area=new T.RectAreaLight('#edf1d5',5.8,3.4,1.9);area.position.set(0,3.21,z);area.rotation.x=-Math.PI/2;scene.add(area);allLights.push(area);
    if(i===1||i===5){const spot=new T.SpotLight('#e2eccb',30,11,1.05,.75,1.5);spot.position.set(0,3.16,z);spot.target.position.set(.4,0,z-1);spot.castShadow=true;spot.shadow.mapSize.set(1024,1024);spot.shadow.bias=-.0003;spot.shadow.normalBias=.025;scene.add(spot,spot.target);allLights.push(spot);}
  }
  let progress=0;
  let signRed=label(t('stay'),'PLEASE STAY HERE','#ffded1','#6c211a');
  const signs=[];
  for(const z of [-4,-30]){
    const g=new T.Group();g.position.set(0,2.67,z);architecture.add(g);
    box(3.25,.62,.15,0,0,0,dark,g);for(const x of [-1.3,1.3])box(.018,.45,.018,x,.49,0,steel,g);
    signs.push(board(signTexture(0,false,language),3.15,.52,0,0,.079,0,g,.55));
    signs.push(board(signTexture(0,false,language),3.15,.52,0,0,-.079,Math.PI,g,.55));
  }
  const frontSign=signs[0];
  function updateSigns(){const map=anomaly==='red-sign'?signRed:signTexture(progress,anomaly==='wrong-sign',language);for(const sign of signs){sign.material.map=map;sign.material.emissiveMap=map;}}
  localizedBoard(()=>label(t('moving'),'KEEP MOVING','#384a40','#d0d3bc'),1.1,.28,-2.965,2.65,-3,Math.PI/2);
  localizedBoard(()=>label(t('station'),'KITAGAWA STATION','#dce4d3','#3d5b4e'),1.55,.45,2.961,2.7,-10,-Math.PI/2);
  const posterMeshes=[],posterGroups=[];const posterTextures=[];
  for(let i=0;i<3;i++){
    const g=new T.Group();g.position.set(-2.93,1.83,-9-i*6.2);g.rotation.y=Math.PI/2;architecture.add(g);posterGroups.push(g);
    box(1.45,2.03,.065,0,0,0,steel,g);box(1.39,1.97,.035,0,0,.045,dark,g);
    const map=poster(i,false,language);posterTextures.push(map);const m=board(map,1.30,1.86,0,0,.071,0,g,.12);posterMeshes.push(m);
    const glass=plane(1.31,1.87,0,0,.074,new T.MeshPhysicalMaterial({color:'#b8cec6',transparent:true,opacity:.045,roughness:.1,metalness:.6}),g);glass.renderOrder=3;
  }
  let eyePoster=poster(1,true,language);
  function door(x,z,number,extra=false){
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=x>0?-Math.PI/2:Math.PI/2;architecture.add(g);
    box(1.2,2.52,.13,0,1.26,0,dark,g);const d=box(1.06,2.38,.025,0,1.23,.08,standard('#899a8d',.6,.3),g);
    localizedBoard(()=>label(t('staff',{number}),'STAFF ONLY','#243e31','#b4bead',512,180),.59,.20,0,1.95,.1,0,g,0);
    box(.028,.22,.045,.37,1.07,.12,steel,g);box(.17,.035,.065,.31,1.14,.16,steel,g);
    for(let y=0;y<8;y++)box(.68,.015,.018,0,.32+y*.05,.11,dark,g);
    box(.028,2.37,.012,-.51,1.23,.1,steel,g);box(.028,2.37,.012,.51,1.23,.1,steel,g);
    if(extra)g.visible=false;return g;
  }
  const firstDoor=door(2.93,-13,'01');door(2.93,-26,'02');const extraDoor=door(-2.93,-28,'03',true);
  const exitLight=new T.PointLight('#b8eacb',5,8,1.5);exitLight.position.set(0,2.3,-38);scene.add(exitLight);
  const inletLight=new T.PointLight('#cfddae',5,8,1.5);inletLight.position.set(0,2.2,4);scene.add(inletLight);
  const clockFace=canvasTexture(512,512,(c,w,h)=>{c.fillStyle='#dadfd0';c.fillRect(0,0,w,h);c.translate(w/2,h/2);c.strokeStyle='#1c3127';c.fillStyle='#22372c';for(let i=0;i<60;i++){c.save();c.rotate(i/60*Math.PI*2);c.fillRect(-2,-225,4,i%5===0?23:10);c.restore();}c.font='32px Arial';c.textAlign='center';c.textBaseline='middle';for(let i=1;i<=12;i++){const a=i/12*Math.PI*2;c.fillText(String(i),Math.sin(a)*178,-Math.cos(a)*178);}c.lineWidth=12;c.beginPath();c.moveTo(0,22);c.lineTo(0,-105);c.stroke();c.lineWidth=7;c.beginPath();c.moveTo(-15,15);c.lineTo(125,-115);c.stroke();c.fillStyle='#815843';c.beginPath();c.arc(0,0,12,0,Math.PI*2);c.fill();});
  function clock(z){const g=new T.Group();g.position.set(2.91,2.35,z);g.rotation.y=-Math.PI/2;architecture.add(g);const rim=new T.Mesh(new T.CylinderGeometry(.32,.32,.08,48),steel);rim.rotation.x=Math.PI/2;g.add(rim);const face=new T.Mesh(new T.CircleGeometry(.29,48),new T.MeshStandardMaterial({map:clockFace,roughness:.6}));face.position.z=.045;g.add(face);return g;}
  const mainClock=clock(-7.1);const extraClock=clock(-8.0);extraClock.visible=false;
  const emergencyMat=standard('#802b25',.4,.12);
  for(const z of [-17.3,-30.7]){
    const g=new T.Group();g.position.set(2.88,1.05,z);g.rotation.y=-Math.PI/2;architecture.add(g);
    box(.69,1.11,.19,0,0,0,steel,g);box(.60,1.02,.024,0,0,.112,emergencyMat,g);
    localizedBoard(()=>label(t('fire'),'FIRE HYDRANT','#efe5d1','#8d3028',512,256),.47,.23,0,.23,.13,0,g,.05);
    box(.12,.025,.035,.17,-.10,.145,steel,g);const led=new T.Mesh(new T.SphereGeometry(.021,8,8),new T.MeshBasicMaterial({color:'#f65d3f'}));led.position.set(0,.66,.1);g.add(led);
    const light=new T.PointLight('#cc3220',.35,1.8,2);light.position.set(2.6,1.72,z);scene.add(light);
  }
  for(const z of [-4,-22,-32]){
    box(.7,.34,.07,2.92,2.95,z,dark);for(let i=0;i<7;i++)box(.03,.028,.65,2.87,2.83+i*.038,z,steel);
  }
  const security=new T.Group();security.position.set(-2.6,3.05,-4.8);architecture.add(security);box(.16,.13,.2,0,0,0,steel,security);const lens=new T.Mesh(new T.SphereGeometry(.085,16,10),dark);lens.position.set(.035,-.03,.12);security.add(lens);security.rotation.y=.5;
  // Soft local contact shadows anchor props without a full-screen AO pass.
  const shadowMap=shadowTexture();function contact(x,z,w,d){const m=plane(w,d,x,.008,z,new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;return m;}
  const binMat=standard('#718376',.37,.7);box(.49,.86,.43,2.57,.43,-9.8,binMat);box(.51,.07,.45,2.57,.91,-9.8,dark);box(.37,.12,.015,2.57,.75,-9.572,dark);contact(2.56,-9.8,1,.9);colliders.push({x:2.57,z:-9.8,w:.5,d:.44});
  // A maintenance cone adds a familiar, fixed reference point.
  const cone=new T.Group();cone.position.set(-2.31,0,-24.7);architecture.add(cone);box(.42,.035,.42,0,.025,0,dark,cone);const coneMesh=new T.Mesh(new T.ConeGeometry(.18,.66,32),standard('#ad6538',.8));coneMesh.position.y=.36;cone.add(coneMesh);const stripe=new T.Mesh(new T.CylinderGeometry(.085,.12,.13,32),standard('#d1d4bf',.8));stripe.position.y=.4;cone.add(stripe);contact(-2.31,-24.7,.9,.9);colliders.push({x:-2.31,z:-24.7,w:.42,d:.42});
  const blood=new T.Mesh(new T.PlaneGeometry(3.6,4.6),new T.MeshStandardMaterial({map:puddleTexture(),transparent:true,depthWrite:false,roughness:.15,metalness:.1}));blood.rotation.x=-Math.PI/2;blood.position.set(.85,.013,-18);blood.renderOrder=4;blood.visible=false;architecture.add(blood);
  const lowerCeiling=new T.Group();architecture.add(lowerCeiling);box(5.98,1.25,12,0,2.78,-26,new T.MeshStandardMaterial({map:cMap,roughness:.85}),lowerCeiling);box(5.99,.08,.1,0,2.16,-20,trim,lowerCeiling);lowerCeiling.visible=false;
  const watcher=new T.Group();watcher.position.set(1.45,0,-31.5);architecture.add(watcher);const black=standard('#101b16',.95);const body=new T.Mesh(new T.CapsuleGeometry(.23,.65,5,10),black);body.position.y=1.05;watcher.add(body);const head=new T.Mesh(new T.SphereGeometry(.155,16,14),black);head.scale.y=1.2;head.position.y=1.67;watcher.add(head);for(const x of [-.13,.13]){box(.15,.64,.17,x,.35,0,black,watcher);box(.13,.68,.14,x*2.05,1.0,0,black,watcher);}watcher.visible=false;
  // Each extra anomaly owns a small group and is reset explicitly between passages.
  const extraCameras=new T.Group();architecture.add(extraCameras);
  for(let i=0;i<7;i++){const clone=security.clone();clone.position.set(-2.6,3.05,-10-i*3);clone.rotation.y=.8;extraCameras.add(clone);}
  const shutter=new T.Group();architecture.add(shutter);
  box(5.85,.22,.14,0,3.15,-35,steel,shutter);
  for(let i=0;i<17;i++)box(5.85,.16,.13,0,.19+i*.17,-35,trim,shutter);
  localizedBoard(()=>label(t('closed'),t('noExit'),'#dfd4a4','#344238'),1.8,.4,0,1.7,-34.92,0,shutter,.1);
  // Transparent writing is cached per language, like the other shared decals.
  const writingTexture=()=>decal('writing:'+language,()=>canvasTexture(1024,256,c=>{c.fillStyle='#373b31';c.font='bold 80px serif';c.textAlign='center';c.fillText(t('wall'),512,147,950);}));
  const writing=board(writingTexture(),2.6,.65,-2.96,1.7,-17,Math.PI/2);
  localizedBoards.push(()=>{writing.material.map=writingTexture();});
  writing.material.emissiveMap=null;writing.material.transparent=true;writing.material.emissiveIntensity=0;
  const prints=new T.Group();architecture.add(prints);
  const footprint=canvasTexture(128,256,c=>{c.fillStyle='rgba(37,43,31,.8)';c.beginPath();c.ellipse(64,91,34,69,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(64,200,26,30,0,0,Math.PI*2);c.fill();});
  const printMat=new T.MeshStandardMaterial({map:footprint,transparent:true,depthWrite:false,roughness:.92});
  for(let i=0;i<16;i++){const m=plane(.23,.44,1.1+(i%2)*.38,.018,-12-i*.48,printMat,prints);m.rotation.x=-Math.PI/2;m.rotation.z=(i%2?-.12:.12);m.renderOrder=4;}
  const handprints=new T.Group();architecture.add(handprints);
  const handTexture=canvasTexture(256,256,c=>{c.fillStyle='rgba(30,38,29,.78)';c.beginPath();c.ellipse(126,153,55,56,-.12,0,Math.PI*2);c.fill();for(const [x,y,w,h,a] of [[71,103,15,61,-.2],[104,81,15,67,-.06],[139,77,15,72,.07],[172,102,14,55,.23],[196,163,15,48,.7]]){c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.ellipse(0,0,w,h,0,0,Math.PI*2);c.fill();c.restore();}});
  const handMat=new T.MeshStandardMaterial({map:handTexture,transparent:true,depthWrite:false,roughness:.9});
  for(let i=0;i<9;i++){const m=plane(.45,.48,2.96,1.4+Math.sin(i*3)*.28,-19-i*.43,handMat,handprints,-Math.PI/2);m.rotateZ(Math.sin(i)*.3);}
  const lightColors=allLights.map(l=>l.color.clone());
  // Faint particles make the deep pools of light perceptible without covering the scene in fog.
  const rng=seeded(17),positions=new Float32Array(180*3);for(let i=0;i<180;i++){positions[i*3]=(rng()-.5)*5.4;positions[i*3+1]=rng()*3.1;positions[i*3+2]=3-rng()*40;}const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(positions,3));const dust=new T.Points(dustGeo,new T.PointsMaterial({color:'#e1e6c9',size:.009,transparent:true,opacity:.24,depthWrite:false}));scene.add(dust);
  let anomaly=null;
  const variantGroups={ 'extra-door':extraDoor,'double-clock':extraClock,'red-water':blood,ceiling:lowerCeiling,watcher,'extra-cameras':extraCameras,'blocked-exit':shutter,'wall-message':writing,footprints:prints,handprints };
  function setAnomaly(id){
    anomaly=id;
    updateSigns();
    posterMeshes[1].material.map=id==='eyes'?eyePoster:posterTextures[1];posterMeshes[1].material.emissiveMap=posterMeshes[1].material.map;
    for(const [key,group] of Object.entries(variantGroups))group.visible=id===key;
    firstDoor.visible=id!=='missing-door';
    posterGroups[0].rotation.z=id==='inverted-poster'?Math.PI:0;
    cone.position.y=id==='floating-cone'?.95:0;
    mainClock.scale.setScalar(id==='giant-clock'?2.8:1);
    mainClock.position.y=id==='giant-clock'?1.8:2.35;
    guideBase.visible=ribs.visible=id!=='missing-guide';
    allLights.forEach((l,i)=>{l.visible=!(id==='dark-end'&&l.position.z<-18);l.color.copy(lightColors[i]);if(id==='red-lights')l.color.set('#ff4133');});
    normalLightMaterial.emissive.set(id==='red-lights'?'#ff382a':'#e5f2c9');
    fixtures.forEach((g,i)=>{g.visible=!(id==='dark-end'&&i>=4);});
    exitLight.intensity=id==='dark-end'?1.5:5;
    watcher.rotation.y=0;
  }
  function update(time){dust.rotation.z=Math.sin(time*.06)*.003;if(anomaly==='watcher')watcher.rotation.y=Math.sin(time*.12)*.025;}
  function state(){return {language,signText:anomaly==='red-sign'?t('stay'):t('exit',{number:String(progress).padStart(2,'0')}),anomaly,signTexture:frontSign.material.map.uuid,posterTexture:posterMeshes[1].material.map.uuid,visibleVariants:Object.entries(variantGroups).filter(([,g])=>g.visible).map(([id])=>id),firstDoor:firstDoor.visible,posterRotation:posterGroups[0].rotation.z,coneHeight:cone.position.y,clockScale:mainClock.scale.x,guide:guideBase.visible,lightColor:allLights[0].color.getHexString(),progress,exit:exitArchitecture.visible};}
  // A real stairwell is revealed as passage 08; completion happens after walking upstairs.
  const exitArchitecture=new T.Group();scene.add(exitArchitecture);exitArchitecture.visible=false;
  const exitWall=standard('#d6d9c5',.72),stepMat=standard('#c8c9b3',.55);
  box(6,.12,44,0,-.07,-17,floorMat,exitArchitecture);
  for(const x of [-3,3])box(.15,5.2,44,x,2.6,-17,exitWall,exitArchitecture);
  box(6,.15,44,0,5.2,-17,exitWall,exitArchitecture);
  for(let i=0;i<STAIRS.count;i++){
    const height=(i+1)*STAIRS.rise,z=STAIRS.startZ-i*STAIRS.tread;
    box(5.8,height,STAIRS.tread,0,height/2,z-STAIRS.tread/2,stepMat,exitArchitecture);
    box(5.8,.025,.04,0,height+.012,z-.02,yellow,exitArchitecture);
  }
  box(5.8,STAIR_TOP,4,0,STAIR_TOP/2,STAIR_END-2,stepMat,exitArchitecture);
  const day=new T.MeshBasicMaterial({color:'#fff2cf'});plane(5.8,3.7,0,3.25,-18,day,exitArchitecture);
  localizedBoard(()=>label(t('finalExit'),'EXIT / STREET LEVEL','#24382b','#eadb9b'),3.8,.75,0,3.1,-5,0,exitArchitecture,.5);
  const daylight=new T.RectAreaLight('#fff0c6',14,5,3.5);daylight.position.set(0,3.2,-17.8);exitArchitecture.add(daylight);
  const rails=handrailProfile();
  for(const x of [-2.5,2.5]){
    for(const b of rails.beams){const rail=box(.05,.05,b.length,x,b.y,b.z,steel,exitArchitecture);rail.rotation.x=b.pitch;}
    for(const p of rails.posts)box(.035,p.height,.035,x,p.y,p.z,steel,exitArchitecture);
  }
  function setExit(enabled){architecture.visible=!enabled;dust.visible=!enabled;exitArchitecture.visible=enabled;}
  function setLanguage(next){
    if(next===language)return;language=next;
    signRed=label(t('stay'),'PLEASE STAY HERE','#ffded1','#6c211a');eyePoster=poster(1,true,language);
    localizedBoards.forEach(update=>update());
    posterMeshes.forEach((mesh,i)=>{posterTextures[i]=poster(i,false,language);mesh.material.map=mesh.material.emissiveMap=i===1&&anomaly==='eyes'?eyePoster:posterTextures[i];});
    updateSigns();
  }
  setAnomaly(null);
  batchFixedBoxes(scene,new Set([guideBase]));
  return {root:scene,colliders,setLanguage,setAnomaly,update,state,setExit,landmarks:()=>({poster:posterGroups[0].getWorldPosition(new T.Vector3()).toArray(),door:firstDoor.getWorldPosition(new T.Vector3()).toArray(),cone:cone.getWorldPosition(new T.Vector3()).toArray()}),get extraTextures(){return [eyePoster,signRed];},revealVariants(){for(const g of Object.values(variantGroups))g.visible=true;},setProgress(value){progress=value;updateSigns();}};
}

function buildBend(language){
  let numbers=[0,0];
  const root=new T.Group();
  function box(w,h,d,x,y,z,mat=trim){const m=new T.Mesh(unitBox,mat);m.scale.set(w,h,d);m.position.set(x,y,z);m.receiveShadow=true;root.add(m);return m;}
  function tiledPlane(w,h,x,y,z,rotation,type){
    const map=type==='wall'?tiles():type==='floor'?floorTexture():ceilingTexture();map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(type==='wall'?w/1.2:w,type==='wall'?h/1.2:h);
    const mat=new T.MeshStandardMaterial({map,roughness:type==='wall'?.28:type==='floor'?.37:.9,metalness:type==='floor'?.15:.04});
    const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.set(...rotation);m.receiveShadow=true;root.add(m);return m;
  }
  for(const r of BEND_RECTS){const x=(r.x0+r.x1)/2,z=(r.z0+r.z1)/2,w=r.x1-r.x0,d=r.z1-r.z0;
    tiledPlane(w,d,x,-.015,z,[-Math.PI/2,0,0],'floor');tiledPlane(w,d,x,3.4,z,[Math.PI/2,0,0],'ceiling');
  }
  for(const {x,z,w,ry} of bendWalls()){
    tiledPlane(w,3.4,x,1.7,z,[0,ry,0],'wall');const sideways=Math.abs(Math.sin(ry))>.5,px=x+Math.sin(ry)*.035,pz=z+Math.cos(ry)*.035;
    box(sideways?.055:w,.20,sideways?w:.055,px,.1,pz);box(sideways?.035:w,.045,sideways?w:.035,px,1.16,pz);box(sideways?.05:w,.10,sideways?w:.05,px,3.24,pz,dark);
  }
  const route=[[0,-39],[0,-43],[12,-43],[12,-55],[24,-55],[24,-59]],ribTransforms=[];
  for(let i=1;i<route.length;i++){
    const [a,b]=[route[i-1],route[i]],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),horizontal=Math.abs(dx)>0;
    box(horizontal?len:.54,.023,horizontal?.54:len,(a[0]+b[0])/2,.008,(a[1]+b[1])/2,yellow);
    for(let distance=.25;distance<len;distance+=.5)for(let j=0;j<5;j++)ribTransforms.push({x:a[0]+dx*distance/len+(horizontal?0:-.2+j*.1),z:a[1]+dz*distance/len+(horizontal?-.2+j*.1:0),horizontal});
  }
  const ribs=new T.InstancedMesh(new T.BoxGeometry(.025,.025,.38),yellow,ribTransforms.length),matrix=new T.Matrix4();
  ribTransforms.forEach((p,i)=>{matrix.compose(new T.Vector3(p.x,.031,p.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),p.horizontal?Math.PI/2:0),new T.Vector3(1,1,1));ribs.setMatrixAt(i,matrix);});root.add(ribs);
  const glow=new T.MeshStandardMaterial({color:'#e6edd4',emissive:'#e5f2c9',emissiveIntensity:4.3});
  for(const [x,z] of [[0,-43],[12,-49],[24,-55]]){box(1.8,.08,.32,x,3.30,z,dark);box(1.65,.025,.22,x,3.24,z,glow);}
  const light=new T.RectAreaLight('#edf1d5',3.5,24,16);light.position.set(12,3.2,-49);light.rotation.x=-Math.PI/2;root.add(light);
  const boards=[];
  for(const [x,z,ry] of [[-2.95,-43,Math.PI/2],[26.95,-55,-Math.PI/2]]){const map=landingTexture(0,language);const m=new T.Mesh(new T.PlaneGeometry(2.8,.58),new T.MeshStandardMaterial({map,emissive:'#ffffff',emissiveMap:map,emissiveIntensity:.4}));m.position.set(x,2.1,z);m.rotation.y=ry;root.add(m);boards.push(m);}
  batchFixedBoxes(root);
  function setNumbers(left,right){numbers=[left,right];numbers.forEach((n,i)=>{boards[i].material.map=boards[i].material.emissiveMap=landingTexture(n,language);});}
  return {root,setNumbers,setLanguage(next){language=next;setNumbers(...numbers);}};
}
export function buildScene(renderer,language='zh-CN'){
  RectAreaLightUniformsLib.init();
  const scene=new T.Scene();scene.background=new T.Color('#1f2923');scene.fog=new T.FogExp2('#475348',.019);
  const environment=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(environment,.02);scene.environment=env.texture;scene.environmentIntensity=.22;environment.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight('#d5e0c5','#56685d',.55));
  const reflectionShader={
    uniforms:{color:{value:new T.Color('#8b9687')},tDiffuse:{value:null},textureMatrix:{value:new T.Matrix4()}},
    vertexShader:`uniform mat4 textureMatrix;varying vec4 vProj;varying vec3 vW;void main(){vProj=textureMatrix*vec4(position,1.);vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tDiffuse;uniform vec3 color;varying vec4 vProj;varying vec3 vW;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec2 uv=vProj.xy/vProj.w;float n=h(floor(vW.xz*110.));uv+=vec2(n-.5,h(floor(vW.zx*85.))-.5)*.0011;vec3 c=texture2D(tDiffuse,uv).rgb*.28;c+=texture2D(tDiffuse,uv+vec2(.003,0.)).rgb*.18;c+=texture2D(tDiffuse,uv-vec2(.003,0.)).rgb*.18;c+=texture2D(tDiffuse,uv+vec2(0.,.005)).rgb*.18;c+=texture2D(tDiffuse,uv-vec2(0.,.005)).rgb*.18;float fres=pow(1.-max(dot(normalize(cameraPosition-vW),vec3(0,1,0)),0.),3.);gl_FragColor=vec4(c*color,.10+fres*.31);}`
  };
  const reflector=new Reflector(new T.PlaneGeometry(80,100),{color:0xffffff,textureWidth:512,textureHeight:512,clipBias:.004,multisample:0,shader:reflectionShader});reflector.position.set(0,.003,-17);reflector.rotation.x=-Math.PI/2;reflector.material.transparent=true;reflector.material.depthWrite=false;reflector.renderOrder=2;scene.add(reflector);

  const halls=Array.from({length:3},()=>{const hall=buildHall(language);scene.add(hall.root);return {index:null,heading:1,hall};});
  const bends=Array.from({length:4},()=>{const bend=buildBend(language);scene.add(bend.root);return {index:null,...bend};});
  let active=0,rects=floorRects(0),colliders=[],recycles=0,activeAnomaly=null,shadowTime=0;
  renderer.shadowMap.autoUpdate=false;
  const invalidateShadows=()=>{renderer.shadowMap.needsUpdate=true;};
  function setQuality(profile){
    reflector.visible=profile.reflection>0;
    const target=reflector.getRenderTarget(),size=profile.reflection||1;
    if(target.width!==size)target.setSize(size,size);
    scene.traverse(o=>{if(!o.castShadow||!o.shadow)return;const s=o.shadow;
      if(s.mapSize.x!==profile.shadow){s.map?.dispose();s.map=null;s.mapSize.set(profile.shadow,profile.shadow);}
    });
    invalidateShadows();
  }
  const hallAt=index=>halls.find(slot=>slot.index===index)?.hall;
  function place(root,index,heading=1){const p=fromHall(index,0,0,heading);root.position.set(p.x,0,p.z);root.rotation.y=heading===1?0:Math.PI;}
  function sync(index,anomaly,progress,heading=1,exit=false){
    active=index;activeAnomaly=anomaly;invalidateShadows();const wanted=[index-1,index,index+1];
    for(const i of wanted)if(!hallAt(i)){const slot=halls.find(slot=>!wanted.includes(slot.index));slot.index=i;slot.heading=1;place(slot.hall.root,i);slot.hall.setAnomaly(null);slot.hall.setProgress(progress);slot.hall.setExit(false);recycles++;}
    const wantedBends=[index-2,index-1,index,index+1];
    for(const i of wantedBends)if(!bends.some(slot=>slot.index===i)){const slot=bends.find(slot=>!wantedBends.includes(slot.index));slot.index=i;place(slot.root,i);}
    for(const slot of halls)if(slot.index!==index&&slot.hall.state().exit)slot.hall.setExit(false);
    const targetSlot=halls.find(s=>s.index===index),target=targetSlot.hall;targetSlot.heading=heading;place(target.root,index,heading);target.setProgress(progress);target.setAnomaly(anomaly);target.setExit(exit);
    rects=floorRects(index);colliders=[];
    for(const slot of halls)if(!slot.hall.state().exit)for(const c of slot.hall.colliders){const p=fromHall(slot.index,c.x,c.z,slot.heading);colliders.push({...p,w:c.w,d:c.d});}
    for(const bend of bends)bend.setNumbers(hallAt(bend.index)?.state().progress??progress,hallAt(bend.index+1)?.state().progress??progress);
    const p=fromHall(index,0,-17);reflector.position.set(p.x,.003,p.z);
  }
  function update(time){
    for(const slot of halls){slot.hall.root.visible=slot.index===active;if(slot.hall.root.visible)slot.hall.update(time);}
    for(const slot of bends)slot.root.visible=slot.index===active-1||slot.index===active;
    // Only the watcher's very slow rotation changes a shadow between room changes.
    if(activeAnomaly==='watcher'&&time-shadowTime>.1){shadowTime=time;invalidateShadows();}
  }
  function state(){return {active,recycles,hallCount:halls.length,bendCount:bends.length,colliders:colliders.map(c=>({...c})),rooms:halls.map(s=>({index:s.index,heading:s.heading,visible:s.hall.root.visible,landmarks:s.hall.landmarks(),...s.hall.state()}))};}
  function reset(){for(const slot of halls){slot.index=null;slot.hall.setExit(false);}for(const slot of bends)slot.index=null;recycles=0;sync(0,null,0);}
  reset();
  async function warmup(camera){
    // Upload every decal while the loading menu is visible, including unseen anomalies.
    const textures=new Set();scene.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m)for(const value of Object.values(m))if(value?.isTexture)textures.add(value);});
    for(const slot of halls)for(const map of slot.hall.extraTextures)textures.add(map);
    for(let n=0;n<=8;n++)for(const wrong of [false,true])textures.add(signTexture(n,wrong,language));
    for(let n=0;n<=8;n++)textures.add(landingTexture(n,language));
    for(const texture of textures)renderer.initTexture(texture);
    const target=new T.WebGLRenderTarget(160,90),savedTarget=renderer.getRenderTarget(),savedAspect=camera.aspect;
    camera.aspect=16/9;camera.updateProjectionMatrix();renderer.setRenderTarget(target);
    // The occlusion gate allows exactly one hall and its two bends to be drawn.
    // Keep light counts stable across ordinary crossings; pre-render each pooled hall.
    for(const slot of halls){
      const p=fromHall(slot.index,0,1.2);camera.position.set(p.x,1.67,p.z);camera.rotation.set(0,0,0);
      for(const other of halls)other.hall.root.visible=other===slot;
      for(const bend of bends)bend.root.visible=bend.index===slot.index-1||bend.index===slot.index;
      for(const kind of ['normal','dark','exit']){
        const id=kind==='dark'?'dark-end':null;slot.hall.setAnomaly(id);slot.hall.setExit(kind==='exit');slot.hall.revealVariants();
        await renderer.compileAsync(scene,camera);
        slot.hall.setAnomaly(id);invalidateShadows();renderer.render(scene,camera);
      }
      slot.hall.setExit(false);slot.hall.setAnomaly(null);
    }
    renderer.setRenderTarget(savedTarget);target.dispose();camera.aspect=savedAspect;camera.updateProjectionMatrix();reset();update(0,START);
  }

  function setLanguage(next){
    if(next===language)return;language=next;
    halls.forEach(slot=>slot.hall.setLanguage(language));bends.forEach(bend=>bend.setLanguage(language));
    // Upload once while the menu is open; do not rebuild rooms or alter progression.
    for(const texture of decalCache.values())renderer.initTexture(texture);
    for(let n=0;n<=8;n++){renderer.initTexture(landingTexture(n,language));for(const wrong of [false,true])renderer.initTexture(signTexture(n,wrong,language));}
  }
  return {scene,reflector,sync,reset,update,state,warmup,setQuality,setLanguage,move:(x,z,dx,dz)=>slideMove(x,z,dx,dz,rects,colliders),setAnomaly:id=>{activeAnomaly=id;hallAt(active).setAnomaly(id);invalidateShadows();},setProgress:n=>hallAt(active).setProgress(n)};
}
