import {chromium} from 'playwright';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],requests=[],consoleErrors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
page.on('console',m=>{if(m.type()==='error'){consoleErrors.push(m.text().slice(0,600));console.error(m.text().slice(0,600))}});
page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
const out='artifacts/bathrooms-v23';await mkdir(out,{recursive:true});
const snapshot=async name=>{await page.waitForTimeout(600);await page.screenshot({path:out+'/'+name+'-ui.png'});const png=await page.evaluate(()=>window.__homeScreenshot());assert.ok(png.length>40000);await writeFile(out+'/'+name+'.png',Buffer.from(png.split(',')[1],'base64'))};
try{
 await page.context().setOffline(true);
 await page.goto(pathToFileURL(resolve('dist/home-3d-offline.html')).href,{waitUntil:'load',timeout:90000});
 await page.waitForFunction(()=>window.__homeReady&&window.BathroomsV23?.health().faces>0,null,{timeout:90000});
 const before=await page.evaluate(()=>({rooms:ROOMS,walls:WALLS,doors:DOORS,furniture:state.furniture,store:STORE}));
 assert.match(before.store,/:bathrooms-v23$/);
 await snapshot('whole');
 for(const id of ['wet-a','wet-b']){
  await page.evaluate(id=>window.BathroomsV23.focus(id),id);await snapshot(id);
  const h=await page.evaluate(()=>window.BathroomsV23.health());
  assert.equal(h.mirrorCount,2);assert.equal(h.glassSegments,4);assert.deepEqual(h.fixtureIds.sort(),['basin-a','basin-b','tub']);
  assert.ok(h.faceRecords.every(f=>f.height<=2.8&&f.head>f.bottom));
 }
 await page.evaluate(()=>window.BathroomsV23.focus('wet-a',true));await snapshot('vanity-warm');
 assert.equal((await page.evaluate(()=>window.BathroomsV23.health())).activeMirrors,1);
 await page.selectOption('#bath-variant','gray');await snapshot('vanity-gray');
 assert.equal(await page.evaluate(()=>state.bathroomV23.variants['wet-a']),'gray');
 await page.selectOption('#bath-variant','warm');
 await page.locator('#bath-door').click();assert.equal(await page.evaluate(()=>window.BathroomsV23.settings().opened['wet-a']),true);
 await page.locator('#bath-glass').click();assert.equal((await page.evaluate(()=>window.BathroomsV23.health())).glassSegments,0);
 await page.locator('#bath-glass').click();
 await page.locator('#bath-enabled').click();let off=await page.evaluate(()=>window.BathroomsV23.health());assert.equal(off.faces,0);assert.equal(off.mirrorCount,0);assert.deepEqual(off.fixtureIds,[]);
 await page.locator('#bath-enabled').click();
 const save=await page.evaluate(()=>JSON.parse(localStorage.getItem(STORE)));assert.equal(save.bathroomV23.enabled,true);
 const after=await page.evaluate(()=>({rooms:ROOMS,walls:WALLS,doors:DOORS,furniture:state.furniture,store:STORE}));assert.deepEqual(after,before);
 await page.locator('#bath-whole').click();await page.waitForTimeout(1300);
 let cut=await page.evaluate(()=>window.BathroomsV23.health());assert.ok(cut.faceRecords.every(f=>f.height<=1.2));assert.equal(cut.activeMirrors,0);
 await page.evaluate(()=>setView('2d'));await page.waitForTimeout(1200);assert.equal(await page.locator('#gRooms polygon').count(),11);assert.equal(await page.locator('#gBathroomV23 path').count(),2);await page.screenshot({path:out+'/plan.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(requests,[]);
 await writeFile(out+'/verification.json',JSON.stringify({passed:true,version:'2.3',errors,consoleErrors,httpRequests:requests,checks:['file-URL offline startup','2 bathroom closeups','2 replacement vanities and 1 tub without duplicate ids','real mirror in vanity view','per-room palette switch','sliding glass open/close','enclosure off/on','overlay off restores original fixtures','JSON state saved','base geometry and furniture anchors unchanged','cutaway clips room-facing finishes','2D proposal guides'],health:cut,timestamp:new Date().toISOString()},null,2));
 console.log('PASS: V2.3 offline bathroom integration and visual capture');
}catch(e){console.error(e);await writeFile(out+'/failure.json',JSON.stringify({error:String(e),errors,consoleErrors,requests},null,2));try{await page.screenshot({path:out+'/failure.png',timeout:10000})}catch{}throw e}
finally{await browser.close()}
