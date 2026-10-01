/** Latest drawing geometry adapter. The original renderer remains pinned and intact. */
export function validateBalconyDoors(home) {
  const ids=new Set();
  for(const d of home.balconyDoors || []) {
    if(!d.id || ids.has(d.id))throw Error('Invalid balcony door id');ids.add(d.id);
    const r=d.rect;
    if(!Array.isArray(r)||r.length!==4||r.some(n=>!Number.isFinite(n))||r[0]>=r[2]||r[1]>=r[3])throw Error('Invalid balcony rectangle');
    if(d.sillMm!==0 || !Number.isFinite(d.headMm)||d.headMm<=0||d.headMm>home.heightMm)throw Error('Invalid floor-level balcony height');
    if(!home.rooms.some(r=>r.id===d.roomId)||!home.rooms.some(r=>r.id===d.balconyId))throw Error('Unknown balcony access room');
    for(const w of [...home.walls,...home.windows])if(Math.min(r[2],w[2])>Math.max(r[0],w[0])+.001&&Math.min(r[3],w[3])>Math.max(r[1],w[1])+.001)throw Error('Balcony opening obstructed by wall/window');
  }
}
export function applyLatestGeometry(src,h) {
  if(!h.balconyDoors?.length)return src;
  const exact=(from,to,label)=>{if(src.split(from).length!==2)throw Error('Latest geometry hook: '+label);src=src.replace(from,()=>to)};
  const data=JSON.stringify(h.balconyDoors).replace(/</g,'\\u003c');
  exact('const SLIDES = '+JSON.stringify(h.slides)+';', 'const SLIDES = '+JSON.stringify(h.slides)+';\nconst BALCONY_DOORS = '+data+';', 'balcony records');
  exact('DOORS.forEach(d => s += sill(d.rect)); SLIDES.forEach(d => s += sill(d.rect));','DOORS.forEach(d => s += sill(d.rect)); SLIDES.forEach(d => s += sill(d.rect)); BALCONY_DOORS.forEach(d => s += sill(d.rect));','2D floor bridges');
  exact('DOORS.forEach(d => {\n    const [hx,hy]', 'DOORS.forEach(d => {\n    if(d.openingOnly)return;\n    const [hx,hy]', '2D opening-only');
  exact('DOORS.forEach(d => {\n    const pivot', 'DOORS.forEach(d => {\n    if(d.openingOnly)return;\n    const pivot', '3D opening-only');
  exact("wx((x0+x1)/2), 0, wz((y0+y1)/2)); s.castShadow = false; archFloor.add(s);", "wx((x0+x1)/2), d.openingOnly ? -.012 : 0, wz((y0+y1)/2)); s.castShadow = false; s.userData.openingOnly=!!d.openingOnly; archFloor.add(s);", 'flush guest opening');
  exact("  $('#gOpen').innerHTML = s;", `  BALCONY_DOORS.forEach(d=>{const [a,b,c,e]=d.rect,horizontal=c-a>=e-b,L=horizontal?c-a:e-b,p=(L-80)/2+12,start=(horizontal?a:b)+40,mid=horizontal?(b+e)/2:(a+c)/2;const segment=(lo,off)=>horizontal?'M'+lo+' '+(mid+off)+'h'+p:'M'+(mid+off)+' '+lo+'v'+p;s+='<g data-balcony="'+d.id+'"><path d="'+segment(start,-20)+' '+segment(start+25,22)+'" stroke="#477e84" stroke-width="26" fill="none"/><title>'+esc(d.name)+' · 落地通行，門型與高度暫定</title></g>'});\n  $('#gOpen').innerHTML = s;`, '2D open panels');
  exact('function buildArch(){', balconyRuntime.toString()+'\nlet balconyAudit=[];\nfunction buildBalconyAccess(top){balconyAudit=balconyRuntime(top);}\nfunction buildArch(){','balcony renderer');
  // Run after the renderer resets the collider list, alongside the existing decor.
  exact('const top = opt.cut; buildShowhouseV2Decor(top);','const top = opt.cut; buildShowhouseV2Decor(top); buildBalconyAccess(top);','balcony architecture');
  exact("g.add(rbox(1.45, .84, .025, mat('#18181a', {roughness:.4, metalness:.3}), 0, .95, bz + .03, .004), box(1.43, .81, .002, screenMat(), 0, .962, bz + .0435));", "const projection=f.screenProjectionCorrectionM||0; const chassis=rbox(1.45,.84,.025,mat('#18181a',{roughness:.4,metalness:.3}),0,.95,bz+.03+projection,.004),screen=box(1.43,.81,.002,screenMat(),0,.962,bz+.0435+projection); chassis.name='Television chassis';screen.name='Television black screen';g.add(chassis,screen);", 'TV screen projection');
  exact("mat(stoneCols[i],{roughness:.34}),wx("+h.designV2.publicArea.tvWall.x*h.calibration.mmPerTraceUnit+"),0,", "mat(stoneCols[i],{roughness:.34}),wx("+h.designV2.publicArea.tvWall.x*h.calibration.mmPerTraceUnit+")-.020,0,", 'TV cladding alignment');
  exact('window.__homeScreenshot=()=>renderer.domElement.toDataURL(\'image/png\');',`window.__homeScreenshot=()=>renderer.domElement.toDataURL('image/png');\nwindow.__homeGeometryHealth=()=>{const sofa=furnG.children.find(g=>g.userData.fid==='v2-sofa'),tv=furnG.children.find(g=>g.userData.fid==='v2-tvstand');const direction=sofa?new THREE.Vector3(0,0,1).applyQuaternion(sofa.quaternion):null,target=sofa&&tv?tv.position.clone().sub(sofa.position).normalize():null;return {revision:${JSON.stringify(h.revision)},rooms:ROOMS,walls:WALLS,windows:WINS,doors:DOORS,balconyDoors:BALCONY_DOORS,balconies:balconyAudit.map(a=>({...a,routeClear:a.routePoints.every(([x,z])=>!blocked(x,z,.22)),fixedPanelBlocked:blocked(...a.fixedPoint,.1)})),fixtureCount:state.furniture.length,sofaFrontDotTV:direction&&target?direction.dot(target):null,doorLeafCount:doors.length,guestOpeningOnly:DOORS.find(d=>d.openingOnly)?.openingOnly===true,tvProjection:state.furniture.find(f=>f.id==='v2-tvstand')?.screenProjectionCorrectionM||0,guestFixtures:state.furniture.filter(f=>['wc-c','basin-c'].includes(f.id)).map(f=>f.id)}};`, 'geometry health');
  src=src.replaceAll('比例草模 · 尺寸／面積待校正 · 非施工圖','最新圖面比例 · 非現場實測／非施工圖')
    .replaceAll('模型面積 ≈ ', '圖面面積 ≈ ').replaceAll('m²（待校正）','m²（圖面推算，非實測）')
    .replaceAll('樣品屋公共區 V2・格局仍依原圖・家具／飾面／燈光為參考提案・尺寸未校正。','最新圖面 r02・沙發朝向電視・兩處陽台落地通行・家具／門型／高度為提案，非實測施工圖。')
    .replaceAll('房間 A／B／C 仍未指定用途。','主臥與兩間臥室依最新圖面標註；客浴設備退訂，保留無門洞口。')
    .replaceAll('尺寸、面積、家具位置與高度仍未經實測校正。','圖面比例已交叉核對；尺寸、面積、家具位置與高度不是現場實測。');
  // The entrance annotation follows the latest walk route, rather than old trace coordinates.
  src=src.replace(/<text x="[\d.]+" y="[\d.]+" text-anchor="middle" font-size="180" fill="#8c593a">入口（依圖）<\/text>/,`<text x="${h.walk.start[0]}" y="${h.walk.start[1]}" text-anchor="middle" font-size="180" fill="#8c593a">入口（依圖）</text>`);
  return src;
}
function balconyRuntime(top) {
  const audit=[];
  for(const d of BALCONY_DOORS){
    const r=d.rect,horizontal=r[2]-r[0]>=r[3]-r[1],L=M(horizontal?r[2]-r[0]:r[3]-r[1]),cx=wx((r[0]+r[2])/2),cz=wz((r[1]+r[3])/2),head=d.headMm/1000,ht=Math.min(top,head);
    const group=new THREE.Group();group.name='BALCONY ACCESS | '+d.id;group.userData.balconyId=d.id;archUp.add(group);
    const part=(label,u,v,y,w,dep,height,material)=>{const o=box(horizontal?w:dep,height,horizontal?dep:w,material,horizontal?cx+u:cx+v,y,horizontal?cz-v:cz+u);o.name=d.id+' | '+label;group.add(o);return o};
    const bridge=box(M(r[2]-r[0]),.12,M(r[3]-r[1]),floorMat('tile800'),cx,-.12,cz);bridge.name=d.id+' | flush floor bridge';archFloor.add(bridge);
    if(top>head)part('retained header',0,0,head,L,M(horizontal?r[3]-r[1]:r[2]-r[0]),top-head,mat('#e5e3dc'));
    const collision=(lo,hi,v,dep)=>colliders.push(horizontal?[cx+lo,cz-v-dep/2,cx+hi,cz-v+dep/2]:[cx+v-dep/2,cz+lo,cx+v+dep/2,cz+hi]);
    for(const u of [-L/2+.02,L/2-.02]){part('side jamb',u,0,0,.04,.065,ht,frameMat);collision(u-.02,u+.02,0,.065)}
    if(top>=head)part('top track',0,0,head-.05,L,.07,.05,frameMat);
    const track=part('recessed floor track',0,0,-.008,L,.07,.008,frameMat);
    const pw=(L-.08)/2+.012,left=-L/2+.04+pw/2,ph=Math.min(top,head-.05)-.035;
    for(const [label,u,v] of [['fixed panel',left,-.02],['open sliding panel',left+.025,.022]]){
      part(label+' glass',u,v,.035,pw-.045,.009,ph,glassMat);
      for(const edge of [-1,1])part(label+' stile',u+edge*(pw/2-.013),v,.035,.026,.03,ph,frameMat);
      part(label+' bottom rail',u,v,.035,pw,.03,.034,frameMat);
      if(top>=head)part(label+' upper rail',u,v,head-.089,pw,.03,.034,frameMat);
      if(label.startsWith('open')&&top>1.1)part('handle',u+pw/2-.085,v+.032,.92,.016,.02,.16,metal());
      collision(u-pw/2,u+pw/2,v,.03);
    }
    const gapLo=left+.025+pw/2,gapHi=L/2-.04,mid=(gapLo+gapHi)/2,thickness=M(horizontal?r[3]-r[1]:r[2]-r[0]);
    const routePoints=[-thickness/2-.3,0,thickness/2+.3].map(v=>horizontal?[cx+mid,cz+v]:[cx+v,cz+mid]);
    const fixedPoint=horizontal?[cx+left,cz+.02]:[cx-.02,cz+left];
    audit.push({id:d.id,openingWidthM:L,clearWidthM:gapHi-gapLo,clearHeightM:head-.05,floorTopM:new THREE.Box3().setFromObject(bridge).max.y,trackTopM:new THREE.Box3().setFromObject(track).max.y,routePoints,fixedPoint,provisional:true});
  }
  return audit;
}
