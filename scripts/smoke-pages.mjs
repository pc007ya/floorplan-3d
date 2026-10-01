/** Exercise the exact publish artifact under the GitHub project URL prefix. */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, sep, extname} from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('_site'), prefix = '/floorplan-3d/';
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === prefix.slice(0,-1)) { res.writeHead(302, {Location:prefix}); res.end(); return; }
    if (!pathname.startsWith(prefix)) { res.writeHead(404); res.end(); return; }
    const file = resolve(root, pathname.slice(prefix.length) || 'index.html');
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    const type = {'.html':'text/html; charset=utf-8', '.json':'application/json', '.txt':'text/plain'}[extname(file)] || 'application/octet-stream';
    res.writeHead(200, {'Content-Type':type}); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors=[], externalRequests=[], failedRequests=[];
try {
  browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {}), args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => failedRequests.push(r.url()));
  await page.route('**/*', route => {
    const url=route.request().url();
    if (/^https?:/.test(url) && !url.startsWith(origin + '/')) { externalRequests.push(url); return route.abort(); }
    return route.continue();
  });
  const response = await page.goto(origin + prefix, {waitUntil:'load',timeout:90000});
  assert.equal(response.status(),200);
  await page.waitForFunction(() => window.__homeReady && window.__homeHealth?.().ready && window.BathroomsV23?.health().faces > 0, null, {timeout:90000});
  const info = await (await page.request.get(origin + prefix + 'build-info.json')).json();
  assert.equal(await page.locator('meta[name="floorplan-source-commit"]').getAttribute('content'), info.sourceCommit);
  assert.match(await page.title(), /V2\.3/);
  assert.equal((await page.evaluate(() => window.__homeHealth())).rooms.length,11);
  await page.locator('[data-bath="wet-b"]').click();
  await page.waitForFunction(() => document.querySelector('[data-bath="wet-b"]').classList.contains('on'));
  await page.locator('#bath-variant').selectOption('warm');
  assert.equal(await page.evaluate(() => window.BathroomsV23.settings().variants['wet-b']), 'warm');
  await page.locator('#bath-variant').selectOption('gray');
  await page.locator('#bath-whole').click();
  await page.waitForTimeout(1400);
  await page.evaluate(() => setView('2d'));
  await page.waitForTimeout(1400);
  assert.equal(await page.locator('#gRooms polygon').count(),11);
  await page.evaluate(() => setView('3d'));
  await page.waitForTimeout(1400);
  await mkdir('artifacts/pages', {recursive:true});
  await page.screenshot({path:'artifacts/pages/preview.png'});
  assert.deepEqual(errors,[]); assert.deepEqual(externalRequests,[]); assert.deepEqual(failedRequests,[]);
  await writeFile('artifacts/pages/verification.json', JSON.stringify({passed:true,sourceCommit:info.sourceCommit,projectPrefix:prefix,externalRequests,failedRequests,errors,checks:['project-path HTTP startup','real WebGL render','bathroom palette controls','2D/3D switching','embedded dependencies','source commit matches metadata'],testedAt:new Date().toISOString()},null,2));
  console.log('PASS: publish artifact works at /floorplan-3d/ without external requests');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
