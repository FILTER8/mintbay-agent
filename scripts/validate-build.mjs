#!/usr/bin/env node
// Standard-library-only, read-only Mintbay V5 integrity and baseline schema check.
// Usage: node scripts/validate-build.mjs https://api.mintbay.xyz/v1/builds/<uuid>
import { createHash } from 'node:crypto';

const url = process.argv[2];
if (!url || !/^https:\/\/[^/]+\/v1\/builds\/[0-9a-f-]{36}\/?$/i.test(url)) {
  console.error('Usage: node scripts/validate-build.mjs https://api.mintbay.xyz/v1/builds/<id>');
  process.exit(2);
}
function sha256(b) { return createHash('sha256').update(b).digest('hex'); }
async function download(u) {
  if (new URL(u).origin !== new URL(url).origin) throw Error('Cross-origin build resource refused: '+u);
  const res = await fetch(u, { redirect: 'error' });
  if (!res.ok) throw Error(`HTTP ${res.status}: ${u}`);
  return Buffer.from(await res.arrayBuffer());
}
function assert(cond, message) { if (!cond) throw Error(message); }
try {
  const manifest = JSON.parse((await download(url)).toString('utf8'));
  assert(manifest.status === 'draft', 'Expected draft build');
  const values = {};
  const hashes = {};
  for (const key of ['config','artwork','compiledArtwork']) {
    const entry = manifest.files?.[key];
    assert(entry?.url && /^[a-f0-9]{64}$/i.test(entry.sha256), `Missing ${key} hash or URL`);
    const raw = await download(entry.url);
    hashes[key] = sha256(raw);
    assert(hashes[key] === entry.sha256.toLowerCase(), `${key} SHA256 mismatch`);
    values[key] = JSON.parse(raw.toString('utf8'));
  }
  const {config, artwork, compiledArtwork: c} = values;
  assert(c.source?.rawArtworkSha256 === hashes.artwork, 'Compiled source lineage hash mismatch');
  assert(config.mintbayV5?.platformFeeBps === 500 && config.collection?.platformFeeBps === 500, 'Fee rate mismatch');
  assert(config.collection?.maxSupply === artwork.supply && config.collection?.name === artwork.name, 'Collection/art mismatch');
  assert(Array.isArray(artwork.layers) && Array.isArray(c.layers) && Array.isArray(c.traits), 'Invalid artwork/layer schema');
  let offset = 0;
  for (let i=0; i<artwork.layers.length; i++) {
    const original=artwork.layers[i], layer=c.layers[i];
    assert(layer && original.name===layer.name && layer.offset===offset && layer.count===original.traits.length, `Layer mismatch ${i}`);
    for (let j=0;j<original.traits.length;j++) {
      const t=c.traits[offset+j], src=original.traits[j];
      assert(t && t.name===src.name && t.weight===src.weight && t.id===src.id, `Trait mismatch ${offset+j}`);
    }
    offset+=original.traits.length;
  }
  assert(offset===c.traits.length, 'Trait count mismatch');
  console.log(JSON.stringify({status:'PASS_BASELINE', buildId:manifest.id, hashes, layers:artwork.layers.length, traits:offset, warning:'This is NOT a pixel/mask/deadlock or Solidity/EVM audit; complete independent verification still required.'},null,2));
} catch (e) {
  console.error('FAIL:', e.message);
  process.exitCode=1;
}
