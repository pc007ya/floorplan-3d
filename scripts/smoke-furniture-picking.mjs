/** Pointer-driven regression on the real, unmodified compiled WebGL page. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createPickingScene} from '../tests/helpers/picking-scene.mjs';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
const errors=[],results=[];
await mkdir('artifacts/furniture-picking',{recursive:true});
const ready=page=>page.waitForFunction(()=>window.__homeReady&&window.__homeHealth?.().ready&&!document.querySelector('#stage').classList.contains('animating'),null,{timeout:90000});
try {
  for(const [name,viewport,touch] of [['desktop',{width:1440,height:1000},false],['mobile',{width:390,height:844},true]]){
    const context=await browser.newContext({viewport,...(touch?{isMobile:true,hasTouch:true,deviceScaleFactor:1}:{})}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8000/dist/',{waitUntil:'load'});await ready(page);
    await page.locator('#vIso').click();await page.waitForTimeout(1200);
    const scene=createPickingScene();const client=touch?await context.newCDPSession(page):null;
    const records=[];
    for(const id of ['v2-armchair','v2-plant']){
      // Project the exact source meshes with the documented whole-house camera;
      // do not select or mutate furniture through page JavaScript.
      const rect=await page.locator('#view3d canvas').boundingBox();scene.cameraPose(rect.width,rect.height);
      const p=scene.point(id),x=rect.x+p.clientX,y=rect.y+p.clientY;
      const before=await page.evaluate(id=>{const f=state.furniture.find(f=>f.id===id);return {cx:f.cx,cy:f.cy}},id);
      if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
      assert.equal(await page.evaluate(()=>ui.sel?.id),id,name+' selects '+id);
      const end={x:x-30,y:y-25};
      if(touch){
        await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
        for(let i=1;i<=8;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(end.x-x)*i/8,y:y+(end.y-y)*i/8,id:1}]});
        await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      }else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});await page.mouse.up()}
      const after=await page.evaluate(id=>{const f=state.furniture.find(f=>f.id===id);return {cx:f.cx,cy:f.cy}},id);
      assert.ok(Math.hypot(after.cx-before.cx,after.cy-before.cy)>50,name+' drags '+id);
      records.push({id,before,after});
      await page.screenshot({path:`artifacts/furniture-picking/${name}-${id}.png`});
      await page.keyboard.press('Escape');
    }
    // Switching to 2D reads the shared furniture state, then reload validates autosave.
    await page.getByRole('button',{name:'2D 平面',exact:true}).click();await page.waitForTimeout(1600);
    for(const r of records){const transform=await page.locator(`#gFurn [data-fid="${r.id}"]`).getAttribute('transform');assert.ok(transform.includes(`translate(${r.after.cx} ${r.after.cy})`),name+' 2D sync '+r.id)}
    await page.reload({waitUntil:'load'});await ready(page);
    for(const r of records){const f=await page.evaluate(id=>state.furniture.find(f=>f.id===id),r.id);assert.equal(f.cx,r.after.cx);assert.equal(f.cy,r.after.cy)}
    results.push({name,records,checks:['pointer selection','mouse/touch drag','2D shared-state sync','autosave/reload']});await context.close();
  }
  assert.deepEqual(errors,[]);await writeFile('artifacts/furniture-picking/verification.json',JSON.stringify({passed:true,errors,results},null,2));
  console.log('PASS: armchair and plant select, drag, sync to 2D and survive reload on desktop/mobile');
}finally{await browser.close()}
