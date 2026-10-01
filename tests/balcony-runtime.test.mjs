import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';import * as THREE from 'three';import {scaledHome} from '../js/compile-home.mjs';
const h=scaledHome(JSON.parse(await readFile('data/home.json','utf8'))),source=await readFile('js/latest-geometry.mjs','utf8');
const runtime=source.slice(source.indexOf('function balconyRuntime(top)'));
test('real Three balcony meshes are flush and collision gap is walkable',()=>{
 for(const top of [1.2,2.8]){
  const [a,b,c,d]=h.extent,wx=v=>(v-(a+c)/2)/1000,wz=v=>(v-(b+d)/2)/1000,m=new THREE.MeshBasicMaterial(),floor=new THREE.Group(),up=new THREE.Group();
  const colliders=[...h.walls,...h.windows].map(r=>[wx(r[0]),wz(r[1]),wx(r[2]),wz(r[3])]);
  const context={THREE,BALCONY_DOORS:h.balconyDoors,M:v=>v/1000,wx,wz,archFloor:floor,archUp:up,colliders,frameMat:m,glassMat:m,floorMat:()=>m,mat:()=>m,metal:()=>m,box:(w,height,depth,material,x=0,y=0,z=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,height,depth),material);o.position.set(x,y+height/2,z);return o}};
  vm.createContext(context);vm.runInContext(runtime,context);const audit=context.balconyRuntime(top);
  const blocked=(x,z,r=.22)=>colliders.some(([a,b,c,d])=>x>a-r&&x<c+r&&z>b-r&&z<d+r);
  for(const [i,item] of audit.entries()){
   assert.ok(Math.abs(item.floorTopM)<1e-7);assert.ok(Math.abs(item.trackTopM)<1e-7);assert.ok(Math.abs(item.clearWidthM-[1.12315,.7231][i])<.00015);
   for(const p of item.routePoints)assert.equal(blocked(...p),false,item.id+' route');assert.equal(blocked(...item.fixedPoint,.1),true,item.id+' panel');
   assert.equal(floor.children.filter(x=>x.name.startsWith(item.id)).length,1);
   const meshes=up.children.find(x=>x.userData.balconyId===item.id).children;
   assert.equal(meshes.some(o=>o.name.includes('sill wall')),false);assert.equal(meshes.filter(o=>o.name.includes('retained header')).length,top===2.8?1:0);
  }
 }
});
