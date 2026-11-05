import {attachJumperSession} from './session.mjs';
import {buildId} from './build-id.mjs';

let shellOrigin;
try { shellOrigin = new URL(document.referrer).origin; } catch {}
if (parent !== window && /^https:\/\/(?:[a-z0-9-]+\.)?bt-vocabulary-platform-staging\.pages\.dev$/.test(shellOrigin)) {
  attachJumperSession({engine: window.BTJumper, policy: {shellOrigin, engineOrigin:location.origin, buildId}});
} else {
  document.body.textContent = 'Open Jumper through the shared staging vocabulary picker.';
}
