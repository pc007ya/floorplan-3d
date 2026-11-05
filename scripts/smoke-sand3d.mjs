/** Real UI workflows. Run after build --vendor + pack-offline with HTTP :8000.
 * No test-side state mutation, selection injection or mock renderer. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {SAND3D_CATALOG} from '../js/sand3d-furniture.mjs';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
const results=[];await mkdir('artifacts/sand3d',{recursive:true});
const ready=page=>page.waitForFunction(()=>window.__homeReady&&window.__homeHealth?.().ready&&!document.querySelector('#stage').classList.contains('animating'),null,{timeout:90000});
const selected=page=>page.evaluate(()=>state.furniture.find(f=>f.id===ui.sel?.id));
const items=page=>page.evaluate(()=>state.furniture.filter(f=>f.type.startsWith('sand3d-')));
async function pane(page,id,open=true){if(await page.locator(id).evaluate(el=>el.classList.contains('on'))!==open)await page.locator(id).click();}
async function edit(page,id,value){await page.locator(id).fill(String(value));await page.locator(id).press('Tab');}
try{
 for(const [name,viewport,mobile,offline] of [['desktop',{width:1440,height:1000},false,false],['mobile-offline',{width:390,height:844},true,true]]){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,acceptDownloads:true}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  if(offline)await context.setOffline(true);
  await page.goto(offline?pathToFileURL(resolve('dist/home-3d-offline.html')).href:'http://127.0.0.1:8000/dist/',{waitUntil:'load'});await ready(page);
  assert.equal((await page.evaluate(()=>state.furniture)).length,27);assert.deepEqual(await items(page),[]);
  await page.locator('[data-view="2d"]').click();await page.waitForTimeout(1600);
  const added=[];
  for(const a of SAND3D_CATALOG){
   await pane(page,'#tgLib');const tile=page.locator('#lib .item').filter({has:page.locator('b',{hasText:a.name})});assert.equal(await tile.count(),1);
   if(mobile)await tile.tap();else await tile.click();
   const f=await selected(page);assert.equal(f.type,a.type);assert.equal(f.w,a.w);assert.equal(f.d,a.d);added.push(f.id);
   assert.ok((await page.locator(`#gFurn [data-fid="${f.id}"]`).innerHTML()).match(/rect|ellipse/));
  }
  assert.equal((await items(page)).length,6);
  await pane(page,'#tgPanel');await edit(page,'#fW',480);await edit(page,'#fElevation',740);
  await page.locator('#fC').fill('#a45f82');await page.locator('#fC').dispatchEvent('change');
  await page.locator('#aRot').click();let original=await selected(page);assert.equal(original.w,480);assert.equal(original.elevationMm,740);assert.equal(original.color,'#a45f82');assert.equal(original.rot,90);
  await page.locator('#aDup').click();const duplicate=await selected(page);assert.notEqual(duplicate.id,original.id);assert.equal(duplicate.elevationMm,740);assert.equal((await items(page)).length,7);
  await page.locator('#aDel').click();assert.equal((await items(page)).length,6);
  await page.locator('#undo').click();assert.equal((await items(page)).length,7);assert.ok((await items(page)).some(f=>f.id===duplicate.id));
  if(mobile)await pane(page,'#tgPanel',false);
  await page.locator('[data-view="3d"]').click();await ready(page);await page.waitForTimeout(1600);
  const health=await page.evaluate(()=>window.__homeHealth());assert.equal(health.furniture,34);assert.ok(health.width>100&&health.height>100);
  const png=await page.evaluate(()=>window.__homeScreenshot());assert.ok(png.length>50000,'Real WebGL screenshot must not be empty');
  await page.screenshot({path:`artifacts/sand3d/${name}-3d.png`});
  const expected=await items(page);await page.reload({waitUntil:'load'});await ready(page);assert.deepEqual(await items(page),expected,'Autosave survives reload');
  // Export/import through the actual file UI; reads inspect only.
  await page.locator('details.menu summary').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportJson').click();const download=await downloadPromise;const file=await download.path();const exported=JSON.parse(await readFile(file,'utf8'));
  assert.deepEqual(exported.furniture.filter(f=>f.type.startsWith('sand3d-')),expected);
  await page.locator('details.menu summary').click();const choose=page.waitForEvent('filechooser');await page.locator('#importJson').click();await (await choose).setFiles({name:'sand3d-roundtrip.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('方案已导入'));
  assert.deepEqual(await items(page),expected,'JSON import preserves new types, color, rotation and elevation');
  assert.ok(await page.locator('#sand3d-license').count());assert.deepEqual(errors,[]);if(offline)assert.deepEqual(requests,[]);
  results.push({name,added,checks:['six real library clicks/taps','2D icons','width/color/elevation edits','rotate','duplicate','delete/undo','WebGL screenshot','autosave/reload','JSON export/import',...(offline?['network disabled','zero HTTP requests']:[])],errors});await context.close();
 }
 await writeFile('artifacts/sand3d/verification.json',JSON.stringify({passed:true,results},null,2));console.log('PASS: Sand3D real library/editor workflows on desktop and offline mobile');
}finally{await browser.close()}
