const frame = document.getElementById('engine');
const status = document.getElementById('status');
const pairs = [['cat','gato'], ['dog','perro'], ['bird','pájaro'], ['horse','caballo'], ['cow','vaca']];
let sent = false;
window.addEventListener('message', ({origin, source, data}) => {
  if (origin !== location.origin || source !== frame.contentWindow) return;
  if (data?.type === 'BT_JUMPER_READY' && !sent) {
    sent = true;
    source.postMessage({type:'BT_JUMPER_START', pairs, language:'es-ES'}, origin);
    status.textContent = 'Fixture sent';
    frame.focus();
  }
  if (data?.type === 'BT_JUMPER_START_FAILED') status.textContent = 'Fixture rejected';
  if (data?.type === 'BT_JUMPER_SPEAK') status.textContent = 'Pronunciation requested: ' + data.text;
  if (data?.type === 'BT_JUMPER_MENU') location.reload();
});
frame.src = './jumper-game.html';
