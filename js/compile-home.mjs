/** Adapter for the preserved upstream engine (blob 4cee1eae...).
 * Geometry lives in data/home.json; mismatched upstream source fails closed.
 */
export function validateHome(home) {
  if (home?.schemaVersion !== 1 || !/^[a-z0-9-]+$/.test(home.id || '')) throw Error('Invalid home schema/id');
  const s = home.calibration?.mmPerTraceUnit;
  if (!Number.isFinite(s) || s < 2 || s > 50) throw Error('Invalid provisional scale');
  for (const k of ['heightMm','doorHeadMm','windowSillMm','windowHeadMm'])
    if (!Number.isFinite(home[k]) || home[k] <= 0) throw Error('Invalid height: ' + k);
  if (home.heightMm <= home.doorHeadMm || home.windowSillMm >= home.windowHeadMm || home.windowHeadMm > home.heightMm) throw Error('Inconsistent opening heights');
  const ids = new Set();
  for (const r of home.rooms) {
    if (ids.has(r.id) || !/^[a-z0-9-]+$/.test(r.id)) throw Error('Invalid/duplicate room id');
    ids.add(r.id);
    if (!Array.isArray(r.poly) || r.poly.length < 3 || r.poly.some(p => p.length !== 2 || p.some(n => !Number.isFinite(n)))) throw Error('Invalid polygon');
  }
  for (const r of [...home.walls, ...home.windows, ...home.doors.map(d => d.rect)])
    if (r.slice(0,4).some(n => !Number.isFinite(n)) || r[0] >= r[2] || r[1] >= r[3]) throw Error('Invalid rectangle');
  if (new Set(home.fixtures.map(f => f.id)).size !== home.fixtures.length) throw Error('Duplicate fixture id');
  for (const f of home.fixtures) if (['cx','cy','w','d','rot'].some(k => !Number.isFinite(f[k])) || f.w <= 0 || f.d <= 0) throw Error('Invalid fixture');
  for (const d of home.doors) if (!Number.isFinite(d.len) || d.len <= 0 || [d.h,d.c,d.o].some(p => !Array.isArray(p) || p.length !== 2 || p.some(n => !Number.isFinite(n)))) throw Error('Invalid door');
  return home;
}
export function scaledHome(input) {
  const h = validateHome(structuredClone(input)), s = h.calibration.mmPerTraceUnit;
  const n = v => Math.round(v * s * 10) / 10, point = p => p.map(n);
  h.rooms = h.rooms.map(r => ({...r, poly:r.poly.map(point), at:r.at && point(r.at)}));
  h.walls = h.walls.map(r => [...r.slice(0,4).map(n), r[4]]);
  h.windows = h.windows.map(point);
  h.doors = h.doors.map(d => ({...d,rect:point(d.rect),h:point(d.h),len:n(d.len)}));
  h.slides = h.slides.map(d => ({...d,rect:point(d.rect)}));
  h.fixtures = h.fixtures.map(f => ({...f,...Object.fromEntries(['cx','cy','w','d'].map(k=>[k,n(f[k])]))}));
  h.walk = {start:point(h.walk.start),target:point(h.walk.target)};
  const pts = h.rooms.flatMap(r=>r.poly).concat(h.walls.flatMap(w=>[[w[0],w[1]],[w[2],w[3]]]));
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  h.extent=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  return h;
}
const js = v => JSON.stringify(v).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function compileHome(engine, input) {
  const h=scaledHome(input), [x0,y0,x1,y1]=h.extent, cx=(x0+x1)/2, cy=(y0+y1)/2, H=h.heightMm/1000;
  let src=engine;
  const replace=(pattern, value, name) => {
    const matches=[...src.matchAll(new RegExp(pattern.source, pattern.flags.includes('g')?pattern.flags:pattern.flags+'g'))];
    if(matches.length!==1) throw Error(`Engine adapter: ${name}: expected 1 match, got ${matches.length}`);
    src=src.replace(pattern,()=>value);
  };
  const array=(name,value)=>replace(new RegExp(`const ${name} = \\[[\\s\\S]*?\\n\\];`),`const ${name} = ${js(value)};`,name);
  array('WALLS',h.walls); array('WINS',h.windows); array('DOORS',h.doors); array('SLIDES',h.slides); array('ROOMS',h.rooms);
  replace(/function defaultFurniture\(\)\{ return \[[\s\S]*?\];\}/,`function defaultFurniture(){ return ${js(h.fixtures)}; }`,'fixtures');
  const storage=`${h.id}:${h.calibration.mmPerTraceUnit}:${h.heightMm}`;
  replace(/const STORE = '[^']+';/,`const STORE = ${js(storage)};`,'storage');
  replace(/const BOUNDS = \{[^;]+\};/,`const BOUNDS = ${js({x:x0-900,y:y0-900,w:x1-x0+1800,h:y1-y0+1800})};`,'bounds');
  replace(/function renderDims\(\)\{[\s\S]*?\n\}/,`function renderDims(){ $('#gDims').innerHTML = ''; }`,'no invented dimension chains');
  replace(/\$\('#subtitle'\)\.textContent = [^\n]+;/,`$('#subtitle').textContent = '比例草模 · 尺寸／面積待校正 · 非施工圖';`,'status');
  replace(/function toggleWall\(id\)\{[\s\S]*?\n\}/,`function toggleWall(){ toast('牆體結構未確認：本版不提供拆牆判定。'); }`,'lock walls');
  replace(/function setTool\(t\)\{/,`function setTool(t){ if(t==='demolish') return toast('牆體結構未確認：本版鎖定拆牆。');`,'lock demolition tool');
  replace(/s\.demolished = s\.demolished \|\| \[\];/,`s.demolished = [];`,'lock imported demolitions');
  replace(/\/\/ 入户标识[\s\S]*?(?=  \$\('#gOpen'\))/,`// Entrance is derived from the traced door, not the upstream sample.\n  s += '<text x="${910*h.calibration.mmPerTraceUnit}" y="${1100*h.calibration.mmPerTraceUnit}" text-anchor="middle" font-size="180" fill="#8c593a">入口（依圖）</text>';\n`,'entrance marker');
  replace(/function overviewPanel\(\)\{[\s\S]*?\n\}/,`function overviewPanel(){
    const rows=ROOMS.map(r=>'<tr class="click" data-room="'+r.id+'"><td>'+esc(state.rooms[r.id].name)+'</td><td class="r">≈ '+fmt(area(r.poly))+' m²</td></tr>').join('');
    return '<section><h3>你的戶型｜比例草模</h3><p>房間 A／B／C 的用途尚待確認；衛浴依設備辨識。上側區域邊界與用途待核。</p><p><b>尺寸、面積及高度未經現場校正。</b>未提供施工估價或拆牆判定。</p></section><section><h3>模型區域（非實測面積）</h3><table>'+rows+'</table></section><section><h3>編輯與操作</h3><p>滑鼠拖曳旋轉，滾輪縮放；按 T 切換平面。可以從家具庫加入自己的布置，再匯出 JSON 保存。</p><p>廚衛及長櫃只依原圖位置示意；沒有自行加入床或沙發。</p><button class="btn" id="clearMeasure">清除測量</button><button class="btn" id="clearFurn">清空設備布置</button></section>';
  }`,'overview');
  replace(/function roomPanel\(r\)\{[\s\S]*?\n\}/,`function roomPanel(r){
    const st=state.rooms[r.id];
    const mats=Object.entries(MATS).map(([k,m])=>'<button class="mat '+(k===st.mat?'on':'')+'" data-mat="'+k+'"><i style="background:'+m.sw+'"></i><span>'+nm(m.name)+'</span></button>').join('');
    return '<section><h3>區域屬性</h3><label>名稱<input id="rName" value="'+esc(st.name)+'"></label><p>模型面積 ≈ '+fmt(area(r.poly))+' m²（待校正）</p><p>暫定層高 ${h.heightMm} mm；不是實測高度。圖示材質只供視覺比較。</p></section><section><h3>地面材質（不估價）</h3><div class="mats">'+mats+'</div><button class="btn" id="back">回總覽</button></section>';
  }`,'room panel');
  replace(/const OX = 6000, OY = 5300, H = 2\.8, FOV = 45;/,`const OX = ${cx}, OY = ${cy}, H = ${H}, FOV = 45;`,'origin / height');
  replace(/const opt = \{cut:2\.8,/,`const opt = {cut:1.2,`,'default cutaway');
  replace(/bay = r\.counted === false/,`bay = r.bay === true`,'exterior is not raised bay');
  replace(/ceil\.visible = top >= H;/,`ceil.visible = top >= H && !r.exterior;`,'exterior ceiling');
  replace(/if \(r\.at\)\{\n      const lamp/,`if (r.at && !r.exterior){\n      const lamp`,'exterior lighting');
  replace(/\[\.\.\.DOORS\.map\(d => \[d\.rect, 2\.1\]\),[^\n]+\]/,`[...DOORS.map(d => [d.rect, ${h.doorHeadMm/1000}]), ...SLIDES.map(s => [s.rect, ${h.doorHeadMm/1000}])]`,'remove sample-only lintels');
  replace(/const sill = i === 0 \? 1\.4 : i >= 6 \? \.45 : \.9, head = 2\.4;/,`const sill = ${h.windowSillMm/1000}, head = ${h.windowHeadMm/1000};`,'window heights');
  replace(/dh = Math\.min\(2\.05, top\)/,`dh = Math.min(${(h.doorHeadMm-50)/1000}, top)`,'door height');
  replace(/door = \{pivot, a0:ang\(d\.c\), a1:ang\(d\.o\), open:true\}/,`door = {pivot, len:L, a0:ang(d.c), a1:ang(d.o), open:true}`,'door collider length');
  src=src.replace('Math.cos(a)*.9','Math.cos(a)*d.len').replace('Math.sin(a)*.9','Math.sin(a)*d.len');
  replace(/camera\.position\.set\(wx\(4200\), 1\.6, wz\(8755\)\); camera\.lookAt\(wx\(7000\), 1\.5, wz\(8755\)\);/,`camera.position.set(wx(${h.walk.start[0]}), 1.6, wz(${h.walk.start[1]})); camera.lookAt(wx(${h.walk.target[0]}), 1.5, wz(${h.walk.target[1]}));`,'walk spawn');
  const span=Math.max(x1-x0,y1-y0)/1000;
  replace(/const isoWhole = [^\n]+;/,`const isoWhole = () => pose(new THREE.Vector3(0,0,0),new THREE.Vector3(${span*.45},${span*1.4},${span*.85}));`,'overview camera');
  replace(/const topWhole = [^\n]+;/,`const topWhole = () => pose(new THREE.Vector3(0,0,0),new THREE.Vector3(0,${span*1.75},1e-4));`,'top camera');
  src=src.replace('data-cut="2.8"',`data-cut="${H}"`);
  src=src.replace('三室两厅两卫 · 装修设计','室內 3D｜依原圖草模').replace('3BR 2LR 2BA · Interior Design','Traced home · provisional scale');
  src=src.replace('原始户型 1:60 · 尺寸单位 mm','比例草模 · 尺寸待校正');
  src=src.replace('原图比例 1:60','比例待校正').replace('原始户型图尺寸标注推算','上游示範尺寸（本戶型已由資料檔取代）');
  src=src.replaceAll('<small>${area(r.poly).toFixed(', '<small>≈ ${area(r.poly).toFixed(');
  const safetyStyle=`<style>[data-tool="demolish"],[data-layer="bearing"],[data-layer="dims"],#s60,#s100{display:none!important} .home-warning{padding:7px 12px;background:#fff2d5;border-bottom:1px solid #d9bd7d;font-size:12px} .brand b{font-size:14px}</style>`;
  src=src.replace('</head>',safetyStyle+'</head>');
  src=src.replace('<header>','<header><div class="home-warning" style="flex-basis:100%">依原圖比例描繪・尺寸／高度／用途待確認・不作施工依據。日照與材質為示意。</div>');
  const marker='window.View3D = {enter, exit, relang, sync:() => sync(), shot, groundAt, flyToRoom:id => active && !anim && flyToRoom(id), walking:() => active && opt.mode === \'walk\'};';
  if(!src.includes(marker)) throw Error('Engine adapter: missing 3D export');
  src=src.replace(marker,marker+`\nwindow.__homeModel = ${js({id:h.id,revision:h.revision,roomCount:h.rooms.length,wallCount:h.walls.length,doorCount:h.doors.length,scale:h.calibration.mmPerTraceUnit})};
window.__homeHealth=()=>({ready:inited && active, meshes:scene?scene.children.length:0, width:renderer?.domElement.width, height:renderer?.domElement.height, rooms:ROOMS.map(r=>r.id), demolished:state.demolished.slice(), source:window.__homeModel});
window.__homeScreenshot=()=>renderer.domElement.toDataURL('image/png');
setTimeout(async()=>{try{ await setView('3d'); window.__homeReady=true; parent.postMessage({type:'home-ready',modelId:${js(h.id)}},'*'); }catch(e){console.error(e);parent.postMessage({type:'home-error',message:String(e)},'*');}},150);
`);
  return src;
}
