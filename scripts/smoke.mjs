import {chromium} from 'playwright';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000/dist/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__homeReady && window.__homeHealth?.().ready,null,{timeout:45000});
 await page.waitForTimeout(1200);
 const health=await page.evaluate(()=>window.__homeHealth());assert.equal(health.source.id,'home-trace-v1');assert.equal(health.rooms.length,11);assert.ok(health.width>100&&health.height>100);assert.deepEqual(health.demolished,[]);
 await page.evaluate(()=>setView('2d'));await page.waitForTimeout(1500);
 assert.equal(await page.locator('#gRooms polygon').count(),11);
 await page.evaluate(()=>setTool('demolish'));assert.equal(await page.evaluate(()=>ui.tool),'select');
 await page.evaluate(()=>select({kind:'room',id:'a'}));assert.ok((await page.locator('#panel').innerText()).includes('待校正'));
 await page.evaluate(()=>select(null));
 await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/home-2d.png'});
 await page.evaluate(()=>setView('3d'));await page.waitForTimeout(2500);await page.screenshot({path:'artifacts/home-3d.png'});
 const png=await page.evaluate(()=>window.__homeScreenshot());assert.ok(png.length>50000,'3D screenshot unexpectedly empty');
 await page.locator('[data-mode="walk"]').click();await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>window.View3D.walking()));await page.locator('[data-mode="orbit"]').click();
 const offline=await browser.newPage({viewport:{width:1600,height:1000}}),requests=[],offlineErrors=[];
 offline.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});offline.on('pageerror',e=>offlineErrors.push(e.message));
 await offline.context().setOffline(true);
 await offline.goto(pathToFileURL(resolve('dist/home-3d-offline.html')).href,{waitUntil:'load'});
 await offline.waitForFunction(()=>window.__homeReady && window.__homeHealth?.().ready,null,{timeout:45000});
 await offline.waitForTimeout(1200);await offline.screenshot({path:'artifacts/home-3d-offline.png'});
 assert.deepEqual(requests,[]);assert.deepEqual(offlineErrors,[]);
 assert.equal(await offline.locator('[data-cut="1.2"].on').count(),1);
 assert.deepEqual(errors,[]);await writeFile('artifacts/verification.json',JSON.stringify({health,errors,checks:['compiled original engine','actual WebGL render','2D polygons','demolition locked','room editing','walk mode','offline single-file WebGL render with networking disabled'],offlineRequests:requests,timestamp:new Date().toISOString()},null,2));console.log('PASS: actual Three.js renderer and model controls');
}finally{await browser.close()}
