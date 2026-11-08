import { apply } from './i18n.js';
import { initControls, initConnect, bindKharchi } from './ui.js';
import * as sound from './audio.js';

initControls(document.getElementById('controls'));
initConnect();
bindKharchi();
apply();
sound.startMusic();

// A soft bell when the visitor enters the game (only audible if sound is on).
// Entering firecracker mode: fade the music out and pause it (the next page doesn't play it at all).
const cta = document.querySelector('.cta');
cta.addEventListener('pointerdown', () => { sound.unlock(); sound.sfx.bell(); });
cta.addEventListener('click', () => sound.stopMusic());
window.addEventListener('pagehide', sound.stopMusic);
