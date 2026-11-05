/** Actual screenshot-matched Sand3D dataset geometry, not an approximation.
 * "laptop" by sangar17, CC BY 4.0; reconstructed by Sandflow as Sand3D.
 * Changes here: format conversion, ground/centre normalization, editable size/tint.
 */
import {SAND3D_LAPTOP_OBJECT} from './sand3d-laptop-data.mjs';
import {SAND3D_LAPTOP_LICENSE} from './sand3d-laptop-license.mjs';
export {SAND3D_LAPTOP_OBJECT};
export const SAND3D_LAPTOP_ENTRY={type:'sand3d-laptop',name:'Sand3D 筆記型電腦',en:'Sand3D laptop',w:350,d:293,color:'#a2a2a2',license:'CC-BY-4.0',source:'objaverse-d2b3ba347ffa4623a2ebc066050d8763',note:'圖片同款 Laptop，原作者 sangar17；Sandflow 重建，106 個原始網格。放在桌面時請設定底部高度，例如 740 mm。螢幕固定開啟，不含開闔關節。'};
export function buildSand3DLaptop(THREE,f,materialFactory,data){
  if(f.type!=='sand3d-laptop')return null;
  if(!Number.isFinite(f.w)||!Number.isFinite(f.d)||f.w<50||f.d<50)throw Error('Invalid Sand3D laptop footprint');
  // Cached source never enters a disposable scene. Each instance owns its geometry.
  const template=buildSand3DLaptop.template||(buildSand3DLaptop.template=new THREE.ObjectLoader().parse(data));
  const model=template.clone(true),materials=new Map();
  model.traverse(o=>{if(!o.isMesh)return;o.geometry=o.geometry.clone();
    const original=o.material;
    if(!materials.has(original.uuid)){
      const tint=original.name.startsWith('aluminium')&&/^#[a-f\d]{6}$/i.test(f.color||'')?f.color:'#'+original.color.getHexString();
      const options={roughness:original.roughness,metalness:original.metalness,side:original.side};
      materials.set(original.uuid,materialFactory?materialFactory(tint,options):new THREE.MeshStandardMaterial({color:tint,...options}));
    }
    o.material=materials.get(original.uuid);o.castShadow=o.receiveShadow=true;
  });
  model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());
  model.position.sub(new THREE.Vector3(centre.x,bounds.min.y,centre.z));
  const g=new THREE.Group();g.name='sand3d-laptop';g.add(model);g.scale.set(f.w/1000/size.x,1,f.d/1000/size.z);
  g.position.y=(Number.isFinite(f.elevationMm)?Math.max(0,Math.min(3000,f.elevationMm)):0)/1000;
  g.userData.source='Sandflow/sand3d-objaverse';g.userData.sourceId='objaverse-d2b3ba347ffa4623a2ebc066050d8763';g.userData.meshes=106;return g;
}

export function applySand3DLaptop(source){
  const safe=v=>JSON.stringify(v).replace(/</g,'\\u003c');
  const exact=(from,to,label)=>{if(source.split(from).length!==2)throw Error('Sand3D laptop adapter: '+label);source=source.replace(from,()=>to)};
  exact('const LIB = [',`SAND3D_CATALOG.push(${safe(SAND3D_LAPTOP_ENTRY)});\nconst LIB = [`,'library');
  exact('function buildFurniture(f){',`const SAND3D_LAPTOP_OBJECT=${safe(SAND3D_LAPTOP_OBJECT)};\n${buildSand3DLaptop.toString()}\nfunction buildFurniture(f){\n  const laptop=buildSand3DLaptop(THREE,f,mat,SAND3D_LAPTOP_OBJECT);if(laptop){laptop.position.x=wx(f.cx);laptop.position.z=wz(f.cy);laptop.rotation.y=-f.rot*Math.PI/180;laptop.userData.fid=f.id;return laptop;}`,'model');
  exact("  if(type.endsWith('lamp'))",`  if(type==='sand3d-laptop')return '<rect x="'+(-w/2)+'" y="'+(-d/2)+'" width="'+w+'" height="'+d+'" rx="12" fill="'+c+'" '+style+'/>'+ '<rect x="'+(-w*.46)+'" y="'+(-d*.12)+'" width="'+(w*.92)+'" height="'+(d*.47)+'" rx="4" fill="#303030" '+style+'/>'+ '<rect x="'+(-w*.18)+'" y="'+(d*.36)+'" width="'+(w*.25)+'" height="'+(d*.1)+'" fill="#777" '+style+'/>'+ '<path d="M'+(-w*.46)+' '+(-d*.36)+' H'+(w*.46)+'" '+style+'/>';\n  if(type.endsWith('lamp'))`,'2D icon');
  exact('6 件 Sand3D 範例轉寫／衍生家具。','6 件範例家具 + 圖片同款 106 網格筆電。','notice');
  exact('Sand3D／Apache-2.0・輕量轉寫<br>',`Sand3D／'+esc(sandEntry.license||'Apache-2.0')+'・'+(sandEntry.type==='sand3d-laptop'?'實際資料集模型':'範例轉寫')+'<br>`,'per-entry license');
  const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  exact('<pre style="white-space:pre-wrap;max-height:45vh;overflow:auto">', '<p><b>Laptop / CC BY 4.0</b><br>"laptop" by sangar17, <a href="https://sketchfab.com/3d-models/d2b3ba347ffa4623a2ebc066050d8763" target="_blank" rel="noopener noreferrer">Sketchfab source</a>. Modified by Sandflow: rewritten as a Sand3D program. Local changes: GLB→Three.js data, centering, ground alignment and editable size/tint. Dataset revision 92dd5858c177734782734c20f20b2de522b229bf.</p><details><summary>CC BY 4.0 完整授權</summary><pre style="white-space:pre-wrap;max-height:40vh;overflow:auto">'+escape(SAND3D_LAPTOP_LICENSE)+'</pre></details><pre style="white-space:pre-wrap;max-height:45vh;overflow:auto">','offline dataset license');
  return source;
}
