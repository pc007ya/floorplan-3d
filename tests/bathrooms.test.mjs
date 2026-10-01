import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {bathroomConfig} from '../js/bathrooms-v23.mjs';
import {compileHome} from '../js/compile-scene.mjs';
const home=JSON.parse(await readFile(new URL('../data/home.json',import.meta.url),'utf8'));
const engine=await readFile(new URL('../engine.html',import.meta.url),'utf8');
const adapter=await readFile(new URL('../js/bathrooms-v23.mjs',import.meta.url),'utf8');
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-6,message??`${a} != ${b}`);
const boundary=(e,poly)=>poly.some((p,i)=>{
  const q=poly[(i+1)%poly.length],a=e.axis,b=1-a;
  return Math.abs(p[a]-q[a])<1e-6&&Math.abs(p[a]-e.fixed)<1e-6&&e.lo>=Math.min(p[b],q[b])-1e-6&&e.hi<=Math.max(p[b],q[b])+1e-6;
});
const inside=(poly,p)=>{
  let result=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])result=!result;
  }
  return result;
};

test('V2.3 keeps base geometry and fixture anchors immutable',()=>{
  const before=JSON.stringify(home),out=compileHome(engine,home);
  assert.equal(JSON.stringify(home),before);
  for(const marker of ['bathrooms-v23','installBathrooms','Reflector','freestanding-tub','getRenderTarget().dispose()','Loft winding'])assert.ok(out.includes(marker),marker);
  assert.match(out,/new Reflector\(new THREE.PlaneGeometry/);
  assert.match(out,/rings=\[\[w\*\.92/); // The hollow loft remains, rather than a solid box basin.
});

test('latest A/B bathrooms retain styles while canceled guest fixtures stay absent',()=>{
  const c=bathroomConfig(home);
  assert.deepEqual(c.rooms.map(r=>[r.id,r.variant]),[['wet-a','warm'],['wet-b','gray']]);
  assert.deepEqual(c.rooms.flatMap(r=>r.fixtureIds),['tub','wc-a','basin-a','wc-b','basin-b']);
  assert.equal(c.rooms.find(r=>r.id==='wet-b').floorPolygon.length,6);
  assert.equal(home.rooms.find(r=>r.id==='wet-c').poly.length,6);
  assert.equal(home.rooms.find(r=>r.id==='wet-c').mat,'tile800');
  assert.ok(!home.fixtures.some(f=>['basin-c','wc-c'].includes(f.id)||f.roomId==='wet-c'));
  assert.equal(home.doors.find(d=>d.name.includes('衛浴 C')).openingOnly,true);
  assert.equal(c.sourceVersion,'latest-pdf-1');
  assert.equal(c.assumptions.measurementsVerified,false);
});

test('cladding follows all actual polygon edges and faces inward, including the B inset',()=>{
  const c=bathroomConfig(home);
  assert.deepEqual(c.rooms.map(r=>r.surfaces.length),[9,7]);
  for(const r of c.rooms)for(const e of r.surfaces){
    assert.ok(e.hi>e.lo&&e.head>e.bottom);
    assert.match(e.source,/^(wall|window-sill|window-head|door-head)-/);
    assert.ok([1,-1].includes(e.sign));
    assert.ok(boundary(e,r.floorPolygon),`${r.id}: off-polygon face ${JSON.stringify(e)}`);
    const mid=(e.lo+e.hi)/2,p=e.axis===0?[e.fixed+e.sign,mid]:[mid,e.fixed+e.sign];
    assert.ok(inside(r.floorPolygon,p),`${r.id}: reversed face ${e.source}`);
  }
  const b=c.rooms[1],s=home.calibration.mmPerTraceUnit;
  assert.ok(b.surfaces.some(e=>e.axis===0&&Math.abs(e.fixed-800.88*s)<1e-6));
  assert.ok(b.surfaces.some(e=>e.axis===1&&Math.abs(e.fixed-604.68*s)<1e-6));
});

test('reversing polygon winding preserves inward cladding',()=>{
  const h=structuredClone(home);h.rooms.forEach(r=>r.poly.reverse());
  const normalize=c=>c.rooms.map(r=>r.surfaces.map(e=>JSON.stringify(e)).sort());
  assert.deepEqual(normalize(bathroomConfig(h)),normalize(bathroomConfig(home)));
});

test('calibration scales all horizontal config coordinates without scaling heights',()=>{
  const a=bathroomConfig(home),h=structuredClone(home);h.calibration.mmPerTraceUnit*=2;
  const b=bathroomConfig(h);
  assert.deepEqual(b.assumptions,a.assumptions);assert.equal(b.H,a.H);
  for(let i=0;i<a.rooms.length;i++){
    const x=a.rooms[i],y=b.rooms[i];
    for(const k of ['front','far'])near(y[k],x[k]*2);
    for(const k of ['bounds','enclosureBounds'])y[k].forEach((v,j)=>near(v,x[k][j]*2));
    y.floorPolygon.forEach((p,j)=>p.forEach((v,k)=>near(v,x.floorPolygon[j][k]*2)));
    y.surfaces.forEach((e,j)=>{
      for(const k of ['fixed','lo','hi'])near(e[k],x.surfaces[j][k]*2);
      for(const k of ['axis','sign','bottom','head','source'])assert.equal(e[k],x.surfaces[j][k]);
    });
  }
});

test('configured vertical opening heights are respected independently of plan calibration',()=>{
  const h=structuredClone(home);h.heightMm=3200;h.doorHeadMm=2300;h.windowSillMm=1100;h.windowHeadMm=2700;
  const c=bathroomConfig(h);
  assert.equal(c.H,3.2);assert.equal(c.assumptions.glassHeightM,2.05);
  for(const r of c.rooms)for(const e of r.surfaces){
    if(e.source.startsWith('door-head-'))assert.equal(e.bottom,2.3);
    else if(e.source.startsWith('window-head-'))assert.equal(e.bottom,2.7);
    if(e.source.startsWith('window-sill-'))assert.equal(e.head,1.1);else assert.equal(e.head,3.2);
  }
});

test('divider positions match latest plan and B uses its inset width',()=>{
  const c=bathroomConfig(home),s=home.calibration.mmPerTraceUnit;
  near(c.rooms[0].front,457.2*s);near(c.rooms[1].front,627.6*s);
  near(c.rooms[1].enclosureBounds[2],800.88*s);
  assert.ok(c.rooms[1].enclosureBounds[2]<c.rooms[1].bounds[2]);
  for(const r of c.rooms){
    const [x0,,x1]=r.enclosureBounds;
    for(const t of [.001,.25,.5,.75,.999])assert.ok(inside(r.floorPolygon,[x0+(x1-x0)*t,r.front]));
    for(const f of home.fixtures.filter(f=>r.fixtureIds.includes(f.id))){
      const a=f.rot*Math.PI/180,halfY=(Math.abs(Math.sin(a))*f.w+Math.abs(Math.cos(a))*f.d)*s/2;
      assert.ok(Math.abs(r.front-f.cy*s)>halfY+10,`${r.id}: ${f.id}`);
    }
  }
});

test('cladding leaves vertical and horizontal entrance/window openings clear',()=>{
  const c=bathroomConfig(home),s=home.calibration.mmPerTraceUnit;
  const openings=[...home.doors.map(d=>({rect:d.rect,bottom:0,head:(d.heightMm??home.doorHeadMm)/1000})),...home.windows.map(rect=>({rect,bottom:home.windowSillMm/1000,head:home.windowHeadMm/1000}))];
  for(const r of c.rooms)for(const e of r.surfaces)for(const opening of openings){
    const D=opening.rect.map(x=>x*s),a=e.axis,b=1-a;
    if(e.fixed<D[a]-1e-6||e.fixed>D[a+2]+1e-6)continue;
    const overlap=Math.min(e.hi,D[b+2])-Math.max(e.lo,D[b]);
    if(overlap>1e-6)assert.ok(Math.min(e.head,opening.head)-Math.max(e.bottom,opening.bottom)<=1e-6,`${r.id}: ${e.source} covers an opening`);
  }
});

test('current wall/window references are derived from current home, not stale snapshot indices',()=>{
  const c=bathroomConfig(home),s=home.calibration.mmPerTraceUnit;
  for(const r of c.rooms)for(const e of r.surfaces){
    const i=Number(e.source.match(/-(\d+)$/)[1]);
    const rect=(e.source.startsWith('wall-')?home.walls[i]:e.source.startsWith('door-head-')?home.doors[i].rect:home.windows[i]).slice(0,4).map(v=>v*s);
    assert.ok(e.fixed>=rect[e.axis]-1e-6&&e.fixed<=rect[e.axis+2]+1e-6);
    assert.ok(e.lo>=rect[1-e.axis]-1e-6&&e.hi<=rect[3-e.axis]+1e-6);
  }
});

test('overlay settings/config do not mutate base floor finishes or room names',()=>{
  const before=structuredClone(home),c=bathroomConfig(home);c.rooms[0].fixtureIds.push('test');c.rooms[1].floorPolygon[0][0]=0;
  assert.deepEqual(home,before);
  assert.ok(!bathroomConfig(home).rooms[0].fixtureIds.includes('test'));
  for(const id of ['open','a','b','c','wet-c'])assert.equal(home.rooms.find(r=>r.id===id).mat,'tile800');
  assert.equal(home.rooms.find(r=>r.id==='a').name,'主臥室');
});

test('unknown or incompatible bathroom polygons fail closed',()=>{
  const missing=structuredClone(home);missing.rooms=missing.rooms.filter(r=>r.id!=='wet-b');
  assert.throws(()=>bathroomConfig(missing),/known polygon/);
  const diagonal=structuredClone(home);diagonal.rooms.find(r=>r.id==='wet-b').poly[0][0]+=1;
  assert.throws(()=>bathroomConfig(diagonal),/axis-aligned/);
  const invalid=structuredClone(home);invalid.calibration.mmPerTraceUnit=NaN;
  assert.throws(()=>bathroomConfig(invalid),/valid plan scale/);
});

// Exercise the serialized installer with a small renderer/DOM double; real WebGL is
// separately verified by scripts/smoke-bathrooms.mjs. Low cut height avoids fixture plumbing.
function installerHarness(){
  const c=bathroomConfig(home);c.rooms.forEach(r=>r.surfaces=[]);
  const node=()=>({children:[],style:{},rotation:{},position:{set(x,y,z){this.x=x;this.y=y;this.z=z}},userData:{},add(...objects){this.children.push(...objects)},querySelectorAll(){return []},classList:{toggle(){}},setAttribute(k,v){this[k]=v}});
  const guide=node(),elements=new Map(),svg={querySelector(id){if(id==='#gBathroomV23')return guide;return node()}},bar=node();
  const archUp=node(),lampG=node(),state={bathroomV23:{}},box=(w,h,d,mat,x,y,z)=>Object.assign(node(),{w,h,d,mat,x,y,z});
  const sandbox={window:{},state,svg,document:{createElement(){return bar},querySelector(){return {appendChild(){}}}},$:id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id)},
    THREE:{Group:function(){return node()},MeshStandardMaterial:function(p){Object.assign(this,p)},MeshPhysicalMaterial:function(p){Object.assign(this,p)},PointLight:function(){return node()},DoubleSide:2},
    buildArch(){archUp.children=[];lampG.children=[]},buildFurniture(){return 'base-fixture'},buildFurn(){},applyLight(){},sync(){},blocked(){return false},loop(){},renderRooms(){},mutate(fn){fn()},
    archUp,archFloor:node(),lampG,furnG:node(),renderer:{info:{memory:{}}},opt:{cut:.8,night:false},inited:false,envTex:null,H:c.H,M:v=>v/1000,wx:v=>v/1000,wz:v=>v/1000,box,
    ROOMS:home.rooms,WALLS:home.walls,DOORS:home.doors};
  const installer=adapter.slice(adapter.indexOf('function installBathrooms(C)'));
  runInNewContext('('+installer+')('+JSON.stringify(c)+')',sandbox);
  return {sandbox,api:sandbox.window.BathroomsV23,guide,bar,archUp};
}

test('3D shower, collision bounds and 2D guide all use B enclosureBounds',()=>{
  const {sandbox,api,guide,archUp,bar}=installerHarness();sandbox.buildArch();
  assert.equal(api.health().glassSegments,4);
  assert.ok(!bar.innerHTML.includes('data-bath="wet-c"'));
  const b=api.config.rooms.find(r=>r.id==='wet-b'),[x0,,x1]=b.enclosureBounds;
  assert.ok(guide.innerHTML.includes('M'+x0+' '+b.front+'H'+x1+'"'));
  assert.equal((guide.innerHTML.match(/<path /g)||[]).length,2);
  const shower=archUp.children.find(o=>o.name==='bath-v23:shower-B'),rail=shower.children.find(o=>o.name==='bath-v23:sliding-track');
  near(rail.w,(x1-x0)/1000-.04);near(rail.x,(x0+x1)/2000);
  assert.equal(sandbox.blocked((x1+60)/1000,b.front/1000,.001),false); // B's solid inset is not extra glass.
  assert.equal(sandbox.blocked((x0+100)/1000,b.front/1000,.001),true);
});

test('V2.3 toggles remain reversible and cannot restore a C overlay',()=>{
  const {sandbox,api,guide}=installerHarness();sandbox.buildArch();
  api.change(p=>{p.enabled=false;p.variants['wet-c']='gray';p.opened['wet-c']=true});sandbox.buildArch();sandbox.renderRooms();
  assert.equal(api.health().glassSegments,0);assert.equal(guide.innerHTML,'');
  assert.deepEqual(Object.keys(api.settings().variants),['wet-a','wet-b']);
  assert.deepEqual(Object.keys(api.settings().opened),['wet-a','wet-b']);
  api.change(p=>{p.enabled=true;p.opened['wet-b']=true});sandbox.buildArch();
  assert.equal(api.health().glassSegments,4);assert.equal(api.settings().opened['wet-b'],true);
  api.change(p=>p.enclosures=false);sandbox.buildArch();sandbox.renderRooms();
  assert.equal(api.health().glassSegments,0);assert.equal(guide.innerHTML,'');
  api.change(p=>p.enclosures=true);sandbox.buildArch();sandbox.renderRooms();
  assert.equal(api.health().glassSegments,4);assert.equal((guide.innerHTML.match(/<path /g)||[]).length,2);
});
