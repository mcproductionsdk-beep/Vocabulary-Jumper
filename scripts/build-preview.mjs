import {createHash} from 'node:crypto';
import {copyFile, mkdir, readFile, rm, writeFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const out = new URL('dist-preview/', root);
const engine = await readFile(new URL('jumper-game.html', root));
const blob = createHash('sha1').update(`blob ${engine.length}\0`).update(engine).digest('hex');
if (blob !== '259f45fe599ed8326131eff503b8a6ad532ccc1c') throw new Error('Jumper preview engine mismatch');
await rm(out, {recursive:true, force:true});
await mkdir(out);
for (const file of ['index.html', 'launcher.js', 'jumper-game.html']) {
  await copyFile(new URL(file, root), new URL(file, out));
}
await writeFile(new URL('_headers', out), `/*
  Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; frame-ancestors 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'
  X-Content-Type-Options: nosniff
`);
await writeFile(new URL('version.json', out), JSON.stringify({
  environment:'staging',
  sourceCommit:process.env.CF_PAGES_COMMIT_SHA ?? 'local',
  baselineCommit:'a41c7c2c7b5e534e61ef6f7819e99484fca690a6',
  engineBlob:blob,
}, null, 2) + '\n');
