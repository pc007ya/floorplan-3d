import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as THREE from 'three';
import {SAND3D_LICENSE} from '../js/sand3d-license.mjs';
import {compileHome} from '../js/compile-scene.mjs';
import {SAND3D_CATALOG as catalog,SAND3D_REVISION,buildSand3DModel,sand3DSVG,applySand3DFurniture} from '../js/sand3d-furniture.mjs';
const engine=await readFile('engine.html','utf8'),home=JSON.parse(await readFile('data/home.json','utf8'));
const compiled=compileHome(engine,home);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function audit(g,f){
 g.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3());
 assert.ok([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite));
 near(size.x,f.w/1000);near(size.z,f.d/1000);assert.ok(size.y>.1&&size.y<3);
 let meshes=0;g.traverse(o=>{if(!o.isMesh)return;meshes++;assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));assert.ok([...o.geometry.attributes.normal.array].every(Number.isFinite));assert.ok(o.castShadow&&o.receiveShadow);assert.ok(!o.material.map);});assert.ok(meshes>=6);return bounds;
}
test('six models have real, finite Three meshes at exact footprints, including custom sizes',()=>{
 assert.equal(catalog.length,6);assert.equal(new Set(catalog.map(f=>f.type)).size,6);
 for(const a of catalog)for(const [w,d] of [[a.w,a.d],[50,50],[810,630]]){const f={...a,w,d};const before=JSON.stringify(f);const g=buildSand3DModel(THREE,f);const b=audit(g,f);near(b.min.y,0);near(b.min.x,-w/2000);near(b.min.z,-d/2000);assert.equal(JSON.stringify(f),before);}
});
test('elevation is preserved and bounded independently of footprint and geometry height',()=>{
 for(const a of catalog)for(const [elevationMm,expected] of [[740,.740],[-30,0],[4000,3],[NaN,0],[Infinity,0]]){const f={...a,elevationMm};const b=audit(buildSand3DModel(THREE,f),f);near(b.min.y,expected);}
 assert.equal(buildSand3DModel(THREE,{type:'sofa'}),null);
 for(const w of [NaN,Infinity,-1,49])assert.throws(()=>buildSand3DModel(THREE,{...catalog[0],w}),/footprint/);
});
test('compiled editor builds each Sand3D item with placement, rotation and selection identity',()=>{
 const start=compiled.indexOf('function buildSand3DModel('),end=compiled.indexOf('function buildFurn(){',start);
 const c={THREE,mat:(color,extra)=>new THREE.MeshStandardMaterial({color,...extra}),wx:x=>(x-1000)/1000,wz:y=>(y-2000)/1000};vm.createContext(c);vm.runInContext(compiled.slice(start,end),c);
 for(const [i,a] of catalog.entries()){const f={...a,id:`qa-${i}`,cx:1200,cy:2500,rot:90,elevationMm:740};const g=c.buildFurniture(f);near(g.position.x,.2);near(g.position.z,.5);near(g.position.y,.74);near(g.rotation.y,-Math.PI/2);assert.equal(g.userData.fid,f.id);assert.equal(g.userData.source,'Sandflow-ai/sand3d');}
});
test('compile preserves baseline home, immutable upstream engine and defaults',()=>{
 const before=JSON.stringify(home);compileHome(engine,home);assert.equal(JSON.stringify(home),before);
 assert.equal(createHash('sha1').update(`blob ${Buffer.byteLength(engine)}\0`).update(engine).digest('hex'),'4cee1eae0684acfc660a27b18c218f1f7703193b');
 assert.ok(home.fixtures.every(f=>!f.type.startsWith('sand3d-')));assert.equal(home.fixtures.length,27);
 assert.match(compiled,/id="fElevation"/);assert.match(compiled,/Sand3D 精選/);assert.match(compiled,/sandEntry.note/);
});
test('adapter fails closed on missing, duplicate and twice-applied anchors',()=>{
 assert.throws(()=>applySand3DFurniture(engine.replace('const LIB = [','const LOST = [')),/Sand3D adapter: library/);
 assert.throws(()=>applySand3DFurniture(engine+'\nconst LIB = ['),/Sand3D adapter: library/);
 assert.throws(()=>applySand3DFurniture(applySand3DFurniture(engine)),/Sand3D adapter:/);
});
test('2D icons match all entries and do not interpolate unsafe colors',()=>{
 for(const a of catalog){const svg=sand3DSVG(a.type,a.w,a.d,a.color);assert.match(svg,/(rect|ellipse)/);assert.ok(svg.includes(a.color));assert.ok(!/NaN|undefined/.test(svg));assert.ok(!sand3DSVG(a.type,a.w,a.d,'"><script>x</script>').includes('<script>'));}
 assert.equal(sand3DSVG('sofa',100,100,'#ffffff'),null);
 assert.match(sand3DSVG(catalog[0].type,540,570,'#ffffff'),/circle/);
});
test('source provenance pins exact local and original bytes, with Apache license and no runtime downloaded code',async()=>{
 const sources=JSON.parse(await readFile('data/references/sand3d-sources.json','utf8'));
 assert.equal(sources.revision,SAND3D_REVISION);assert.match(SAND3D_REVISION,/^[a-f\d]{40}$/);assert.equal(sources.license,'Apache-2.0');
 assert.equal(sources.datasetStatus.used,false);assert.equal(sources.execution.downloadedSourceExecuted,false);
 for(const f of sources.files){const bytes=await readFile(f.localPath);const hash=b=>createHash('sha256').update(b).digest('hex');assert.equal(hash(bytes),f.localSha256);assert.equal(hash(bytes.subarray(0,-1)),f.upstreamSha256);assert.ok(f.sourceUrl.includes('/'+SAND3D_REVISION+'/'));}
 assert.match(await readFile('docs/licenses/sand3d-Apache-2.0.txt','utf8'),/Apache License/);assert.equal(SAND3D_LICENSE,await readFile('docs/licenses/sand3d-Apache-2.0.txt','utf8'));assert.ok(compiled.includes('id="sand3d-license"'));
 const runtime=await readFile('js/sand3d-furniture.mjs','utf8');assert.doesNotMatch(runtime,/\beval\s*\(|new Function\s*\(|\bfetch\s*\(|\.load\s*\(|import\s*\(/);
 assert.deepEqual(sources.adaptations.map(a=>a.type).sort(),catalog.map(a=>a.type).sort());
});
