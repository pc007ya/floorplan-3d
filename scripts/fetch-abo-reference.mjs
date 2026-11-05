import {readFile, mkdir, writeFile, link, rm, copyFile} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
export const catalogPath = new URL('../data/references/abo-glb-furniture.json', import.meta.url);

export function cachedCatalog(catalog) {
  const copy = structuredClone(catalog);
  copy.license.textPath = 'LICENSE-CC-BY-4.0.txt';
  copy.license.attributionPath = 'ATTRIBUTION.md';
  return copy;
}

export function planDownloads(catalog, ids) {
  if (!ids.length) throw Error('Specify one or more catalog model IDs; no bulk dataset download is supported.');
  const unique = [...new Set(ids)];
  return unique.map(id => {
    const asset = catalog.assets.find(item => item.id === id);
    if (!asset) throw Error(`Unknown model ID: ${id}`);
    const expectedPath = `objects/${id}/${id}.glb`;
    const expectedUrl = `https://huggingface.co/datasets/codepawl/abo-glb/resolve/${catalog.source.revision}/${expectedPath}`;
    if (!/^[A-Z0-9]{10}$/.test(id) || !/^[a-f0-9]{40}$/.test(catalog.source.revision) ||
        asset.glb.path !== expectedPath || asset.glb.url !== expectedUrl ||
        !/^[a-f0-9]{64}$/.test(asset.glb.sha256) ||
        !Number.isSafeInteger(asset.glb.bytes) || asset.glb.bytes < 20 || asset.glb.bytes > 20_000_000) {
      throw Error(`Invalid pinned asset metadata: ${id}`);
    }
    return {id, ...asset.glb};
  });
}

export function validateGlb(bytes, asset) {
  const buffer = Buffer.from(bytes);
  if (buffer.length !== asset.bytes) throw Error(`${asset.id}: byte size mismatch`);
  if (createHash('sha256').update(buffer).digest('hex') !== asset.sha256) throw Error(`${asset.id}: SHA-256 mismatch`);
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF' ||
      buffer.readUInt32LE(4) !== 2 || buffer.readUInt32LE(8) !== buffer.length ||
      buffer.toString('ascii', 16, 20) !== 'JSON') throw Error(`${asset.id}: invalid GLB 2.0 header`);
  const jsonLength = buffer.readUInt32LE(12);
  if (jsonLength % 4 !== 0 || jsonLength > buffer.length - 20) throw Error(`${asset.id}: invalid JSON chunk length`);
  const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength));
  if (gltf.asset?.version !== '2.0' || !gltf.meshes?.length) throw Error(`${asset.id}: missing glTF 2.0 mesh`);
  return gltf;
}

export async function downloadAsset(asset, outputDir) {
  const dest = resolve(outputDir, `${asset.id}.glb`);
  let existing;
  try { existing = await readFile(dest); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existing) {
    validateGlb(existing, asset); // Fail closed: never overwrite a mismatched local file.
    console.log(`Verified existing ${asset.id}`);
    return;
  }
  const response = await fetch(asset.url, {signal: AbortSignal.timeout(90_000)});
  if (!response.ok || !response.body) throw Error(`${asset.id}: HTTP ${response.status}`);
  const chunks = []; let total = 0;
  for await (const chunk of response.body) {
    total += chunk.byteLength;
    if (total > asset.bytes) throw Error(`${asset.id}: response exceeds pinned byte size`);
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  validateGlb(bytes, asset);
  const temporary = `${dest}.${randomUUID()}.part`;
  try {
    await writeFile(temporary, bytes, {flag: 'wx'});
    await link(temporary, dest); // Atomic no-clobber publish, including concurrent invocations.
  } finally { await rm(temporary, {force: true}); }
  console.log(`Downloaded and verified ${asset.id}: ${bytes.length} bytes`);
}

export async function main(args = process.argv.slice(2)) {
  const unknownFlag = args.find(arg => arg.startsWith('-') && arg !== '--download');
  if (unknownFlag) throw Error(`Unknown option: ${unknownFlag}`);
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const plan = planDownloads(catalog, args.filter(arg => arg !== '--download'));
  console.log(JSON.stringify({mode: args.includes('--download') ? 'download' : 'dry-run',
    revision: catalog.source.revision, totalBytes: plan.reduce((sum, asset) => sum + asset.bytes, 0),
    attribution: 'docs/abo-attribution.md', assets: plan}, null, 2));
  if (!args.includes('--download')) return;
  const output = resolve(root, 'assets/reference-cache/abo');
  await mkdir(output, {recursive: true});
  const attribution = (await readFile(resolve(root, 'docs/abo-attribution.md'), 'utf8'))
    .replaceAll('(licenses/abo-CC-BY-4.0.txt)', '(LICENSE-CC-BY-4.0.txt)')
    .replaceAll('(../data/references/abo-glb-furniture.json)', '(REFERENCE-CATALOG.json)');
  await writeFile(resolve(output, 'ATTRIBUTION.md'), attribution);
  await writeFile(resolve(output, 'REFERENCE-CATALOG.json'), JSON.stringify(cachedCatalog(catalog), null, 2) + '\n');
  await copyFile(resolve(root, 'docs/licenses/abo-CC-BY-4.0.txt'), resolve(output, 'LICENSE-CC-BY-4.0.txt'));
  for (const asset of plan) await downloadAsset(asset, output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
