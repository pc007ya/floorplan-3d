import {SAND3D_LICENSE} from './sand3d-license.mjs';
/** Sand3D official example adaptations, Apache-2.0. See docs/sand3d-attribution.md.
 * Reviewed Python is preserved as documentation, never imported or executed.
 * Local changes: Three.js geometry, curated materials, two backless variants and
 * a taller lamp. These are lightweight adaptations, not Blender-identical meshes.
 */
export const SAND3D_REVISION = '0d589a5ba568fd72c8da97f8d039918650608a42';
export const SAND3D_CATALOG = [
  {type:'sand3d-tufted-chair',name:'釦背鉚釘單椅',en:'Tufted accent chair',w:540,d:570,color:'#8daba1',source:'programs/tufted_chair.py',note:'捲背、菱格釦飾與鉚釘軟墊；官方程式的輕量轉寫。'},
  {type:'sand3d-tufted-ottoman',name:'配套鉚釘軟凳',en:'Tufted ottoman',w:540,d:500,color:'#bf8b61',source:'programs/tufted_chair.py',note:'同一軟墊程式省略椅背的衍生款，不是另一筆資料集物件。'},
  {type:'sand3d-button-chair',name:'六釦木腳餐椅',en:'Button-back dining chair',w:440,d:420,color:'#b9c7cc',source:'docs/examples/chair.py',note:'六顆背釦、錐形木腳與側橫桿；官方範例轉寫。'},
  {type:'sand3d-tapered-stool',name:'錐腳小矮凳',en:'Tapered-leg stool',w:440,d:420,color:'#cba878',source:'docs/examples/chair.py',note:'餐椅骨架省略背板的衍生款。'},
  {type:'sand3d-table-lamp',name:'黃銅錐罩檯燈',en:'Conical table lamp',w:180,d:180,color:'#efe2c8',source:'docs/examples/lamp.py',note:'預設放在地面；放到桌面時請設定底部高度，例如 740 mm。'},
  {type:'sand3d-floor-lamp',name:'錐罩閱讀落地燈',en:'Conical floor lamp',w:360,d:360,color:'#56776b',source:'docs/examples/lamp.py',note:'同一燈具程式加高燈桿、加大燈罩與底座的衍生款。'}
];

/** Standalone builder, serialized into the preserved engine. Units: metres, Y-up.
 * All geometry and materials are local. No remote code, textures or model loads.
 */
export function buildSand3DModel(THREE, f, materialFactory) {
  const types=['sand3d-tufted-chair','sand3d-tufted-ottoman','sand3d-button-chair','sand3d-tapered-stool','sand3d-table-lamp','sand3d-floor-lamp'];
  const i=types.indexOf(f.type); if(i<0)return null;
  if(!Number.isFinite(f.w)||!Number.isFinite(f.d)||f.w<50||f.d<50)throw Error('Invalid Sand3D footprint');
  const g=new THREE.Group();g.name=f.type;
  const material=materialFactory || ((color,extra)=>new THREE.MeshStandardMaterial({color,...extra}));
  const color=/^#[a-f\d]{6}$/i.test(f.color||'')?f.color:'#b9c7cc';
  const fabric=material(color,{roughness:.9}),wood=material('#48362b',{roughness:.66}),brass=material('#b99a61',{metalness:.65,roughness:.32}),dark=material('#302e29',{roughness:.55});
  const mesh=(geo,m,x=0,y=0,z=0,name='part')=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.name=name;o.castShadow=o.receiveShadow=true;g.add(o);return o};
  const box=(w,h,d,m,x=0,y=0,z=0,name)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y+h/2,z,name);
  const cylinder=(rt,rb,h,m,x=0,y=0,z=0,name)=>mesh(new THREE.CylinderGeometry(rt,rb,h,24),m,x,y+h/2,z,name);
  const dome=(rx,ry,rz,m,x,y,z,name)=>{const o=mesh(new THREE.SphereGeometry(1,16,10),m,x,y,z,name);o.scale.set(rx,ry,rz);return o};
  // Closed rings following the original superellipse cross-sections (mm -> m).
  const loft=(rows,exponent,m,name)=>{
    const points=[],indices=[],N=48;
    rows.forEach(([h,cy,w,d],r)=>{for(let n=0;n<N;n++){const a=2*Math.PI*n/N,c=Math.cos(a),s=Math.sin(a);points.push(Math.sign(c)*Math.abs(c)**(2/exponent)*w/2000,h/1000,-(cy+Math.sign(s)*Math.abs(s)**(2/exponent)*d/2)/1000);}});
    for(let r=0;r<rows.length-1;r++)for(let n=0;n<N;n++){const a=r*N+n,b=r*N+(n+1)%N,c=b+N,d=a+N;indices.push(a,b,d,b,c,d)}
    // Bottom / top caps with outward winding and shared smooth side normals.
    for(const [r,reverse] of [[0,true],[rows.length-1,false]]){const offset=points.length/3;points.push(0,rows[r][0]/1000,-rows[r][1]/1000);for(let n=0;n<N;n++){const a=r*N+n,b=r*N+(n+1)%N;indices.push(offset,...(reverse?[b,a]:[a,b]));}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();return mesh(geo,m,0,0,0,name);
  };
  if(i<2){
    // Source seat height 430, tapered/raked legs 420, crowned cushion 76 mm.
    for(const x of [-.21,.21])for(const z of [-.19,.19]){
      const leg=cylinder(.026,.018,.42,wood,x,0,z,'tapered-leg');leg.rotation.x=z<0?-.035:.024;
    }
    const seat=loft([[422,0,500,480],[445,0,494,474],[465,4,476,460],[485,8,440,432],[498,12,320,336],[506,18,120,160]],6,fabric,'crowned-seat');
    // Local upholstery simplification of the source's scalloped apron.
    loft([[347,0,500,466],[422,0,500,466]],6,fabric,'upholstered-apron');
    for(let k=0;k<22;k++){const x=-.235+k*.47/21;dome(.0048,.0048,.003,brass,x,.362,.237,'seat-nail');}
    for(const x of [-.253,.253])for(let k=0;k<18;k++)dome(.003,.0048,.0048,brass,x,.362,-.20+k*.425/17,'seat-nail');
    if(i===0){
      // Approximate the source rolled loft as a sculpted panel and rolled crown.
      // Diamond seams and slightly inset buttons retain the visible tuft rhythm.
      loft([[370,210,440,50],[490,216,460,60],[610,224,470,64],[720,234,480,66],[800,246,490,72]],4,fabric,'rolled-back');
      const crown=mesh(new THREE.CylinderGeometry(.043,.043,.49,32),fabric,0,.810,-.266,'rolled-crown');crown.rotation.z=Math.PI/2;
      const thread=material('#516e63',{roughness:1});
      for(let row=0;row<4;row++)for(let col=-2;col<=2;col++){
        if((row+col)%2!==0)continue;
        const x=col*.08,y=.510+row*.08,z=-.177-row*.006;
        dome(.009,.009,.004,brass,x,y,z,'back-button');
        // Short diamond seams are a deliberate low-poly replacement for dents.
        for(const sign of [-1,1]){
          const path=new THREE.LineCurve3(new THREE.Vector3(x-.035,y-.035*sign,z-.003),new THREE.Vector3(x+.035,y+.035*sign,z-.003));
          mesh(new THREE.TubeGeometry(path,1,.00075,4,false),thread,0,0,0,'tuft-seam');
        }
      }
      for(const x of [-.222,.222])for(let k=0;k<18;k++)dome(.0048,.0048,.003,brass,x,.405+k*.022,-.174-k*.002,'back-nail');
    }
    seat.userData.sourcePart='upholstered_seat';
  }else if(i<4){
    for(const x of [-.185,.185])for(const z of [-.175,.175])cylinder(.018,.013,.420,wood,x,0,z,'tapered-leg');
    box(.44,.03,.42,fabric,0,.42,0,'seat');
    for(const x of [-.185,.185]){const rail=cylinder(.009,.009,.35,wood,x,.151,0,'side-rail');rail.rotation.x=Math.PI/2;}
    if(i===2){
      box(.40,.42,.024,fabric,0,.45,-.19,'back-panel');
      for(const x of [-.1,0,.1])for(const y of [.647,.757])dome(.008,.008,.005,brass,x,y,-.173,'back-button');
    }
  }else{
    const tall=i===5,stem=tall?1.35:.30,shadeD=tall?.36:.18,shadeH=tall?.24:.12,baseR=tall?.16:.07;
    cylinder(baseR*.86,baseR,.02,dark,0,0,0,'base');
    cylinder(tall?.009:.006,tall?.009:.006,stem,brass,0,.02,0,'stem');
    const shadeMaterial=material(color,{roughness:.72,side:THREE.DoubleSide});
    mesh(new THREE.CylinderGeometry(shadeD/4,shadeD/2,shadeH,48,1,true),shadeMaterial,0,.02+stem+shadeH/2,0,'open-shade');
    // Source shell approximated with thin open mesh + rims; no point-light pollution.
    for(const [r,y] of [[shadeD/2,.02+stem],[shadeD/4,.02+stem+shadeH]]){const rim=mesh(new THREE.TorusGeometry(r,.0015,6,48),brass,0,y,0,'shade-rim');rim.rotation.x=Math.PI/2;}
    dome(.018,.024,.018,material('#fff1c8',{emissive:'#e6b868',emissiveIntensity:.25}),0,.02+stem+.025,0,'bulb');
  }
  // Declared footprint always bounds all trims: centre locally, then set requested width/depth.
  g.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());
  const offsetY=bounds.min.y;
  for(const o of g.children){o.position.x-=centre.x;o.position.y-=offsetY;o.position.z-=centre.z;}
  g.scale.set(f.w/1000/size.x,1,f.d/1000/size.z);
  const elevation=Number.isFinite(f.elevationMm)?Math.max(0,Math.min(3000,f.elevationMm)):0;
  g.position.y=elevation/1000;g.userData.source='Sandflow-ai/sand3d';g.userData.adapted=true;return g;
}

export function sand3DSVG(type,w,d,color){
  if(!type.startsWith('sand3d-'))return null;
  const c=/^#[a-f\d]{6}$/i.test(color||'')?color:'#b9c7cc';
  const style='stroke="#584a38" stroke-width="1.2" vector-effect="non-scaling-stroke"';
  if(type.endsWith('lamp'))return `<ellipse rx="${w/2}" ry="${d/2}" fill="${c}" ${style}/><ellipse rx="${w/4}" ry="${d/4}" fill="#f5edda" ${style}/><circle r="${Math.min(w,d)*.05}" fill="#b99a61"/>`;
  let s=`<rect x="${-w/2}" y="${-d/2}" width="${w}" height="${d}" rx="${w*.1}" fill="${c}" ${style}/>`;
  if(type.endsWith('chair'))s+=`<rect x="${-w*.46}" y="${-d/2}" width="${w*.92}" height="${d*.18}" rx="${w*.04}" fill="#536b63" ${style}/>`;
  if(type.includes('tufted')){for(let i=-2;i<=2;i++)s+=`<circle cx="${w*i*.16}" cy="${d*.42}" r="${w*.012}" fill="#b99a61"/>`;}
  return s;
}

export function applySand3DFurniture(source){
  const exact=(from,to,label)=>{if(source.split(from).length!==2)throw Error('Sand3D adapter: '+label);source=source.replace(from,()=>to)};
  const safe=value=>JSON.stringify(value).replace(/</g,'\\u003c');
  const catalog=safe(SAND3D_CATALOG);
  exact('const LIB = [',`const SAND3D_CATALOG = ${catalog};\nconst LIB = [\n{cat:'Sand3D 精選｜可直接加入',items:SAND3D_CATALOG.map(a=>[a.type,a.name,a.w,a.d,a.color])},`,'library');
  exact('function furnSVG(t,w,d,c){',sand3DSVG.toString()+'\nfunction furnSVG(t,w,d,c){\n  const sandIcon=sand3DSVG(t,w,d,c);if(sandIcon)return sandIcon;','2D renderer');
  exact('function buildFurniture(f){',buildSand3DModel.toString()+`\nfunction buildFurniture(f){
  const sand=buildSand3DModel(THREE,f,mat);if(sand){sand.position.x=wx(f.cx);sand.position.z=wz(f.cy);sand.rotation.y=-f.rot*Math.PI/180;sand.userData.fid=f.id;return sand;}`,'3D renderer');
  exact('function furnPanel(f){',`function furnPanel(f){\n  const sandEntry=SAND3D_CATALOG.find(a=>a.type===f.type);`,'properties');
  exact("${tr('占地面积','Footprint')} ${fmt(f.w*f.d/1e6)} m²</div>","${tr('占地面积','Footprint')} ${fmt(f.w*f.d/1e6)} m²</div>"+`\n    \${sandEntry?'<p class="muted">Sand3D／Apache-2.0・輕量轉寫<br>'+esc(sandEntry.note)+'</p><label>底部高度 (mm)<input id="fElevation" type="number" min="0" max="3000" step="10" value="'+(f.elevationMm||0)+'"></label>':''}`,'source and elevation');
  exact("  $('#fC').onchange = e => upd(g => g.color = e.target.value);",`  $('#fC').onchange = e => upd(g => g.color = e.target.value);\n  if($('#fElevation'))num('#fElevation',(g,v)=>{if(Number.isFinite(v))g.elevationMm=Math.max(0,Math.min(3000,v));});`,'elevation editing');
  exact("  $('#lib').innerHTML = LIB.map",`  $('#lib').innerHTML = '<p class="sand3d-note">6 件 Sand3D 範例轉寫／衍生家具。點選或拖入，原布置不變。尺寸為試配，可編輯。<br><a href="https://github.com/Sandflow-ai/sand3d/tree/${SAND3D_REVISION}" target="_blank" rel="noopener noreferrer">Sandflow 原始碼</a> · <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">Apache-2.0</a></p>' + LIB.map`,'library source notice');
  exact('    furnG.children.find(o => o.userData.fid === f.id)?.position.set(wx(f.cx), 0, wz(f.cy));',
    '    const dragged=furnG.children.find(o => o.userData.fid === f.id); if(dragged){dragged.position.x=wx(f.cx);dragged.position.z=wz(f.cy);}', 'drag preserves elevation');
  const escapedLicense=SAND3D_LICENSE.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  exact('</body>', '<details id="sand3d-license" style="position:fixed;bottom:8px;right:8px;z-index:30;background:#fffdf5;border:1px solid #c5cfc8;border-radius:6px;padding:5px;font:11px system-ui;max-width:min(420px,90vw)"><summary style="cursor:pointer">Sand3D 授權</summary><p>Sandflow / Sand3D · Thibault Neveu and Andréa Loy.<br>Official examples adapted into local Three.js geometry, colors, backless seats and a taller lamp. Not original dataset meshes.<br>Source revision: '+SAND3D_REVISION+'</p><pre style="white-space:pre-wrap;max-height:45vh;overflow:auto">'+escapedLicense+'</pre></details></body>', 'offline license');
  exact('</head>','<style>.sand3d-note{font-size:11px;line-height:1.5;margin:8px 12px;padding:9px;border:1px solid #c9d7cf;border-radius:7px;background:#f0f5ef;color:#34473d}.sand3d-note a{color:#315b62}</style></head>','notice style');
  return source;
}
