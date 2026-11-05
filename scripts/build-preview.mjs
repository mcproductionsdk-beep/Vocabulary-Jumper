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

const [adapter, bootstrap, session, layout] = await Promise.all(
  ['adapter.js','bootstrap.mjs','session.mjs','layout.css'].map(file =>
    readFile(new URL('engine/'+file, root), 'utf8')));
const integrated = engine.toString('utf8')
  .replace('<div class="logo">WORD JUMPER</div>', '')
  .replace('</head>', '<style>'+layout+'</style></head>')
  .replace('W=Math.max(300,r.width);H=Math.max(320,r.height)', 'W=Math.max(1,wrap.clientWidth);H=Math.max(1,wrap.clientHeight)')
  .replace('setTimeout(function(){if(running&&current)speak(spoken);},150)', 'clearTimeout(speechTimer);speechTimer=setTimeout(function(){speak(spoken);},150)')
  .replace('if(!e.repeat)togglePause()', 'if(!e.repeat)setPaused(!paused)')
  .replace('if(running)raf=requestAnimationFrame(loop);','if(running)raf=requestAnimationFrame(loop);else emitState();')
  .replace('"/"+vocab.length+" WORDS";','"/"+vocab.length+" WORDS";emitState();')
  .replace(/window.addEventListener\("message"[\s\S]*?\}\)\(\);/, `${adapter}\n})();`)
  .replace('</body>', '<script type="module" src="./bootstrap.mjs"></script></body>');
const buildId = createHash('sha1').update(JSON.stringify([integrated, bootstrap, session])).digest('hex');
for (const [file, content] of Object.entries({
  'engine.html':integrated, 'bootstrap.mjs':bootstrap, 'session.mjs':session,
  'build-id.mjs':`export const buildId = '${buildId}';\n`,
})) await writeFile(new URL(file, out), content);
await writeFile(new URL('_headers', out), (await readFile(new URL('_headers', out), 'utf8'))
  .replace("frame-ancestors 'self'", "frame-ancestors 'self' https://bt-vocabulary-platform-staging.pages.dev https://*.bt-vocabulary-platform-staging.pages.dev"));
console.log(buildId);
