import * as THREE from 'three';
import { OrbitControls }  from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader }      from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer }  from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping    = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010112);
scene.fog = new THREE.FogExp2(0x010112, 0.018);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(18, 30, 45);

const composer  = new EffectComposer(renderer);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.1, 0.5, 0.35);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true; orbit.dampingFactor = 0.07;
orbit.minDistance = 0.25; orbit.maxDistance = 90; orbit.update();

const grid1 = new THREE.GridHelper(100, 50, 0x00ffff, 0x003344);
grid1.material.transparent = true; grid1.material.opacity = 0.45; scene.add(grid1);
const grid2 = new THREE.GridHelper(100, 12, 0xff00ff, 0x220033);
grid2.material.transparent = true; grid2.material.opacity = 0.2; scene.add(grid2);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color:0x000818, roughness:0.85, metalness:0.15, emissive:0x000818, emissiveIntensity:0.06 })
);
floor.rotation.x = -Math.PI/2; floor.position.y = -0.01; scene.add(floor);

scene.add(new THREE.AmbientLight(0x4466aa, 1.8));
const sun = new THREE.DirectionalLight(0xccddff, 1.2); sun.position.set(4,14,6); scene.add(sun);
const sunBack = new THREE.DirectionalLight(0xff8855, 0.5); sunBack.position.set(-6,8,-10); scene.add(sunBack);

const ATMO = [
  { c:0x00ffff, p:[-18,4,-12], r:40, base:7 },
  { c:0xff00ff, p:[ 18,4,-12], r:40, base:7 },
  { c:0xff6600, p:[  0,3, 18], r:30, base:5 },
  { c:0x0055ff, p:[-14,6,  6], r:28, base:4 },
  { c:0xff0088, p:[ 14,6,  6], r:28, base:4 },
];
const atmoLights = ATMO.map(({ c, p, r, base }) => {
  const l = new THREE.PointLight(c, base, r);
  l.position.set(...p); scene.add(l);
  return { light:l, base, baseColor:new THREE.Color(c) };
});

function neonPole(x, z, color) {
  const mat = new THREE.MeshStandardMaterial({ color, emissive:color, emissiveIntensity:3, transparent:true, opacity:0.75 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,10,5), mat);
  pole.position.set(x,5,z); scene.add(pole);
  const pl = new THREE.PointLight(color,3,10); pl.position.set(x,9.5,z); scene.add(pl);
}
neonPole(-22,-16,0x00ffff); neonPole(22,-16,0xff00ff);
neonPole(-22, 16,0xff00ff); neonPole(22, 16,0x00ffff);
neonPole(-22,  0,0x0088ff); neonPole(22,  0,0xff6600);

// ── Ambient particles ─────────────────────────────────────────────
const PC = 350;
const pPos = new Float32Array(PC*3), pVel = new Float32Array(PC*3);
for (let i=0;i<PC;i++){
  pPos[i*3]=(Math.random()-0.5)*70; pPos[i*3+1]=Math.random()*18; pPos[i*3+2]=(Math.random()-0.5)*70;
  pVel[i*3]=(Math.random()-0.5)*0.018; pVel[i*3+1]=Math.random()*0.025+0.008; pVel[i*3+2]=(Math.random()-0.5)*0.018;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color:0x00ffff, size:0.065, transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false })));

// ── Speed trail particles ─────────────────────────────────────────
const TC = 120;
const tPos=new Float32Array(TC*3), tVel=new Float32Array(TC*3), tAge=new Float32Array(TC).fill(9999), tLife=new Float32Array(TC).fill(1);
const tGeo=new THREE.BufferGeometry(); tGeo.setAttribute('position', new THREE.BufferAttribute(tPos,3));
const trailMesh=new THREE.Points(tGeo, new THREE.PointsMaterial({ color:0xff7700, size:0.12, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false }));
trailMesh.frustumCulled=false;
scene.add(trailMesh);

function spawnTrail(cx,cy,cz){
  for(let i=0;i<TC;i++){
    if(tAge[i]>=tLife[i]){
      tPos[i*3]=cx+(Math.random()-0.5)*0.5; tPos[i*3+1]=cy+Math.random()*0.2; tPos[i*3+2]=cz+(Math.random()-0.5)*0.5;
      tVel[i*3]=(Math.random()-0.5)*0.05; tVel[i*3+1]=Math.random()*0.06+0.01; tVel[i*3+2]=(Math.random()-0.5)*0.05;
      tAge[i]=0; tLife[i]=0.3+Math.random()*0.4; return;
    }
  }
}

// ── Brake smoke particles ─────────────────────────────────────────
const SMC=70;
const smPos=new Float32Array(SMC*3), smVel=new Float32Array(SMC*3);
const smAge=new Float32Array(SMC).fill(9999), smLife=new Float32Array(SMC).fill(1);
const smGeo=new THREE.BufferGeometry(); smGeo.setAttribute('position', new THREE.BufferAttribute(smPos,3));
const smMesh=new THREE.Points(smGeo, new THREE.PointsMaterial({ color:0xcccccc, size:0.26, transparent:true, opacity:0.35, blending:THREE.NormalBlending, depthWrite:false }));
smMesh.frustumCulled=false;
scene.add(smMesh);
function spawnSmoke(cx,cy,cz){
  for(let i=0;i<SMC;i++){
    if(smAge[i]>=smLife[i]){
      smPos[i*3]=cx+(Math.random()-0.5)*0.7; smPos[i*3+1]=cy+Math.random()*0.1; smPos[i*3+2]=cz+(Math.random()-0.5)*0.5;
      smVel[i*3]=(Math.random()-0.5)*0.028; smVel[i*3+1]=Math.random()*0.032+0.008; smVel[i*3+2]=(Math.random()-0.5)*0.028;
      smAge[i]=0; smLife[i]=0.8+Math.random()*0.8; return;
    }
  }
}

// ── Lightning bolts ───────────────────────────────────────────────
const BOLT_N=6, boltLines=[];
for(let b=0;b<BOLT_N;b++){
  const bp=new Float32Array(18*3), bg=new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.BufferAttribute(bp,3));
  const bm=new THREE.LineBasicMaterial({ color:0x00ff88, transparent:true, opacity:0, blending:THREE.AdditiveBlending });
  const bl=new THREE.Line(bg,bm); bl.frustumCulled=false; scene.add(bl);
  boltLines.push({ line:bl, pts:bp });
}
function animateBolts(cen, yMin, yMax, show, bw){
  const bh=(yMax-yMin)*1.5;
  boltLines.forEach(({ line, pts }, bi)=>{
    line.material.opacity = show ? (0.6+Math.random()*0.4) : 0;
    if(!show) return;
    const ang=(bi/BOLT_N)*Math.PI*2+Math.random()*0.9;
    const r=Math.max(0.4,(bw||1)*0.38)+Math.random()*Math.max(0.3,(bw||1)*0.28);
    for(let p=0;p<18;p++){
      const f=p/17;
      pts[p*3]=cen.x+Math.cos(ang)*r*(1-f*0.3)+(Math.random()-0.5)*0.14;
      pts[p*3+1]=yMin+f*bh+(Math.random()-0.5)*0.12;
      pts[p*3+2]=cen.z+Math.sin(ang)*r*(1-f*0.3)+(Math.random()-0.5)*0.14;
    }
    line.geometry.attributes.position.needsUpdate=true;
  });
}

// ── Web Audio ─────────────────────────────────────────────────────
let audioCtx=null, motorOsc=null, motorGain=null, chargeOsc=null, chargeGain=null;
function initAudio(){
  if(audioCtx) return;
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  motorOsc=audioCtx.createOscillator(); motorOsc.type='sawtooth'; motorOsc.frequency.value=80;
  motorGain=audioCtx.createGain(); motorGain.gain.value=0;
  motorOsc.connect(motorGain); motorGain.connect(audioCtx.destination); motorOsc.start();
  chargeOsc=audioCtx.createOscillator(); chargeOsc.type='square'; chargeOsc.frequency.value=380;
  chargeGain=audioCtx.createGain(); chargeGain.gain.value=0;
  chargeOsc.connect(chargeGain); chargeGain.connect(audioCtx.destination); chargeOsc.start();
}
document.addEventListener('click', initAudio, { once:true });

// ── Camera shake ──────────────────────────────────────────────────
let shakeAmt=0, introActive=false;

// ── Helpers ───────────────────────────────────────────────────────
function placeModel(model,box,tx,tz,sy){
  const c=new THREE.Vector3(); box.getCenter(c);
  model.position.set(tx-c.x, sy-box.min.y, tz-c.z);
}
function setEmissive(model,color,intensity){
  model.traverse(child=>{
    if(!child.isMesh) return;
    const mats=Array.isArray(child.material)?child.material:[child.material];
    mats.forEach(m=>{ if(m.emissive!==undefined){ m.emissive.set(color); m.emissiveIntensity=intensity; } });
  });
}
function findWheels(model){
  const ws=[];
  model.traverse(child=>{
    if(!child.isMesh) return;
    const n=child.name.toLowerCase();
    if(n.includes('wheel')||n.includes('tire')||n.includes('tyre')||n.includes('rueda')||n.includes('roda')||n.includes('roue')) ws.push(child);
  });
  return ws;
}

const loader=new GLTFLoader();
const loadGLTF=url=>new Promise((res,rej)=>loader.load(url,res,undefined,rej));

const ST={ IDLE:'IDLE', ACCEL:'ACCEL', BRAKE:'BRAKE', CHARGE:'CHARGE', DISCHARGE:'DISCHARGE', SWAP:'SWAP' };
const scooters=[], STATE_COLORS={
  IDLE:new THREE.Color(0x00ffff), ACCEL:new THREE.Color(0xff6600), BRAKE:new THREE.Color(0xff2233),
  CHARGE:new THREE.Color(0x00ff88), DISCHARGE:new THREE.Color(0xffff00), SWAP:new THREE.Color(0xff00ff)
};
let selected=null, suppressCanvasClick=false, activeCallout=null;

// ── Callout definitions ────────────────────────────────────────────
const CDEFS=[
  { n:1, xf:0.5,  yf:0.99, zf:0.5,  lbl:'Manillar',          spec:'Aluminio aeronáutico' },
  { n:2, xf:0.4,  yf:0.92, zf:0.35, lbl:'Pantalla LED',       spec:'7 indicadores estado' },
  { n:3, xf:0.5,  yf:0.88, zf:0.4,  lbl:'Luz delantera',      spec:'LED integrado · IP54' },
  { n:4, xf:0.5,  yf:0.62, zf:0.5,  lbl:'Palanca plegable',   spec:'Seguro anti-liberación' },
  { n:5, xf:0.5,  yf:0.09, zf:0.55, lbl:'Batería Li-ion',     spec:'36V–48V · 10–15 Ah · BMS' },
  { n:6, xf:0.22, yf:0.03, zf:0.22, lbl:'Rueda delantera 10"',spec:'Caucho neumático · ABS' },
  { n:7, xf:0.78, yf:0.03, zf:0.78, lbl:'Motor brushless',    spec:'350–500W · Freno disco' },
  { n:8, xf:0.5,  yf:0.06, zf:0.65, lbl:'Plataforma ABS',     spec:'500×180 mm · antidesliz.' },
];

function worldToScreen(pos){
  const v=pos.clone().project(camera);
  return { x:(v.x*0.5+0.5)*window.innerWidth, y:(-v.y*0.5+0.5)*window.innerHeight, vis:v.z<1 };
}
function buildCallouts(sc,box,scIdx){
  sc.calloutData=CDEFS.map(def=>{
    const wp=new THREE.Vector3(
      box.min.x+(box.max.x-box.min.x)*def.xf,
      box.min.y+(box.max.y-box.min.y)*def.yf,
      box.min.z+(box.max.z-box.min.z)*def.zf
    );
    const el=document.createElement('div');
    el.className='clt';
    el.innerHTML=`<div class="clt-dot">${def.n}</div><div class="clt-popup"><span class="clt-title">${def.lbl}</span><span class="clt-spec">${def.spec}</span></div>`;
    el.style.display='none';
    el.querySelector('.clt-dot').addEventListener('click',e=>{
      e.stopPropagation();
      suppressCanvasClick=true; setTimeout(()=>{ suppressCanvasClick=false; },80);
      if(selected!==sc) select(scIdx,false);
      const isOpen=el.classList.contains('open');
      if(activeCallout&&activeCallout!==el) activeCallout.classList.remove('open');
      if(isOpen){ el.classList.remove('open'); activeCallout=null; }
      else{ el.classList.add('open'); activeCallout=el; focusOnPoint(wp); log('[ '+def.n+' ] '+def.lbl); }
    });
    document.getElementById('callouts').appendChild(el);
    return { el, wp };
  });
}
function showCallouts(sc,show){
  if(!sc||!sc.calloutData) return;
  sc.calloutData.forEach(({ el })=>{
    el.style.display=show?'block':'none';
    if(!show){ el.classList.remove('open'); if(activeCallout===el) activeCallout=null; }
  });
}
function makeScooter(model,name,tag,battery){
  const hl=new THREE.PointLight(0x00ffff,0,8); scene.add(hl);
  return { model, name, tag, battery, speed:0, state:ST.IDLE, wheels:findWheels(model), hl, ring:null };
}

// ── DOM refs ──────────────────────────────────────────────────────
const panel=document.getElementById('panel'), uName=document.getElementById('u-name'),
  uTag=document.getElementById('u-tag'), sStatus=document.getElementById('s-status'),
  sSpeed=document.getElementById('s-speed'), sBatt=document.getElementById('s-batt'),
  sRange=document.getElementById('s-range'), battFill=document.getElementById('batt-fill'),
  battWrap=document.getElementById('batt-bar-wrap'), elog=document.getElementById('elog'),
  actions=document.getElementById('actions'),
  step2Area=document.getElementById('step2-area'),
  ctrlDiv=document.getElementById('ctrl-div'),
  hint=document.getElementById('hint'),
  flashEl=document.getElementById('flash'), clockEl=document.getElementById('clock'),
  btn1=document.getElementById('btn1'), btn2=document.getElementById('btn2'),
  speedoEl=document.getElementById('speedo'), speedoArc=document.getElementById('speedo-arc'),
  speedoVal=document.getElementById('speedo-val'), speedoState=document.getElementById('speedo-state'),
  speedLinesEl=document.getElementById('speed-lines');
const SPEEDO_LEN=141;

function log(msg,cls){
  const d=document.createElement('div'); d.className='elog-entry fresh '+(cls||'');
  d.textContent='▸ '+msg; elog.insertBefore(d,elog.firstChild);
  while(elog.children.length>7) elog.removeChild(elog.lastChild);
}
const STATE_LABELS={ IDLE:'STANDBY', ACCEL:'ACELERANDO', BRAKE:'FRENANDO', CHARGE:'CARGANDO', DISCHARGE:'DESCARGANDO', SWAP:'SWAP BATERÍA' };
const STATE_COLS_HEX={ IDLE:'#00ffff', ACCEL:'#ff6600', BRAKE:'#ff2233', CHARGE:'#00ff88', DISCHARGE:'#ffff00', SWAP:'#ff00ff' };

function updateSpeedo(sc){
  const pct=Math.min(sc.speed/45,1);
  const col=sc.speed>35?'#ff4400':sc.speed>20?'#ffcc00':'#00ffff';
  speedoArc.setAttribute('stroke-dashoffset', String(SPEEDO_LEN*(1-pct)));
  speedoArc.setAttribute('stroke',col);
  speedoVal.textContent=String(Math.round(sc.speed));
  speedoVal.style.color=col;
  const sc2=STATE_COLS_HEX[sc.state]||'#00ffff';
  speedoState.textContent=STATE_LABELS[sc.state]||sc.state;
  speedoState.style.color=sc2;
}

function updateUI(){
  if(!selected) return;
  const b=Math.max(0,Math.min(100,selected.battery));
  sSpeed.innerHTML=Math.round(selected.speed)+' <small>km/h</small>';
  sBatt.innerHTML=Math.round(b)+'<small>%</small>';
  battFill.style.width=b+'%';
  sRange.innerHTML=Math.round(b*0.45)+' <small>km</small>';
  if(b>60){ battFill.style.background='linear-gradient(to right,#ff6600,#00ffff)'; sBatt.className='s-val nc'; }
  else if(b>25){ battFill.style.background='linear-gradient(to right,#ff6600,#ffff00)'; sBatt.className='s-val ny'; }
  else{ battFill.style.background='linear-gradient(to right,#ff2233,#ff6600)'; sBatt.className='s-val nr'; }
  const labels={ IDLE:'<span class="nc">STANDBY</span>', ACCEL:'<span class="no">ACELERANDO</span>',
    BRAKE:'<span class="nr">FRENANDO</span>', CHARGE:'<span class="ng">CARGANDO</span>',
    DISCHARGE:'<span class="ny">DESCARGANDO</span>', SWAP:'<span class="nm">CAMBIANDO BATERÍA</span>' };
  sStatus.innerHTML=labels[selected.state]||selected.state;
  battWrap.classList.toggle('charging', selected.state===ST.CHARGE);
  updateSpeedo(selected);
}

// ── Focus ─────────────────────────────────────────────────────────
let focusTarget=new THREE.Vector3(), focusPos=new THREE.Vector3(), isFocusing=false;
const initialFitTarget=new THREE.Vector3();
function focusOn(sc){
  const box=new THREE.Box3().setFromObject(sc.model); box.getCenter(focusTarget);
  const d=Math.max(box.max.x-box.min.x, box.max.z-box.min.z);
  const sx=sc.model.position.x>=0?-1:1;
  focusPos.set(focusTarget.x+sx*d*0.7, focusTarget.y+d*0.85, focusTarget.z+d*2.2); isFocusing=true;
}
function focusOnPoint(wp){
  focusTarget.copy(wp);
  const dir=camera.position.clone().sub(orbit.target).normalize();
  focusPos.copy(wp).addScaledVector(dir,1.8); isFocusing=true;
}
function flash(color){
  flashEl.style.background=color||'#00ffff'; flashEl.style.opacity='0.65';
  setTimeout(()=>{ flashEl.style.opacity='0.25'; },70);
  setTimeout(()=>{ flashEl.style.opacity='0.5'; },130);
  setTimeout(()=>{ flashEl.style.opacity='0'; },220);
}

// ── Select / deselect ─────────────────────────────────────────────
function select(idx,fromButton){
  if(selected){
    selected.hl.intensity=0; selected.state=ST.IDLE; selected.speed=0;
    if(selected.ring){ selected.ring.material.opacity=0; selected.ring._pulse=false; }
    showCallouts(selected,false);
  }
  selected=scooters[idx];
  selected.state=ST.IDLE; selected.speed=0;
  selected.hl.intensity=2.5; selected.hl.color.set(0x00ffff);
  if(selected.ring){
    if(fromButton){ selected.ring._pulse=true; selected.ring._pulseStart=performance.now()/1000; selected.ring.material.opacity=0; }
    else{ selected.ring._pulse=false; selected.ring.material.opacity=0; }
  }
  showCallouts(selected,true);
  speedoEl.style.display='block';
  panel.classList.remove('hidden');
  step2Area.classList.remove('hidden'); ctrlDiv.classList.remove('hidden');
  hint.style.display='none';
  uName.textContent=selected.name; uTag.textContent=selected.tag;
  btn1.classList.toggle('active',idx===0); btn2.classList.toggle('active',idx===1);
  updateUI(); focusOn(selected); flash('#00ffff'); log('UNIT '+(idx+1)+' SELECCIONADA');
}
function deselect(){
  if(selected){
    selected.hl.intensity=0;
    if(selected.ring){ selected.ring.material.opacity=0; selected.ring._pulse=false; }
    showCallouts(selected,false); selected.state=ST.IDLE; selected.speed=0; selected=null;
  }
  speedoEl.style.display='none';
  panel.classList.add('hidden');
  step2Area.classList.add('hidden'); ctrlDiv.classList.add('hidden');
  hint.style.display='';
  btn1.classList.remove('active'); btn2.classList.remove('active');
  animateBolts(new THREE.Vector3(),0,1,false,1);
  if(speedLinesEl) speedLinesEl.classList.remove('active');
  if(audioCtx){ motorGain.gain.setTargetAtTime(0,audioCtx.currentTime,0.2); chargeGain.gain.setTargetAtTime(0,audioCtx.currentTime,0.2); }
}

// ── Actions ───────────────────────────────────────────────────────
function doAction(action){
  if(!selected) return;
  initAudio();
  switch(action){
    case 'accel':
      if(selected.battery<=0){ log('SIN BATERÍA — RECARGA PRIMERO','danger'); return; }
      selected.state=ST.ACCEL; selected.hl.color.set(0xff6600); shakeAmt=0.08;
      log('MOTOR: MÁXIMA POTENCIA','warn'); break;
    case 'brake':
      selected.state=ST.BRAKE; selected.hl.color.set(0xff2233); shakeAmt=0.2;
      log('FRENOS ACTIVADOS','danger'); break;
    case 'discharge':
      selected.state=ST.DISCHARGE; selected.hl.color.set(0xffff00);
      log('ADVERTENCIA: DESCARGANDO BATERÍA','warn'); break;
    case 'charge':
      if(selected.battery>=100){ log('BATERÍA YA AL 100%'); return; }
      selected.state=ST.CHARGE; selected.speed=0; selected.hl.color.set(0x00ff88);
      log('CARGA INICIADA...'); break;
    case 'swap': doSwap(); return;
  }
  updateUI();
}
function doSwap(){
  if(!selected||selected.state===ST.SWAP) return;
  selected.state=ST.SWAP; selected.hl.color.set(0xff00ff); shakeAmt=0.14;
  log('EXTRAYENDO BATERÍA...','warn'); flash('#ff00ff');
  const start=selected.battery; let tv=0;
  const drain=setInterval(()=>{
    tv+=0.08; selected.battery=Math.max(0,start*(1-Math.min(tv,1))); updateUI();
    if(selected.battery<=0){
      clearInterval(drain);
      setTimeout(()=>{ flash('#00ff88'); selected.battery=100; selected.state=ST.IDLE; selected.speed=0; selected.hl.color.set(0x00ffff); log('NUEVA BATERÍA INSTALADA — 100%'); updateUI(); },500);
    }
  },45);
}

// ── Raycaster & events ────────────────────────────────────────────
const rc=new THREE.Raycaster(), mxy=new THREE.Vector2();
renderer.domElement.addEventListener('click',e=>{
  if(suppressCanvasClick) return;
  mxy.x=(e.clientX/window.innerWidth)*2-1; mxy.y=-(e.clientY/window.innerHeight)*2+1;
  rc.setFromCamera(mxy,camera);
  for(let i=0;i<scooters.length;i++){ if(rc.intersectObject(scooters[i].model,true).length>0){ select(i); return; } }
});
document.getElementById('welcome-close').addEventListener('click',()=>{
  const w=document.getElementById('welcome');
  w.style.opacity='0'; w.style.pointerEvents='none';
  setTimeout(()=>{ w.style.display='none'; },400);
  initAudio();
});

btn1.addEventListener('click',()=>select(0,true));
btn2.addEventListener('click',()=>select(1,true));
document.getElementById('p-close').addEventListener('click',deselect);
document.getElementById('b-desel').addEventListener('click',deselect);
document.getElementById('b-accel').addEventListener('click',()=>doAction('accel'));
document.getElementById('b-brake').addEventListener('click',()=>doAction('brake'));
document.getElementById('b-dis'  ).addEventListener('click',()=>doAction('discharge'));
document.getElementById('b-chg'  ).addEventListener('click',()=>doAction('charge'));
document.getElementById('b-swap' ).addEventListener('click',()=>doAction('swap'));

// ── Nav ───────────────────────────────────────────────────────────
function fitAll(){ focusTarget.copy(initialFitTarget); focusPos.set(initialFitTarget.x,initialFitTarget.y+10,initialFitTarget.z+20); isFocusing=true; }
function setNavMode(mode){
  document.querySelectorAll('.nav-btn[data-mode]').forEach(b=>b.classList.remove('active'));
  const btn=document.getElementById('nav-'+mode); if(btn) btn.classList.add('active');
  orbit.mouseButtons=mode==='pan'
    ?{ LEFT:THREE.MOUSE.PAN,    MIDDLE:THREE.MOUSE.DOLLY, RIGHT:THREE.MOUSE.ROTATE }
    :{ LEFT:THREE.MOUSE.ROTATE, MIDDLE:THREE.MOUSE.DOLLY, RIGHT:THREE.MOUSE.PAN };
}
let spaceDown=false;
window.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT') return;
  if(e.code==='Space'&&!spaceDown&&!e.repeat){ spaceDown=true; setNavMode('pan'); }
  if(e.code==='KeyR') setNavMode('orbit');
  if(e.code==='KeyG') setNavMode('pan');
  if(e.code==='KeyF') selected?focusOn(selected):fitAll();
  if(e.code==='Escape') deselect();
});
window.addEventListener('keyup',e=>{ if(e.code==='Space'){ spaceDown=false; setNavMode('orbit'); } });
document.getElementById('nav-orbit').addEventListener('click',()=>setNavMode('orbit'));
document.getElementById('nav-pan'  ).addEventListener('click',()=>setNavMode('pan'));
document.getElementById('nav-fit'  ).addEventListener('click',()=>selected?focusOn(selected):fitAll());
document.getElementById('nav-reset').addEventListener('click',fitAll);
setNavMode('orbit');

// ── Clock ─────────────────────────────────────────────────────────
const pad=v=>String(v).padStart(2,'0');
function tick(){ const n=new Date(); clockEl.textContent=pad(n.getHours())+':'+pad(n.getMinutes())+':'+pad(n.getSeconds()); }
setInterval(tick,1000); tick();

// ── Load scene ────────────────────────────────────────────────────
loadGLTF('./game_table/scene.gltf').then(gltfTable=>{
  const table=gltfTable.scene; scene.add(table); setEmissive(table,0x001133,0.08);
  const tb=new THREE.Box3().setFromObject(table), tTop=tb.max.y;
  const tCen=new THREE.Vector3(); tb.getCenter(tCen);
  const tW=tb.max.x-tb.min.x;
  orbit.target.copy(tCen); orbit.update(); initialFitTarget.copy(tCen);

  const sptMain=new THREE.SpotLight(0xffffff,10,28,Math.PI*0.22,0.35);
  sptMain.position.set(tCen.x,tTop+11,tCen.z); sptMain.target.position.copy(tCen);
  scene.add(sptMain); scene.add(sptMain.target);
  const sptL=new THREE.SpotLight(0xaabbff,5,22,Math.PI*0.28,0.5);
  sptL.position.set(tCen.x-tW*0.7,tTop+8,tCen.z+3); sptL.target.position.copy(tCen);
  scene.add(sptL); scene.add(sptL.target);
  const sptR=new THREE.SpotLight(0xff9966,3,20,Math.PI*0.28,0.5);
  sptR.position.set(tCen.x+tW*0.7,tTop+8,tCen.z-2); sptR.target.position.copy(tCen);
  scene.add(sptR); scene.add(sptR.target);
  const el1=new THREE.PointLight(0x00ffff,5,10); el1.position.set(tCen.x-tW*0.38,tTop+0.4,tCen.z); scene.add(el1);
  const el2=new THREE.PointLight(0xff00ff,5,10); el2.position.set(tCen.x+tW*0.38,tTop+0.4,tCen.z); scene.add(el2);

  Promise.all([ loadGLTF('./scene.gltf'), loadGLTF('./tier_scooter/scene.gltf') ]).then(([g1,g2])=>{
    const s1=g1.scene, s2=g2.scene;
    s1.rotation.y=0; s2.rotation.y=0; scene.add(s1); scene.add(s2);
    const b1=new THREE.Box3().setFromObject(s1), b2=new THREE.Box3().setFromObject(s2);
    const w1=b1.max.x-b1.min.x, w2=b2.max.x-b2.min.x;
    const gap=Math.max(0,(tW-w1-w2)/3);
    placeModel(s1,b1,tCen.x-gap/2-w1/2,tCen.z,tTop);
    placeModel(s2,b2,tCen.x+gap/2+w2/2,tCen.z,tTop);
    const sc1=makeScooter(s1,'CYBER MK-I','CYBERPUNK EDITION',100);
    const sc2=makeScooter(s2,'TIER URBAN','SMART CITY UNIT',72);
    scooters.push(sc1,sc2);
    [sc1,sc2].forEach((sc,i)=>{
      const box=new THREE.Box3().setFromObject(sc.model);
      const c=new THREE.Vector3(); box.getCenter(c);
      sc.hl.position.set(c.x+0.5,box.max.y+0.6,c.z+0.8);
      const rad=Math.max(box.max.x-box.min.x,box.max.z-box.min.z)*0.58;
      const rGeo=new THREE.RingGeometry(rad*0.72,rad,64);
      const rMat=new THREE.MeshBasicMaterial({ color:0x00ffff, side:THREE.DoubleSide, transparent:true, opacity:0, depthWrite:false });
      const ring=new THREE.Mesh(rGeo,rMat);
      ring.rotation.x=-Math.PI/2; ring.position.set(c.x,tTop+0.04,c.z); ring._pulse=false;
      scene.add(ring); sc.ring=ring;
      buildCallouts(sc,box,i);
    });
    log('UNIDADES CARGADAS — LISTO');
    const midX=(sc1.model.position.x+sc2.model.position.x)/2;
    focusTarget.set(midX, tTop+1.5, tCen.z);
    focusPos.set(midX+2, tTop+8, tCen.z+18);
    isFocusing=true; introActive=true;
  });
});

// ── Animate ───────────────────────────────────────────────────────
const clock3=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=clock3.getDelta(), t=clock3.getElapsedTime();
  orbit.update();

  if(isFocusing){
    const lf=introActive?0.022:0.08;
    orbit.target.lerp(focusTarget,lf); camera.position.lerp(focusPos,lf);
    if(camera.position.distanceTo(focusPos)<(introActive?1.0:0.12)){ isFocusing=false; introActive=false; }
  }

  if(shakeAmt>0.001){
    camera.position.x+=(Math.random()-0.5)*shakeAmt;
    camera.position.y+=(Math.random()-0.5)*shakeAmt*0.4;
    shakeAmt*=0.80;
  }

  const stateCol=selected?STATE_COLORS[selected.state]:null;
  atmoLights.forEach(({ light, base, baseColor },i)=>{
    light.intensity=base*(0.82+0.18*Math.sin(t*1.8+i*1.4));
    light.color.lerp(stateCol||baseColor, 0.02);
  });

  const pa=pGeo.attributes.position.array;
  for(let i=0;i<PC;i++){
    pa[i*3]+=pVel[i*3]; pa[i*3+1]+=pVel[i*3+1]; pa[i*3+2]+=pVel[i*3+2];
    if(pa[i*3+1]>18) pa[i*3+1]=0;
    if(Math.abs(pa[i*3])>35) pVel[i*3]*=-1;
    if(Math.abs(pa[i*3+2])>35) pVel[i*3+2]*=-1;
  }
  pGeo.attributes.position.needsUpdate=true;

  for(let i=0;i<TC;i++){
    if(tAge[i]<tLife[i]){ tAge[i]+=dt; tPos[i*3]+=tVel[i*3]; tPos[i*3+1]+=tVel[i*3+1]; tPos[i*3+2]+=tVel[i*3+2]; }
    else tPos[i*3+1]=-9999;
  }
  tGeo.attributes.position.needsUpdate=true;

  for(let i=0;i<SMC;i++){
    if(smAge[i]<smLife[i]){ smAge[i]+=dt; smPos[i*3]+=smVel[i*3]; smPos[i*3+1]+=smVel[i*3+1]; smPos[i*3+2]+=smVel[i*3+2]; }
    else smPos[i*3+1]=-9999;
  }
  smGeo.attributes.position.needsUpdate=true;

  if(selected){
    const sc=selected;
    const box=new THREE.Box3().setFromObject(sc.model);
    const cen=new THREE.Vector3(); box.getCenter(cen);
    const h=box.max.y-box.min.y;

    switch(sc.state){
      case ST.ACCEL:
        sc.speed=Math.min(45,sc.speed+dt*16);
        sc.battery=Math.max(0,sc.battery-dt*2.5);
        if(sc.battery<=0){ sc.state=ST.IDLE; log('BATERÍA AGOTADA','danger'); }
        if(Math.random()<0.8){
          const ta=Math.random()*Math.PI*2;
          const tr=Math.max(0.3,(box.max.x-box.min.x)*0.42)+Math.random()*0.25;
          spawnTrail(cen.x+Math.cos(ta)*tr, box.min.y+0.1, cen.z+Math.sin(ta)*tr);
        }
        break;
      case ST.BRAKE:
        sc.speed=Math.max(0,sc.speed-dt*40);
        if(Math.random()<0.75){
          const sa=Math.random()*Math.PI*2;
          const sr=Math.max(0.25,(box.max.x-box.min.x)*0.38)+Math.random()*0.2;
          spawnSmoke(cen.x+Math.cos(sa)*sr, box.min.y+0.04, cen.z+Math.sin(sa)*sr);
        }
        if(sc.speed<=0){ sc.state=ST.IDLE; sc.hl.color.set(0x00ffff); log('DETENIDA'); }
        break;
      case ST.CHARGE:{
        sc.battery=Math.min(100,sc.battery+dt*9); sc.speed=0;
        if(sc.battery>=100){ sc.state=ST.IDLE; sc.hl.color.set(0x00ffff); log('CARGA COMPLETA ✓'); }
        const bw=box.max.x-box.min.x;
        if(Math.random()<0.5) animateBolts(cen,box.min.y,box.max.y,true,bw);
        break;
      }
      case ST.DISCHARGE:
        sc.battery=Math.max(0,sc.battery-dt*7); sc.speed=Math.max(0,sc.speed-dt*2);
        if(sc.battery<=0){ sc.state=ST.IDLE; sc.hl.color.set(0x00ffff); log('BATERÍA VACÍA','danger'); }
        break;
    }
    if(sc.state!==ST.CHARGE) animateBolts(cen,0,1,false,1);
    if(speedLinesEl) speedLinesEl.classList.toggle('active', sc.state===ST.ACCEL);

    if(sc.speed>0.5) sc.wheels.forEach(w=>{ w.rotation.x+=dt*sc.speed*0.18; });
    sc.hl.position.set(cen.x+0.5,box.max.y+0.6,cen.z+0.8);
    sc.hl.intensity=1.5+0.8*Math.sin(t*4);

    if(sc.ring&&sc.ring._pulse){
      const age=performance.now()/1000-sc.ring._pulseStart;
      sc.ring.material.opacity=age<0.9?0.78*Math.sin(age/0.9*Math.PI):0.09;
    }

    if(audioCtx){
      const sr=sc.speed/45;
      if(sc.state===ST.ACCEL||(sc.state===ST.BRAKE&&sc.speed>0)||sc.state===ST.DISCHARGE){
        motorGain.gain.setTargetAtTime(0.04+sr*0.08,audioCtx.currentTime,0.12);
        motorOsc.frequency.setTargetAtTime(70+sr*240,audioCtx.currentTime,0.12);
      } else { motorGain.gain.setTargetAtTime(0,audioCtx.currentTime,0.5); }
      if(sc.state===ST.CHARGE){
        chargeGain.gain.setTargetAtTime(0.03,audioCtx.currentTime,0.15);
        chargeOsc.frequency.setTargetAtTime(340+Math.sin(t*9)*60,audioCtx.currentTime,0.04);
      } else { chargeGain.gain.setTargetAtTime(0,audioCtx.currentTime,0.25); }
    }

    if(sc.calloutData) sc.calloutData.forEach(({ el, wp })=>{
      const s=worldToScreen(wp);
      if(s.vis){ el.style.left=s.x+'px'; el.style.top=s.y+'px'; el.classList.toggle('left',s.x>window.innerWidth*0.56); }
    });
    updateUI();
  }
  composer.render();
}
animate();

window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
  composer.setSize(window.innerWidth,window.innerHeight);
});
