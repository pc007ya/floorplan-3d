import {readFile,writeFile,mkdir,cp,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {compileHome} from '../js/compile-home.mjs';
const engine=await readFile('engine.html','utf8');
const blob=createHash('sha1').update(`blob ${Buffer.byteLength(engine)}\0`).update(engine).digest('hex');
if(blob!=='4cee1eae0684acfc660a27b18c218f1f7703193b')throw Error('Upstream engine changed: review adapter before building.');
const home=JSON.parse(await readFile('data/home.json','utf8'));
let html=compileHome(engine,home);
await mkdir('dist',{recursive:true});
if(process.argv.includes('--vendor')){
 await stat('node_modules/three/build/three.module.js');
 await mkdir('dist/vendor/three',{recursive:true});
 await cp('node_modules/three/build','dist/vendor/three/build',{recursive:true});
 await cp('node_modules/three/examples/jsm','dist/vendor/three/examples/jsm',{recursive:true});
 await cp('node_modules/three/LICENSE','dist/vendor/three/LICENSE');
 html=html.replaceAll('https://cdn.jsdelivr.net/npm/three@0.160.0/','./vendor/three/');
}
await writeFile('dist/index.html',html);
await writeFile('dist/home.json',JSON.stringify(home,null,2));
await writeFile('dist/README.txt','比例草模，非實測／非施工圖。執行 python3 -m http.server 8000 後開 http://localhost:8000 。\n版本內含 Three.js 時不需外部網路。\n');
console.log(JSON.stringify({engineBlob:blob,rooms:home.rooms.length,doors:home.doors.length,scale:'UNVERIFIED',output:'dist/index.html'}));
