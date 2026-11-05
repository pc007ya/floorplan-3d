import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, readdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {planDownloads, validateGlb, catalogPath, cachedCatalog, downloadAsset} from '../scripts/fetch-abo-reference.mjs';
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const home = JSON.parse(await readFile(new URL('../data/home.json', import.meta.url), 'utf8'));
const guide = await readFile(new URL('../docs/abo-furniture-references.md', import.meta.url), 'utf8');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('reference catalog stays opt-in, scoped, versioned, and attached to existing fixture IDs', () => {
  assert.equal(catalog.runtimeEnabled, false);
  assert.equal(catalog.kind, 'furniture-reference-catalog');
  assert.equal(catalog.integration.automaticPlacement, false);
  assert.equal(catalog.integration.furnitureReplaced, false);
  assert.equal(catalog.integration.geometryChanged, false);
  assert.equal(catalog.integration.homeRevision, home.revision);
  assert.equal(catalog.assets.length, 12);
  assert.equal(new Set(catalog.assets.map(a => a.id)).size, 12);
  assert.equal(new Set(catalog.assets.map(a => a.category)).size, 8);
  const fixtures = new Set(home.fixtures.map(f => f.id));
  for (const asset of catalog.assets) {
    assert.ok(asset.fixtureIds.length > 0);
    assert.ok(asset.fixtureIds.every(id => fixtures.has(id)), asset.id);
    assert.ok(Object.values(asset.sizeMetres).every(n => Number.isFinite(n) && n > 0));
    assert.equal(asset.boundsMinMetres.length, 3);
    assert.ok(Number.isSafeInteger(asset.triangles) && asset.triangles > 0);
    assert.equal(asset.verification.scenePlacementTested, false);
    assert.equal(asset.verification.thumbnailReviewed, true);
    assert.ok(guide.includes(asset.id));
    assert.ok(asset.thumbnail.url.includes(`/resolve/${catalog.source.revision}/thumbs/${asset.id}.webp`));
    assert.match(asset.thumbnail.sha256, /^[a-f0-9]{64}$/);
  }
});

test('source, credit, and preserved license are available', async () => {
  assert.equal(catalog.license.spdx, 'CC-BY-4.0');
  assert.equal(catalog.license.creator, 'Amazon.com');
  assert.equal(catalog.source.modelCount, 7953);
  assert.match(catalog.source.metadataSha256, /^[a-f0-9]{64}$/);
  const license = await readFile(new URL(catalog.license.textPath, catalogPath));
  assert.equal(hash(license), catalog.license.licenseSha256);
  const credit = await readFile(new URL(catalog.license.attributionPath, catalogPath), 'utf8');
  for (const text of ['Amazon.com', 'CodePawl', 'CC BY 4.0', catalog.source.revision]) assert.ok(credit.includes(text));
});

test('download plan is selected-only, bounded and rejects unknown IDs, flags, paths and unpinned URLs', () => {
  const ids = catalog.assets.map(a => a.id);
  assert.equal(planDownloads(catalog, ids).reduce((sum, a) => sum + a.bytes, 0), 14_877_476);
  assert.equal(planDownloads(catalog, [ids[0], ids[0]]).length, 1);
  assert.throws(() => planDownloads(catalog, []), /Specify/);
  assert.throws(() => planDownloads(catalog, ['../bad']), /Unknown/);
  for (const mutate of [c => c.source.revision = 'main', c => c.assets[0].glb.url = 'https://example.com/model.glb',
    c => c.assets[0].glb.path = '../model.glb', c => c.assets[0].glb.bytes = 1e9, c => c.assets[0].glb.sha256 = 'invalid']) {
    const changed = structuredClone(catalog); mutate(changed);
    assert.throws(() => planDownloads(changed, [ids[0]]), /Invalid/);
  }
  const result = spawnSync(process.execPath, ['scripts/fetch-abo-reference.mjs', '--all'], {encoding: 'utf8'});
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option/);
});

test('dry run never fetches or writes and emits exact selected plan', async () => {
  const oldFetch = globalThis.fetch;
  const oldLog = console.log;
  const logs = [];
  globalThis.fetch = () => { throw Error('dry-run must not fetch'); };
  console.log = text => logs.push(text);
  try {
    const {main} = await import('../scripts/fetch-abo-reference.mjs');
    await main(['B072M1WJF2']);
    const output = JSON.parse(logs[0]);
    assert.equal(output.mode, 'dry-run');
    assert.equal(output.assets.length, 1);
    assert.equal(output.totalBytes, 616540);
  } finally { globalThis.fetch = oldFetch; console.log = oldLog; }
});

test('GLB verification rejects bad size, hash, header, version and JSON chunk', () => {
  let json = JSON.stringify({asset: {version: '2.0'}, meshes: [{}]});
  json += ' '.repeat((4 - Buffer.byteLength(json) % 4) % 4);
  const bytes = Buffer.alloc(20 + Buffer.byteLength(json));
  bytes.write('glTF'); bytes.writeUInt32LE(2, 4); bytes.writeUInt32LE(bytes.length, 8);
  bytes.writeUInt32LE(Buffer.byteLength(json), 12); bytes.write('JSON', 16); bytes.write(json, 20);
  const asset = {id: 'test', bytes: bytes.length, sha256: hash(bytes)};
  assert.equal(validateGlb(bytes, asset).asset.version, '2.0');
  assert.throws(() => validateGlb(bytes.subarray(1), asset), /size/);
  assert.throws(() => validateGlb(bytes, {...asset, sha256: '0'.repeat(64)}), /SHA-256/);
  for (const [offset, value] of [[0, 0], [4, 1], [8, 0], [12, bytes.length], [16, 0]]) {
    const changed = Buffer.from(bytes); changed.writeUInt32LE(value, offset);
    assert.throws(() => validateGlb(changed, {...asset, sha256: hash(changed)}));
  }
});


test('downloaded attribution paths remain usable without mutating the source catalog', () => {
  const copy = cachedCatalog(catalog);
  assert.equal(copy.license.textPath, 'LICENSE-CC-BY-4.0.txt');
  assert.equal(copy.license.attributionPath, 'ATTRIBUTION.md');
  assert.equal(catalog.license.textPath, '../../docs/licenses/abo-CC-BY-4.0.txt');
  assert.equal(catalog.license.attributionPath, '../../docs/abo-attribution.md');
});


function sampleGlb() {
  let json = JSON.stringify({asset: {version: '2.0'}, meshes: [{}]});
  json += ' '.repeat((4 - Buffer.byteLength(json) % 4) % 4);
  const bytes = Buffer.alloc(20 + Buffer.byteLength(json));
  bytes.write('glTF'); bytes.writeUInt32LE(2, 4); bytes.writeUInt32LE(bytes.length, 8);
  bytes.writeUInt32LE(Buffer.byteLength(json), 12); bytes.write('JSON', 16); bytes.write(json, 20);
  return {bytes, asset: {id: 'B000000001', bytes: bytes.length, sha256: hash(bytes), url: 'https://example.invalid/model.glb'}};
}

test('download failures leave no GLB or partial file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'abo-failure-'));
  const oldFetch = globalThis.fetch;
  const {bytes, asset} = sampleGlb();
  const wrong = Buffer.from(bytes); wrong[wrong.length - 1] ^= 1;
  try {
    for (const response of [new Response('not found', {status: 404}),
      new Response(Buffer.concat([bytes, Buffer.from('extra')])),
      new Response(bytes.subarray(0, bytes.length - 1)), new Response(wrong)]) {
      globalThis.fetch = async () => response;
      await assert.rejects(downloadAsset(asset, directory));
      assert.deepEqual(await readdir(directory), []);
    }
  } finally { globalThis.fetch = oldFetch; await rm(directory, {recursive: true, force: true}); }
});

test('download verifies existing files and never overwrites a mismatched local file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'abo-existing-'));
  const oldFetch = globalThis.fetch, oldLog = console.log;
  const {bytes, asset} = sampleGlb(); const file = join(directory, asset.id + '.glb');
  console.log = () => {};
  try {
    globalThis.fetch = async () => new Response(bytes);
    await downloadAsset(asset, directory);
    assert.deepEqual(await readFile(file), bytes);
    globalThis.fetch = () => { throw Error('Existing files must be checked without a request'); };
    await downloadAsset(asset, directory);
    const localEdit = Buffer.from('keep my local edit'); await writeFile(file, localEdit);
    await assert.rejects(downloadAsset(asset, directory), /size/);
    assert.deepEqual(await readFile(file), localEdit);
    assert.deepEqual(await readdir(directory), [asset.id + '.glb']);
  } finally { globalThis.fetch = oldFetch; console.log = oldLog; await rm(directory, {recursive: true, force: true}); }
});

test('concurrent downloads publish at most one file without leftover temporary files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'abo-concurrent-'));
  const oldFetch = globalThis.fetch, oldLog = console.log;
  const {bytes, asset} = sampleGlb(); console.log = () => {};
  try {
    globalThis.fetch = async () => new Response(bytes);
    const outcomes = await Promise.allSettled([downloadAsset(asset, directory), downloadAsset(asset, directory)]);
    assert.ok(outcomes.some(result => result.status === 'fulfilled'));
    assert.deepEqual(await readFile(join(directory, asset.id + '.glb')), bytes);
    assert.deepEqual(await readdir(directory), [asset.id + '.glb']);
  } finally { globalThis.fetch = oldFetch; console.log = oldLog; await rm(directory, {recursive: true, force: true}); }
});
