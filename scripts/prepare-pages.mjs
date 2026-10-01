/** Package only the tested self-contained model; never publish repository root. */
import {mkdir, readFile, writeFile, cp, readdir, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {bathroomConfig} from '../js/bathrooms-v23.mjs';

const home = JSON.parse(await readFile('data/home.json', 'utf8'));
let html = await readFile('dist/home-3d-offline.html', 'utf8');
const sourceCommit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
assert.match(sourceCommit, /^[a-f0-9]{40}$/i, 'A full source commit is required');
assert.ok(html.includes('window.__homeReady'), 'Model startup hook missing');
assert.ok(html.includes('window.BathroomsV23'), 'Bathroom overlay missing');
assert.ok(html.includes(home.id), 'Unexpected model');
const importMap = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
assert.ok(importMap, 'Self-contained import map missing');
const imports = JSON.parse(importMap[1]).imports;
assert.ok(Object.keys(imports).length >= 6);
assert.ok(Object.values(imports).every(url => url.startsWith('data:text/javascript;base64,')), 'All engine modules must be embedded');
assert.ok(!/<(?:img|iframe|script)[^>]*\bsrc\s*=\s*["']https?:/i.test(html), 'Unexpected remote content');

const metadata = {
  modelId: home.id,
  modelRevision: home.revision,
  bathroomVersion: bathroomConfig(home).version,
  sourceCommit,
  builtAt: new Date().toISOString(),
  publication: 'public-concept-model',
  originalPhotosIncluded: false,
  originalDrawingsIncluded: false,
  measurementsVerified: false
};
// Discourage indexing; this is not authentication and does not make the site private.
html = html.replace('</head>', `<meta name="robots" content="noindex,nofollow,noarchive">\n<meta name="floorplan-source-commit" content="${sourceCommit}">\n</head>`);
await rm('_site', {recursive:true, force:true});
await mkdir('_site');
await writeFile('_site/index.html', html);
await writeFile('_site/home-3d-offline.html', html);
await writeFile('_site/build-info.json', JSON.stringify(metadata, null, 2) + '\n');
await writeFile('_site/robots.txt', 'User-agent: *\nDisallow: /\n');
await writeFile('_site/.nojekyll', '');
await cp('dist/vendor/three/LICENSE', '_site/THREE-LICENSE.txt');
await writeFile('_site/NOTICE.txt', 'Interactive interior concept model. Measurements and proposed finishes are not verified.\nRenderer derived from wy51ai/floorplan-3d; maintained in pc007ya/floorplan-3d.\nThree.js r160 license: THREE-LICENSE.txt. No original photographs or drawing scans are published here.\n');
const allowed = ['.nojekyll','index.html','home-3d-offline.html','build-info.json','robots.txt','THREE-LICENSE.txt','NOTICE.txt'].sort();
assert.deepEqual((await readdir('_site')).sort(), allowed);
console.log(JSON.stringify({output:'_site', files:allowed, ...metadata}));
