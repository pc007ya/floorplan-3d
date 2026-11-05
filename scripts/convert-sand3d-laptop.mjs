/** Build-time conversion of one hash-pinned, texture-free official Sand3D GLB.
 * Never evaluates the dataset's Python program. Three's standard GLTFLoader
 * preserves the original 106 meshes/materials/transforms in ObjectLoader data.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const bytes=await readFile('assets/sand3d/laptop.glb');
const sha=createHash('sha256').update(bytes).digest('hex');
if(sha!=='c1ca61806c3548a215d9ec9a833e7c1263e600df1f81d1932952547b09c3020f')throw Error('Unexpected laptop GLB');
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
if(gltf.images?.length||gltf.textures?.length||gltf.extensionsRequired?.length||gltf.buffers.some(b=>b.uri))throw Error('Only the pinned self-contained, texture-free GLB is supported');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
let count=0;const geometries=new Set(),materials=new Set();
scene.traverse(o=>{o.uuid='sand3d-laptop-node-'+count++;if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)});
if(geometries.size!==106||materials.size!==5)throw Error('Unexpected laptop structure');
[...geometries].forEach((v,i)=>v.uuid='sand3d-laptop-geometry-'+i);
[...materials].forEach((v,i)=>v.uuid='sand3d-laptop-material-'+i);
// GLTFLoader sets TRS; ObjectLoader JSON serializes matrices, so commit them first.
scene.updateMatrixWorld(true);
const json=JSON.stringify(scene.toJSON());
await writeFile('js/sand3d-laptop-data.mjs','/** Generated from hash-pinned official Sand3D laptop.glb. CC-BY-4.0; see docs/sand3d-laptop.md. */\nexport const SAND3D_LAPTOP_OBJECT = '+json+';\n');
console.log(JSON.stringify({sourceSha256:sha,meshes:geometries.size,materials:materials.size,jsonBytes:json.length}));
