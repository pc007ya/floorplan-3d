/** Runtime regression checks for the latest sanitized model and floor-level access. */
import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {scaledHome} from '../js/compile-home.mjs';
const expected=scaledHome(JSON.parse(await readFile('data/home.json','utf8')));
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
const errors=[],results=[];await mkdir('artifacts/latest-geometry',{recursive:true});
async function ready(page){await page.waitForFunction(()=>window.__homeReady&&window.__homeHealth?.().ready&&window.__homeGeometryHealth,null,{timeout:90000})}
function verify(h){
 assert.equal(h.revision,expected.revision);assert.deepEqual(h.rooms,expected.rooms);assert.deepEqual(h.walls,expected.walls);assert.deepEqual(h.windows,expected.windows);assert.deepEqual(h.doors,expected.doors);assert.deepEqual(h.balconyDoors,expected.balconyDoors);
 assert.equal(h.fixtureCount,27);assert.equal(h.doorLeafCount,6);assert.equal(h.guestOpeningOnly,true);assert.deepEqual(h.guestFixtures,[]);assert.ok(h.sofaFrontDotTV>.999999);assert.equal(h.tvProjection,.045);
 assert.equal(h.balconies.length,2);for(const [i,b] of h.balconies.entries()){assert.ok(Math.abs(b.clearWidthM-[1.12315,.72310][i])<.00015);assert.ok(Math.abs(b.floorTopM)<1e-7);assert.ok(Math.abs(b.trackTopM)<1e-7);assert.equal(b.routeClear,true,b.id+' route blocked');assert.equal(b.fixedPanelBlocked,true,b.id+' pane collision missing');assert.ok(b.clearHeightM>=2.1)}
}
try{
 for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,...(name==='mobile'?{isMobile:true,hasTouch:true,deviceScaleFactor:1}: {})}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000/dist/',{waitUntil:'load'});await ready(page);
  let h=await page.evaluate(()=>window.__homeGeometryHealth());verify(h);
  assert.equal(await page.locator('[data-bath="wet-c"]').count(),0);
  await page.evaluate(()=>setView('2d'));await page.waitForTimeout(1000);assert.equal(await page.locator('#gRooms polygon').count(),11);assert.equal(await page.locator('#gOpen [data-balcony]').count(),2);await page.screenshot({path:`artifacts/latest-geometry/${name}-plan.png`});
  await page.evaluate(()=>setView('3d'));await page.waitForTimeout(1600);
  for(const cut of [2.8,1.2,2.8]){await page.locator(`[data-cut="${cut}"]`).click();verify(await page.evaluate(()=>window.__homeGeometryHealth()))}
  await page.locator('[data-mode="walk"]').click();assert.equal(await page.evaluate(()=>window.View3D.walking()),true);verify(await page.evaluate(()=>window.__homeGeometryHealth()));await page.locator('[data-mode="orbit"]').click();
  await page.locator('#bath-whole').click();await page.waitForTimeout(1200);await page.screenshot({path:`artifacts/latest-geometry/${name}-3d.png`});
  const size=await page.evaluate(()=>({w:window.__homeHealth().width,h:window.__homeHealth().height}));assert.ok(size.w>100&&size.h>100);
  await page.evaluate(()=>mutate(()=>{state.furniture.find(f=>f.id==='v2-sofa').color='#c9c4bb'}));
  await page.reload({waitUntil:'load'});await ready(page);assert.equal(await page.evaluate(()=>state.furniture.find(f=>f.id==='v2-sofa').color),'#c9c4bb');verify(await page.evaluate(()=>window.__homeGeometryHealth()));
  h=await page.evaluate(()=>window.__homeGeometryHealth());results.push({name,viewport,size,health:h});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile('artifacts/latest-geometry/verification.json',JSON.stringify({passed:true,errors,checks:['exact latest room/wall/window/door geometry','sofa actual scene quaternion faces TV','both balcony paths pass runtime collision','fixed glass panes block walking','actual floor and track mesh tops at zero','guest door has no leaf','canceled guest fixtures absent','2D and 3D on desktop/mobile','repeated cutaway/full-height','walk/orbit switching','local save/reload preserves latest geometry'],results},null,2));
 console.log('PASS: latest geometry, floor-level passage, desktop/mobile, save/reload');
}finally{await browser.close()}
