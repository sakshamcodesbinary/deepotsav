import { apply } from './i18n.js';
import { initControls, initConnect, bindKharchi } from './ui.js';
import * as sound from './audio.js';

initControls(document.getElementById('controls'));
initConnect();
bindKharchi();
apply();

// Opening: one big diya. The tap starts the music and lights the flame; the scene then unfolds in step with the music.
const intro = document.getElementById('intro');
let started = false;
function lightDiya() {
  if (started) return;
  started = true;
  sound.unlock();
  sound.startMusic(); // inside the tap: phones only allow sound that starts from a real gesture
  sound.sfx.chime();
  intro.classList.add('lit');
  setTimeout(() => { document.body.classList.add('go'); }, 1300);
  setTimeout(() => { intro.classList.add('done'); setTimeout(() => intro.remove(), 1000); }, 1700);
}
intro.addEventListener('click', lightDiya);
intro.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lightDiya(); } });

// Entering firecracker mode: the music fades out and pauses (the game page doesn't play it at all).
const cta = document.querySelector('.cta');
cta.addEventListener('click', () => sound.stopMusic());
window.addEventListener('pagehide', sound.stopMusic);
