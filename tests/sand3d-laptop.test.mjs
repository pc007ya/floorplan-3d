import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SAND3D_LAPTOP_OBJECT as data,SAND3D_LAPTOP_ENTRY as entry,buildSand3DLaptop,applySand3DLaptop} from '../js/sand3d-laptop.mjs';
import {SAND3D_CATALOG,buildSand3DModel,applySand3DFurniture} from '../js/sand3d-furniture.mjs';
import {compileHome} from '../js/compile-scene.mjs';
const bytes=await readFile('assets/sand3d/laptop.glb');
const source=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'')).scene;
source.updateMatrixWorld(true);
const nodes=o=>{const a=[];o.traverse(n=>a.push(n));return a;};
const meshes=o=>nodes(o).filter(n=>n.isMesh);
const bounds=o=>{o.updateMatrixWorld(true);return new THREE.Box3().setFromObject(o);};
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-7,msg||`${a} != ${b}`);
const build=(overrides={})=>buildSand3DLaptop(THREE,{...entry,...overrides},null,data);
const engine=await readFile('engine.html','utf8'),home=JSON.parse(await readFile('data/home.json','utf8')),compiled=compileHome(engine,home);

test('pinned source has 106 meshes and no external buffers, textures or code',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'c1ca61806c3548a215d9ec9a833e7c1263e600df1f81d1932952547b09c3020f');
 const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 assert.equal(meshes(source).length,106);assert.equal(gltf.images?.length||0,0);assert.equal(gltf.textures?.length||0,0);assert.ok(gltf.buffers.every(b=>!b.uri));assert.equal(data.images?.length||0,0);assert.equal(data.textures?.length||0,0);
 assert.equal(entry.source,'objaverse-d2b3ba347ffa4623a2ebc066050d8763');assert.equal(entry.license,'CC-BY-4.0');
});
test('GLTF→ObjectLoader preserves every vertex, normal, index, material and node world transform',()=>{
 const converted=new THREE.ObjectLoader().parse(data);converted.updateMatrixWorld(true);const a=nodes(source),b=nodes(converted);assert.equal(a.length,b.length);
 for(let i=0;i<a.length;i++){
  const x=a[i],y=b[i];assert.equal(y.name,x.name);x.matrixWorld.elements.forEach((v,j)=>near(y.matrixWorld.elements[j],v,`${x.name}: world matrix ${j}`));
  if(!x.isMesh)continue;assert.ok(y.isMesh);assert.deepEqual(Object.keys(y.geometry.attributes).sort(),Object.keys(x.geometry.attributes).sort());
  for(const key of Object.keys(x.geometry.attributes)){const xa=x.geometry.attributes[key],ya=y.geometry.attributes[key];assert.equal(ya.itemSize,xa.itemSize);assert.deepEqual([...ya.array].map(v=>v===0?0:v),[...xa.array].map(v=>v===0?0:v),`${x.name}: ${key} (JSON normalizes negative zero)`);assert.ok([...ya.array].every(Number.isFinite));}
  assert.deepEqual([...y.geometry.index.array],[...x.geometry.index.array],`${x.name}: triangle indices`);
  assert.equal(y.material.color.getHex(),x.material.color.getHex());for(const k of ['metalness','roughness','side'])assert.equal(y.material[k],x.material[k]);
 }
 const sa=bounds(source),sb=bounds(converted);sa.min.toArray().forEach((v,i)=>near(sb.min.toArray()[i],v));sa.max.toArray().forEach((v,i)=>near(sb.max.toArray()[i],v));
});
test('laptop is grounded at exact 350×293 mm and source height, with editable size/elevation',()=>{
 const height=bounds(source).getSize(new THREE.Vector3()).y;
 for(const [w,d,elevationMm,expectedY] of [[350,293,0,0],[500,400,740,.74],[50,50,-10,0],[350,293,4000,3],[350,293,Infinity,0]]){
  const g=build({w,d,elevationMm}),b=bounds(g),s=b.getSize(new THREE.Vector3());near(s.x,w/1000);near(s.z,d/1000);near(s.y,height);near(b.min.y,expectedY);near(b.min.x,-w/2000);near(b.min.z,-d/2000);assert.ok(s.y>.2&&s.y<.3);assert.equal(meshes(g).length,106);assert.equal(g.userData.meshes,106);
 }
 for(const w of [0,49,NaN,Infinity])assert.throws(()=>build({w}),/footprint/);assert.equal(buildSand3DLaptop(THREE,{type:'sofa'},null,data),null);
});
test('instances own geometry/materials and disposing or tinting one cannot alter another/template',()=>{
 const a=build(),b=build(),template=buildSand3DLaptop.template;const aa=meshes(a),bb=meshes(b),tt=meshes(template);const original=JSON.stringify(data);
 for(let i=0;i<aa.length;i++){assert.notEqual(aa[i].geometry,bb[i].geometry);assert.notEqual(aa[i].geometry,tt[i].geometry);assert.notEqual(aa[i].material,bb[i].material);assert.notEqual(aa[i].material,tt[i].material);}
 let otherDisposed=0;for(const o of [...bb,...tt]){o.geometry.addEventListener('dispose',()=>otherDisposed++);o.material.addEventListener('dispose',()=>otherDisposed++);}
 const x=bb[0].geometry.attributes.position.getX(0);aa[0].geometry.attributes.position.setX(0,999);aa[0].material.color.set('#ff0000');for(const o of aa){o.geometry.dispose();o.material.dispose();}
 assert.equal(otherDisposed,0);assert.equal(bb[0].geometry.attributes.position.getX(0),x);assert.equal(tt[0].geometry.attributes.position.getX(0),x);assert.equal(JSON.stringify(data),original);
 assert.equal(meshes(build()).length,106);
});
test('original five materials are preserved; editing color tints aluminium only',()=>{
 const src=meshes(source),normal=meshes(build()),tinted=meshes(build({color:'#a45f82'})),invalid=meshes(build({color:'<script>'}));
 for(let i=0;i<src.length;i++){
  const material=src[i].material;assert.equal(normal[i].material.color.getHex(),material.color.getHex());assert.equal(invalid[i].material.color.getHex(),material.color.getHex());
  assert.equal(tinted[i].material.color.getHexString(),material.name.startsWith('aluminium')?'a45f82':material.color.getHexString());for(const k of ['roughness','metalness','side'])assert.equal(tinted[i].material[k],material[k]);
  assert.ok(tinted[i].castShadow&&tinted[i].receiveShadow);assert.equal(tinted[i].material.map,null);
 }
});
test('compiled library adds laptop without mutating prior six entries or the 27 default fixtures',()=>{
 const before=JSON.stringify(home);compileHome(engine,home);assert.equal(JSON.stringify(home),before);assert.equal(home.fixtures.length,27);assert.ok(home.fixtures.every(f=>!f.type.startsWith('sand3d-')));assert.equal(SAND3D_CATALOG.length,6);
 const c={};vm.createContext(c);const start=compiled.indexOf('const SAND3D_CATALOG ='),end=compiled.indexOf('const LIB = [',start);vm.runInContext(compiled.slice(start,end)+';globalThis.entries=SAND3D_CATALOG;',c);
 assert.deepEqual(JSON.parse(JSON.stringify(c.entries)),[...SAND3D_CATALOG,entry]);
 for(const a of SAND3D_CATALOG)assert.ok(buildSand3DModel(THREE,a));
 const ctx={THREE,mat:(color,extra)=>new THREE.MeshStandardMaterial({color,...extra}),wx:x=>(x-1000)/1000,wz:z=>(z-2000)/1000};vm.createContext(ctx);
 const bs=compiled.indexOf('function buildSand3DModel('),be=compiled.indexOf('function buildFurn(){',bs);vm.runInContext(compiled.slice(bs,be),ctx);
 const g=ctx.buildFurniture({...entry,id:'qa-laptop',cx:1200,cy:2500,rot:90,elevationMm:740});assert.equal(meshes(g).length,106);near(g.position.x,.2);near(g.position.z,.5);near(g.position.y,.74);near(g.rotation.y,-Math.PI/2);assert.equal(g.userData.fid,'qa-laptop');
 const si=compiled.indexOf('function sand3DSVG('),se=compiled.indexOf('function furnSVG(',si);vm.runInContext(compiled.slice(si,se),ctx);const svg=ctx.sand3DSVG(entry.type,350,293,'#a2a2a2');assert.match(svg,/303030/);assert.match(svg,/<path/);assert.doesNotMatch(svg,/NaN|undefined/);
 assert.match(compiled,/sangar17/);assert.match(compiled,/CC BY 4.0 完整授權/);
});
test('laptop adapter fails closed for missing, duplicated and already-patched anchors',()=>{
 const base=applySand3DFurniture(engine);assert.throws(()=>applySand3DLaptop(base.replace('const LIB = [','const LOST = [')),/laptop adapter: library/);assert.throws(()=>applySand3DLaptop(base+'const LIB = ['),/laptop adapter: library/);assert.throws(()=>applySand3DLaptop(applySand3DLaptop(base)),/laptop adapter:/);
});
