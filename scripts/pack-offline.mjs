/** Embed the exact Three.js r160 dependencies in one offline HTML. No fonts,
 * external API, original drawing images, CDN, or local server is required.
 * Run after build.mjs --vendor.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {join,posix} from 'node:path';
const root=process.argv[2] || 'dist';
let html=await readFile(join(root,'index.html'),'utf8');
const imports={},queue=['three','three/addons/objects/Reflector.js','three/addons/controls/OrbitControls.js','three/addons/controls/PointerLockControls.js','three/addons/geometries/RoundedBoxGeometry.js','three/addons/environments/RoomEnvironment.js','three/addons/renderers/CSS2DRenderer.js'];
while(queue.length){
 const key=queue.shift();if(imports[key])continue;
 const rel=key==='three'?'build/three.module.js':'examples/jsm/'+key.slice('three/addons/'.length);
 let text=await readFile(join(root,'vendor/three',rel),'utf8');
 text=text.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_,a,dep,b)=>{
   const target=posix.normalize(posix.join(posix.dirname(key),dep));
   if(!target.startsWith('three/addons/'))throw Error('Unexpected relative module: '+target);
   queue.push(target);return a+target+b;
 });
 imports[key]='data:text/javascript;base64,'+Buffer.from(text).toString('base64');
}
const map=/<script type="importmap">[\s\S]*?<\/script>/;
if(!map.test(html))throw Error('Import map missing');
html=html.replace(map,()=>'<script type="importmap">'+JSON.stringify({imports})+'</script>');
// Frame the complete house on initial load, and match the cutaway button state.
html=html.replace("await setView('3d'); window.__homeReady=true;","await setView('3d'); syncCutBtns(); flyTo(isoWhole()); await wait(1100); window.__homeReady=true;");
const output=join(root,'home-3d-offline.html');await writeFile(output,html);
console.log(JSON.stringify({output,embeddedModules:Object.keys(imports),bytes:Buffer.byteLength(html),networkRequired:false}));
