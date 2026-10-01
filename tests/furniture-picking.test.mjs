import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isPickingSurface,applyFurniturePicking} from '../js/furniture-picking.mjs';
import {createPickingScene,THREE} from './helpers/picking-scene.mjs';

test('pinned upstream engine stays byte-identical',()=>{const b=readFileSync(new URL('../engine.html',import.meta.url));assert.equal(createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'),'4cee1eae0684acfc660a27b18c218f1f7703193b')});
test('picking visibility includes ancestors and excludes visual helpers',()=>{
  const parent=new THREE.Group(),mesh=new THREE.Mesh();parent.add(mesh);assert.equal(isPickingSurface(mesh),true);
  parent.visible=false;assert.equal(isPickingSurface(mesh),false);parent.visible=true;mesh.visible=false;assert.equal(isPickingSurface(mesh),false);
  mesh.visible=true;parent.userData.walkOnly=true;assert.equal(isPickingSurface(mesh),false);parent.userData.walkOnly=false;mesh.userData.walkOnly=true;assert.equal(isPickingSurface(mesh),false);
});
test('adapter fails closed on unexpected source or duplicate installation',()=>{
  assert.throws(()=>applyFurniturePicking(''),/visibility helper/);
  const source=readFileSync(new URL('../engine.html',import.meta.url),'utf8');
  assert.throws(()=>applyFurniturePicking(applyFurniturePicking(source)),/selection filter/);
});
test('regression reproduces both hidden-line failures and selects both after filtering',()=>{
  const old=createPickingScene({patched:false}),fixed=createPickingScene();
  for(const id of ['v2-armchair','v2-plant']){assert.equal(old.pick(id),null,id+' must reproduce original bug');assert.equal(fixed.pick(id)?.fid,id)}
  for(const id of ['v2-sofa','v2-coffee-1'])assert.equal(fixed.pick(id)?.fid,id);
});
test('hidden parent cannot be picked; visible real wall still occludes furniture',()=>{
  const s=createPickingScene(),{c}=s,id='v2-armchair';
  c.furnG.visible=false;assert.notEqual(s.pick(id)?.fid,id);c.furnG.visible=true;
  const target=new THREE.Box3().setFromObject(s.group(id)).getCenter(new THREE.Vector3());
  const blocker=new THREE.Mesh(new THREE.BoxGeometry(2,2,.2),new THREE.MeshBasicMaterial());
  blocker.position.copy(c.camera.position).lerp(target,.8);blocker.lookAt(c.camera.position);c.archUp.add(blocker);c.scene.updateMatrixWorld(true);
  assert.equal(s.pick(id),null);blocker.visible=false;assert.equal(s.pick(id)?.fid,id);
});
test('ground placement also excludes hidden ancestor and decorative line hit targets',()=>{
  const s=createPickingScene(),{c}=s,p=s.point('v2-armchair');const before=c.groundAt(p.clientX,p.clientY);
  const g=new THREE.Group(),m=new THREE.Mesh(new THREE.BoxGeometry(3,3,3),new THREE.MeshBasicMaterial());
  m.position.copy(c.camera.position).lerp(new THREE.Vector3(before.x-c.OX,0,before.y-c.OY).multiplyScalar(.001),.5);g.add(m);g.visible=false;c.archUp.add(g);c.scene.updateMatrixWorld(true);
  const after=c.groundAt(p.clientX,p.clientY);assert.ok(Math.abs(after.x-before.x)<1e-6&&Math.abs(after.y-before.y)<1e-6);
});

test('door identity, glass pass-through and floor-room hits remain unchanged',()=>{
  const {c}=createPickingScene();c.archUp.clear();c.archFloor.clear();c.furnG.clear();
  c.camera.position.set(0,2,5);c.camera.lookAt(0,0,0);c.camera.updateMatrixWorld(true);
  const add=(distance,material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,.1),material);m.position.copy(c.camera.position).multiplyScalar(1-distance);m.lookAt(c.camera.position);c.archUp.add(m);return m};
  const door={open:true},leaf=add(.8,new THREE.MeshBasicMaterial());leaf.userData.door=door;
  const glass=add(.5,c.glassMat);c.scene.updateMatrixWorld(true);
  let hit=c.pick();assert.equal(hit.door,door);assert.ok(hit.dist>0);
  const helper=add(.3,new THREE.MeshBasicMaterial());helper.userData.walkOnly=true;c.scene.updateMatrixWorld(true);assert.equal(c.pick().door,door);
  delete leaf.userData.door;leaf.userData.room='test-room';assert.equal(c.pick().room,'test-room');
  leaf.visible=false;assert.equal(c.pick(),null);
});
test('ground placement retains genuine-wall intersection clamping',()=>{
  const s=createPickingScene(),{c}=s,p=s.point('v2-armchair'),before=c.groundAt(p.clientX,p.clientY);
  const target=new THREE.Vector3((before.x-c.OX)/1000,0,(before.y-c.OY)/1000);
  const wall=new THREE.Mesh(new THREE.BoxGeometry(2,2,.2),new THREE.MeshBasicMaterial());
  wall.position.copy(c.camera.position).lerp(target,.7);wall.lookAt(c.camera.position);c.archUp.add(wall);c.scene.updateMatrixWorld(true);
  const after=c.groundAt(p.clientX,p.clientY);assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>100);
});
