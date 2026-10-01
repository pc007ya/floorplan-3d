import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {compileHome,scaledHome} from '../../js/compile-home.mjs';
import {applyFurniturePicking} from '../../js/furniture-picking.mjs';

export {THREE};
export function createPickingScene({patched=true,cut=1.2}={}) {
  const home=JSON.parse(readFileSync(new URL('../../data/home.json',import.meta.url)));
  const engine=readFileSync(new URL('../../engine.html',import.meta.url),'utf8');
  const h=scaledHome(home),[x0,y0,x1,y1]=h.extent,OX=(x0+x1)/2,OY=(y0+y1)/2;
  let source=compileHome(engine,home);if(patched)source=applyFurniturePicking(source);
  let geometry=source.slice(source.indexOf('const matCache ='),source.indexOf('function buildLabels(){'));
  // Texture pixels do not affect ray intersections; preserve every actual mesh.
  geometry=geometry.replace(/function floorMat\(kind\)\{[\s\S]*?(?=\/\* ======================= 几何小工具)/,"function floorMat(){ return mat('#eee'); }\n");
  const rect={left:0,top:0,width:1440,height:1000};
  const c={THREE,RoundedBoxGeometry,console,OX,OY,H:h.heightMm/1000,wx:x=>(x-OX)/1000,wz:y=>(y-OY)/1000,M:v=>v/1000,
    ROOMS:h.rooms,WALLS:h.walls,WINS:h.windows,DOORS:h.doors,SLIDES:h.slides,BALCONY_DOORS:h.balconyDoors,
    state:{furniture:h.fixtures,rooms:Object.fromEntries(h.rooms.map(r=>[r.id,{mat:r.mat}])),demolished:[]},
    opt:{cut,mode:'orbit',furn:true},archFloor:new THREE.Group(),archUp:new THREE.Group(),lampG:new THREE.Group(),furnG:new THREE.Group(),scene:new THREE.Scene(),
    glassMat:new THREE.MeshPhysicalMaterial({side:THREE.DoubleSide}),wallMat:new THREE.MeshStandardMaterial(),capMat:new THREE.MeshStandardMaterial(),frameMat:new THREE.MeshStandardMaterial(),
    camera:new THREE.PerspectiveCamera(45,rect.width/rect.height,.05,300),renderer:{domElement:{getBoundingClientRect:()=>rect}},active:true,anim:null,
    doors:[],colliders:[],applyLight(){},applyGrow(){},selKey:null};
  vm.createContext(c);vm.runInContext(geometry+'\nbuildArch();buildFurn();',c);
  c.scene.add(c.archUp,c.archFloor,c.furnG);c.scene.updateMatrixWorld(true);
  const start=source.indexOf(patched?'function isPickingSurface(':'const ray = new THREE.Raycaster()');
  vm.runInContext(source.slice(start,source.indexOf('function updateSel(){',start)),c);
  const span=Math.max(x1-x0,y1-y0)/1000;
  function cameraPose(width=1440,height=1000){rect.width=width;rect.height=height;c.camera.aspect=width/height;c.camera.position.set(span*.45,span*1.4,span*.85);c.camera.lookAt(0,0,0);c.camera.updateProjectionMatrix();c.camera.updateMatrixWorld(true)}
  cameraPose();
  const group=id=>c.furnG.children.find(o=>o.userData.fid===id);
  function point(id){const p=new THREE.Box3().setFromObject(group(id)).getCenter(new THREE.Vector3()).project(c.camera);return {clientX:(p.x+1)*rect.width/2,clientY:(1-p.y)*rect.height/2}}
  return {c,h,span,rect,cameraPose,group,point,pick:id=>c.pick(point(id))};
}
