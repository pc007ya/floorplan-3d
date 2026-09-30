/** Photo-inspired bathroom overlay. Base geometry and fixture anchors are immutable.
 * The serialized installer executes inside the pinned upstream 3D module scope.
 */
export function bathroomConfig(home) {
  const s=home.calibration.mmPerTraceUnit, H=home.heightMm/1000;
  const definitions=[['wet-a','A','warm',.36],['wet-b','B','gray',.70],['wet-c','C','warm',.71]];
  const rooms=definitions.map(([id,label,variant,fraction])=>{
    const r=home.rooms.find(r=>r.id===id);
    if(!r||r.poly.length!==4) throw Error('Bathroom overlay requires known rectangular room: '+id);
    const xs=r.poly.map(p=>p[0]*s),ys=r.poly.map(p=>p[1]*s);
    const bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
    const [x0,z0,x1,z1]=bounds, surfaces=[];
    const edges=[{axis:0,fixed:x0,lo:z0,hi:z1,sign:1},{axis:0,fixed:x1,lo:z0,hi:z1,sign:-1},{axis:1,fixed:z0,lo:x0,hi:x1,sign:1},{axis:1,fixed:z1,lo:x0,hi:x1,sign:-1}];
    const add=(rect,bottom,head,source)=>edges.forEach(e=>{
      const a=e.axis,b=1-a,R=rect.slice(0,4).map(v=>v*s);
      if(e.fixed<R[a]-65 || e.fixed>R[a+2]+65)return;
      const lo=Math.max(e.lo,R[b]),hi=Math.min(e.hi,R[b+2]);
      if(hi>lo+5 && head>bottom)surfaces.push({...e,lo,hi,bottom,head,source});
    });
    home.walls.forEach((w,i)=>add(w,0,w[4]==='low'?Math.min(1,H):H,'wall-'+i));
    home.doors.forEach((d,i)=>add(d.rect,home.doorHeadMm/1000,H,'door-head-'+i));
    home.windows.forEach((w,i)=>{add(w,0,home.windowSillMm/1000,'window-sill-'+i);add(w,home.windowHeadMm/1000,H,'window-head-'+i)});
    // A: tub enclosure at the far end. B/C: shallow shower proposals at rear.
    const front=id==='wet-a'?z0+(z1-z0)*fraction:z0+(z1-z0)*fraction;
    return {id,label,variant,bounds,surfaces,front,far:id==='wet-a'?z0:z1,
      fixtureIds:id==='wet-a'?['tub','wc-a','basin-a']:id==='wet-b'?['wc-b','basin-b']:['wc-c','basin-c']};
  });
  return {version:'2.3',rooms,H,sourceScale:s,referenceOnly:true,
    sources:['2026-08-25.jpg','2026-08-25(2).jpg','2026-08-25(4).jpg','2026-08-25(16).jpg'],
    assumptions:{mirrorHeightM:.86,cabinetBottomM:.24,basinTopM:.84,glassHeightM:2.05,tubHeightM:.59,measurementsVerified:false},
    notice:'暖米／冷灰配色、隔間分界與高度均為試配，非實測或施工圖。'};
}
export function applyBathrooms(html,home) {
  const config=bathroomConfig(home);
  const marker='window.View3D = {enter, exit, relang, sync:() => sync(), shot, groundAt, flyToRoom:id => active && !anim && flyToRoom(id), walking:() => active && opt.mode === \'walk\'};';
  if(!html.includes(marker)||!html.includes("import * as THREE from 'three';"))throw Error('V2.3: incompatible renderer');
  html=html.replace("import * as THREE from 'three';","import * as THREE from 'three';\nimport {Reflector} from 'three/addons/objects/Reflector.js';");
  html=html.replace(marker,'('+installBathrooms.toString()+')('+JSON.stringify(config).replace(/</g,'\\u003c')+');\n'+marker);
  html=html.replace(/const STORE = ("[^"]+"|'[^']+');/,(_,key)=>'const STORE = '+JSON.stringify(JSON.parse(key)+':bathrooms-v23')+';');
  html=html.replace('<title>户型装修设计</title>','<title>室內 3D｜V2.3 衛浴試配</title>');
  // Previous public pass accidentally drew a second fixed console on top of the movable one.
  html=html.replace(/^\s*archUp\.add\(box\(\.28,\.18,[^\n]+\n/m,'\n');
  return html;
}
function installBathrooms(C) {
  const defaults={enabled:true,enclosures:true,variants:Object.fromEntries(C.rooms.map(r=>[r.id,r.variant])),opened:{}};
  let focusId='wet-a',signature='',mirrors=[],glassBounds=[],builtFaces=[];
  const cache=new Map();
  function prefs(){const x=state.bathroomV23||{};return {enabled:x.enabled!==false,enclosures:x.enclosures!==false,variants:Object.fromEntries(C.rooms.map(r=>[r.id,['warm','gray'].includes(x.variants?.[r.id])?x.variants[r.id]:r.variant])),opened:Object.fromEntries(C.rooms.map(r=>[r.id,x.opened?.[r.id]===true]))}}
  const room=id=>C.rooms.find(r=>r.id===id);
  const named=(o,n)=>{o.name='bath-v23:'+n;return o};
  function tex(kind){
    if(cache.has('tex-'+kind))return cache.get('tex-'+kind);
    const cv=document.createElement('canvas');cv.width=cv.height=384;const ctx=cv.getContext('2d'),im=ctx.createImageData(384,384);
    let seed=1701;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
    const base=kind==='warm'?[186,173,148]:kind==='wood'?[189,173,148]:kind==='dark'?[83,87,87]:[141,147,146];
    for(let y=0;y<384;y++)for(let x=0;x<384;x++){
      let v;
      if(kind==='warm')v=7*Math.sin(y*.13+Math.sin(x*.012)*.6)+4*Math.sin(y*.48+x*.003)+3*Math.sin(y*.035)+rnd()*5;
      else if(kind==='wood')v=10*Math.sin(x*.21+Math.sin(y*.015)*2)+4*Math.sin(x*.77+y*.006)+rnd()*4;
      else {const q=x*.033+y*.025+Math.sin(y*.017)*1.7+Math.sin(x*.011)*1.1;v=8*Math.sin(q*1.8)+4*Math.sin(q*5)+26*Math.pow(Math.abs(Math.sin(q)),35)+rnd()*6;}
      const i=(y*384+x)*4;for(let k=0;k<3;k++)im.data[i+k]=Math.max(0,Math.min(255,base[k]+v));im.data[i+3]=255;
    }
    ctx.putImageData(im,0,0);
    if(kind!=='wood'){ctx.strokeStyle=kind==='warm'?'#d5cbbb':'#b1b4b0';ctx.lineWidth=1.3;ctx.strokeRect(.6,.6,382.8,382.8);}
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='wood'?1.8:1/.60,kind==='wood'?1:1/.60);cache.set('tex-'+kind,t);return t;
  }
  function material(kind){
    if(cache.has('mat-'+kind))return cache.get('mat-'+kind);
    const m=kind==='white'?new THREE.MeshStandardMaterial({color:'#faf9f5',roughness:.16}):kind==='chrome'?new THREE.MeshStandardMaterial({color:'#d6dce0',metalness:.92,roughness:.16,envMap:envTex,envMapIntensity:1.1}):kind==='glass'?new THREE.MeshPhysicalMaterial({color:'#c5dee0',transparent:true,opacity:.14,roughness:.06,metalness:.03,side:THREE.DoubleSide,depthWrite:false}):new THREE.MeshStandardMaterial({map:tex(kind),roughness:kind==='wood'?.65:kind==='dark'?.42:.29,envMap:envTex,envMapIntensity:.3});
    cache.set('mat-'+kind,m);return m;
  }
  function surface(w,h,kind,x,y,z,angle,name){
    const geo=new THREE.PlaneGeometry(w,h),uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w,uv.getY(i)*h);
    const m=new THREE.Mesh(geo,material(kind));m.position.set(x,y+h/2,z);m.rotation.y=angle;m.receiveShadow=true;named(m,name);return m;
  }
  // Rounded rectangular loft: outer shell -> rim -> inner basin -> closed bottom.
  function vessel(g,w,d,y,depth,kind,name){
    const rings=[[w*.92,d*.88,y-depth,.0],[w,d,y-.014,0],[w*.84,d*.70,y,0],[w*.63,d*.45,y-depth*.74,.025]],N=64,verts=[],ind=[];
    rings.forEach(([rw,rd,h,zoff])=>{for(let i=0;i<N;i++){const a=i/N*Math.PI*2,c=Math.cos(a),s=Math.sin(a);verts.push(Math.sign(c)*Math.pow(Math.abs(c),.28)*rw/2,h,Math.sign(s)*Math.pow(Math.abs(s),.28)*rd/2+zoff)}});
    for(let r=0;r<rings.length-1;r++)for(let i=0;i<N;i++){const j=(i+1)%N,a=r*N+i,b=r*N+j,c=(r+1)*N+j,d=(r+1)*N+i;ind.push(a,b,d,b,c,d)}
    const center=verts.length/3;verts.push(0,y-depth*.74,.025);for(let i=0;i<N;i++)ind.push(3*N+i,3*N+(i+1)%N,center);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(ind);geo.computeVertexNormals();
    // Loft winding is fixed and the shell is double-sided so the open bowl reads correctly.
    const white=material(kind);white.side=THREE.DoubleSide;
    const m=new THREE.Mesh(geo,white);m.castShadow=m.receiveShadow=true;g.add(named(m,name));
    g.add(named(cyl(.019,.019,.003,material('chrome'),0,y-depth*.74+.004,.025,24),name+'-drain'));
  }
  function vanity(f,r){
    const g=new THREE.Group(),w=M(f.w),d=M(f.d),chrome=material('chrome'),warm=prefs().variants[r.id]==='warm';
    g.add(named(box(w-.02,.41,d-.03,material('wood'),0,.24,0),'cabinet-body'));
    const n=w>.85?3:2,cw=(w-.034)/n;
    for(let i=0;i<n;i++)g.add(named(box(cw-.006,.385,.018,material('wood'),-w/2+.017+cw*(i+.5),.255,d/2-.008),'cabinet-front-'+i));
    g.add(named(box(w,.045,d,material('dark'),0,.655,0),'countertop'));
    vessel(g,w*(warm?.81:.98),d*.95,.84,.135,'white','basin');
    const fz=-d*.36;
    g.add(named(cyl(.026,.029,.16,chrome,0,.70,fz,20),'faucet-base'));
    g.add(named(tube([[0,.82,fz],[0,.94,fz],[0,.955,fz+.06],[0,.945,fz+.11]],.015,chrome,24),'faucet-spout'));
    g.add(named(box(.019,.01,.08,chrome,0,.965,fz+.02),'faucet-lever'));
    const mh=.86,mw=w*.96,mz=-d/2+.025,my=1.07;
    g.add(named(box(mw+.018,mh+.018,.018,chrome,0,my-.009,mz-.012),'mirror-frame'));
    const mirror=new Reflector(new THREE.PlaneGeometry(mw,mh),{color:0xdadfe0,textureWidth:384,textureHeight:512,multisample:0,clipBias:.003});
    mirror.position.set(0,my+mh/2,mz);mirror.userData.bathRoom=r.id;mirror.visible=false;mirrors.push(mirror);g.add(named(mirror,'mirror-'+r.label));
    // Neutral fallback behind the real mirror; never a photograph of people.
    const fallback=surface(mw,mh,'chrome',0,my,mz-.001,0,'mirror-fallback');g.add(fallback);
    return finishFixture(g,f,'vanity');
  }
  function bathtub(f){
    const g=new THREE.Group(),w=M(f.w),d=M(f.d);vessel(g,w,d,.59,.52,'white','freestanding-tub');
    const chrome=material('chrome');g.add(named(tube([[-w*.3,.56,-d*.37],[-w*.3,.70,-d*.37],[-w*.3,.72,-d*.24]],.016,chrome,22),'tub-filler'));
    return finishFixture(g,f,'tub');
  }
  function finishFixture(g,f,kind){g.position.set(wx(f.cx),0,wz(f.cy));g.rotation.y=-f.rot*Math.PI/180;g.userData={fid:f.id,bathroomV23:true,kind};return g}
  function shower(r,top){
    const [x0,z0,x1,z1]=r.bounds,X0=wx(x0)+.02,X1=wx(x1)-.02,front=wz(r.front),L=X1-X0,h=Math.min(2.05,top),chrome=material('chrome');
    if(h<.04)return;
    const g=named(new THREE.Group(),'shower-'+r.label),fixed=L*.53,door=L*.53,open=prefs().opened[r.id];
    g.userData={bathroomV23:true,proposal:true,room:r.id};
    const panel=(len,cx,z,name)=>{const p=box(len,h,.008,material('glass'),cx,0,z);p.castShadow=false;g.add(named(p,name));return p};
    panel(fixed,X0+fixed/2,front,'fixed-glass');
    const dc=open?X0+door/2+.025:X1-door/2;
    panel(door,dc,front+.018,'sliding-glass');
    [X0,X1].forEach(x=>g.add(named(box(.018,h,.022,chrome,x,0,front),'side-frame')));
    g.add(named(box(L,.023,.042,chrome,(X0+X1)/2,h-.025,front),'sliding-track'));
    g.add(named(box(L,.015,.032,chrome,(X0+X1)/2,0,front),'bottom-rail'));
    if(h>1.05)g.add(named(rod([dc+door*.35,.85,front+.05],[dc+door*.35,1.06,front+.05],.009,chrome),'door-handle'));
    // Colliders follow the proposed sliding pane rather than the fixed door opening.
    glassBounds.push([X0,front-.015,X0+fixed,front+.012],[dc-door/2,front+.012,dc+door/2,front+.032]);
    const sz=wz(r.far)+(r.id==='wet-a'?.06:-.06),sx=wx((x0+x1)/2),direction=r.id==='wet-a'?1:-1;
    const showerG=new THREE.Group();showerG.position.set(sx,0,sz);showerG.rotation.y=direction<0?Math.PI:0;
    const add=(o,name)=>showerG.add(named(o,name));
    if(top>1.92){add(rod([0,.94,0],[0,1.87,0],.011,chrome),'shower-rail');add(tube([[0,1.60,0],[0,1.80,.055],[0,1.84,.13]],.012,chrome,18),'shower-neck');const head=cyl(.074,.074,.018,chrome,0,1.81,.14,24);head.rotation.x=.6;add(head,'shower-head');}
    if(top>1.02){add(rod([-.13,.93,.015],[.13,.93,.015],.023,chrome),'mixer');add(tube([[.10,.93,.02],[.20,.54,.055],[-.12,.56,.10],[-.02,1.52,.03]],.007,chrome,32),'shower-hose');}
    g.add(showerG);archUp.add(g);
  }
  const baseBuildArch=buildArch;
  buildArch=function(){
    baseBuildArch();glassBounds=[];builtFaces=[];
    if(!prefs().enabled)return;
    const top=opt.cut;
    C.rooms.forEach(r=>{
      const kind=prefs().variants[r.id],fl=archFloor.children.find(o=>o.userData.room===r.id);
      if(fl)fl.material=material(kind==='warm'?'dark':'gray');
      r.surfaces.forEach(e=>{const h=Math.min(top,e.head)-e.bottom;if(h<=.001)return;
        const mid=(e.lo+e.hi)/2;
        const x=e.axis===0?wx(e.fixed)+e.sign*.004:wx(mid),z=e.axis===1?wz(e.fixed)+e.sign*.004:wz(mid);
        const angle=e.axis===0?e.sign*Math.PI/2:e.sign===1?0:Math.PI;
        const m=surface(M(e.hi-e.lo),h,kind,x,e.bottom,z,angle,r.id+'-'+e.source);m.userData.room=r.id;archUp.add(m);builtFaces.push({...e,roomId:r.id,height:h});
      });
      if(prefs().enclosures)shower(r,top);
      const [a,b,c,d]=r.bounds,light=new THREE.PointLight(0xfff1de,0,5,1.7);light.position.set(wx((a+c)/2),H-.23,wz((b+d)/2));light.userData.bathroomV23=true;lampG.add(light);
    });
    applyLight();
  };
  const baseBuildFurniture=buildFurniture,baseBuildFurn=buildFurn;
  buildFurniture=function(f){if(prefs().enabled){const r=C.rooms.find(r=>r.id===f.roomId||r.fixtureIds.includes(f.id));if(r&&f.type==='vanity')return vanity(f,r);if(r&&f.type==='bathtub')return bathtub(f)}return baseBuildFurniture(f)};
  buildFurn=function(){mirrors.forEach(m=>{m.getRenderTarget().dispose();m.material.dispose()});mirrors=[];baseBuildFurn()};
  const baseApplyLight=applyLight;
  applyLight=function(){baseApplyLight();lampG.children.forEach(o=>{if(o.userData.bathroomV23)o.intensity=opt.night?2.4:.85})};
  const baseSync=sync;
  sync=function(force){const s=JSON.stringify(prefs());baseSync(force||s!==signature);signature=s;syncMirrors();paintUI()};
  const baseBlocked=blocked;
  blocked=function(x,z,r=.22){if(baseBlocked(x,z,r))return true;return glassBounds.some(([x0,z0,x1,z1])=>x>x0-r&&x<x1+r&&z>z0-r&&z<z1+r)};
  function syncMirrors(){if(!inited)return;mirrors.forEach(m=>{const r=room(m.userData.bathRoom),[a,b,c,d]=r.bounds;const inside=camera.position.x>wx(a)&&camera.position.x<wx(c)&&camera.position.z>wz(b)&&camera.position.z<wz(d);m.visible=prefs().enabled&&opt.cut>=1.96&&inside})}
  const baseLoop=loop;loop=function(){syncMirrors();baseLoop()};
  const baseRenderRooms=renderRooms;
  renderRooms=function(){baseRenderRooms();drawPlan()};
  function drawPlan(){
    let guide=svg.querySelector('#gBathroomV23');if(!guide){guide=document.createElementNS('http://www.w3.org/2000/svg','g');guide.id='gBathroomV23';guide.style.pointerEvents='none';svg.querySelector('#gRooms').after(guide)}guide.innerHTML='';
    if(!prefs().enabled)return;
    C.rooms.forEach(r=>{const p=svg.querySelector('#gRooms [data-room="'+r.id+'"]');if(p)p.setAttribute('fill',prefs().variants[r.id]==='warm'?'#7b7b75':'#a1a6a5');
      if(prefs().enclosures){const [a,,c]=r.bounds,mid=(a+c)/2;guide.innerHTML+='<path d="M'+a+' '+r.front+'H'+c+'" fill="none" stroke="#468187" stroke-width="2" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/><text x="'+mid+'" y="'+(r.front-70)+'" font-size="90" text-anchor="middle" fill="#376f75">玻璃隔間提案</text>';}
    });
  }
  const bar=document.createElement('div');bar.id='bath-v23-tools';bar.className='grp';bar.style.cssText='flex-basis:100%;flex-wrap:wrap;background:#edf4f1;padding:5px 8px;gap:5px';
  bar.innerHTML='<b style="margin-right:6px">V2.3 衛浴試配</b>'+C.rooms.map(r=>'<button class="btn" data-bath="'+r.id+'">衛浴 '+r.label+'</button>').join('')+'<select id="bath-variant" aria-label="目前衛浴材質"><option value="warm">暖米石紋</option><option value="gray">冷灰石紋</option></select><button class="btn" id="bath-glass">隔間提案</button><button class="btn" id="bath-door">玻璃門開／關</button><button class="btn" id="bath-enabled">衛浴外觀開／關</button><button class="btn" id="bath-detail">浴櫃近看</button><button class="btn" id="bath-whole">全屋</button><small style="color:#566c65">顏色、隔間與高度暫定；非施工圖</small>';
  document.querySelector('header').appendChild(bar);
  function change(fn){mutate(()=>{const p=prefs();fn(p);state.bathroomV23=p})}
  async function focus(id,detail=false){if(!room(id))throw Error('Unknown bathroom');focusId=id;await setView('3d');if(opt.mode==='walk')setMode('orbit');opt.cut=H;sync(true);syncCutBtns();showLabels(false);const r=room(id),[a,b,c,d]=r.bounds;orbit.minDistance=.25;orbit.maxPolarAngle=Math.PI*.75;
    const z=r.id==='wet-a'?d-(d-b)*.12:b+(d-b)*.16;
    const targetZ=r.id==='wet-a'?b+(d-b)*.34:d-(d-b)*.14;
    const P=pose(new THREE.Vector3(wx((a+c)/2),1.06,wz(targetZ)),new THREE.Vector3(wx(a+(c-a)*.30),1.65,wz(z)));
    if(detail){const f=state.furniture.find(f=>r.fixtureIds.includes(f.id)&&f.type==='vanity');if(f){const a=f.rot*Math.PI/180,dist=.85;P.t.set(wx(f.cx),1.05,wz(f.cy));P.p.set(wx(f.cx)-Math.sin(a)*dist,1.52,wz(f.cy)+Math.cos(a)*dist)}}
    fly=null;setPose(P);orbit.update();paintUI();return id;
  }
  bar.querySelectorAll('[data-bath]').forEach(b=>b.onclick=()=>focus(b.dataset.bath));
  $('#bath-variant').onchange=e=>change(p=>p.variants[focusId]=e.target.value);
  $('#bath-glass').onclick=()=>change(p=>p.enclosures=!p.enclosures);
  $('#bath-door').onclick=()=>change(p=>p.opened[focusId]=!p.opened[focusId]);
  $('#bath-enabled').onclick=()=>change(p=>p.enabled=!p.enabled);
  $('#bath-detail').onclick=()=>focus(focusId,true);
  $('#bath-whole').onclick=async()=>{await setView('3d');if(opt.mode==='walk')setMode('orbit');opt.cut=1.2;sync(true);syncCutBtns();orbit.minDistance=1.5;orbit.maxPolarAngle=Math.PI*.495;showLabels(opt.labels);flyTo(isoWhole());paintUI()};
  function paintUI(){bar.querySelectorAll('[data-bath]').forEach(b=>b.classList.toggle('on',b.dataset.bath===focusId));$('#bath-variant').value=prefs().variants[focusId];$('#bath-glass').classList.toggle('on',prefs().enclosures);$('#bath-enabled').classList.toggle('on',prefs().enabled)}
  window.BathroomsV23={focus,config:C,settings:prefs,change,health:()=>({version:C.version,faces:builtFaces.length,faceRecords:builtFaces,mirrorCount:mirrors.length,activeMirrors:mirrors.filter(m=>m.visible).length,glassSegments:glassBounds.length,settings:prefs(),fixtureIds:furnG?.children.filter(g=>g.userData.bathroomV23).map(g=>g.userData.fid),baseRooms:ROOMS.map(r=>({id:r.id,poly:r.poly,mat:r.mat})),baseWalls:WALLS,baseDoors:DOORS,resourceCounts:renderer?.info.memory})};
  drawPlan();paintUI();
}
