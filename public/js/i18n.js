/* Hindi / English text. The Kharchi panel is deliberately English-only and lives in ui.js. */
const dict = {
  hi: {
    title: 'एक दिवाली सब के साथ',
    brand1: 'एक दिवाली', brand2: 'सब के साथ',
    lead: 'घर लौटे श्रीराम,<br>जगमगाया अयोध्या धाम',
    shubh: 'शुभ दीपावली',
    start: 'आतिशबाज़ी शुरू करें',
    introPrompt: 'दीया जलाने के लिए छूएँ', introAria: 'दीया जलाएँ और शुरू करें',
    langBtn: 'हिं · EN', langAria: 'भाषा बदलें',
    soundAria: 'ध्वनि', soundOn: 'ध्वनि चालू', soundOff: 'ध्वनि बंद', volume: 'आवाज़',
    connect: 'जुड़ें', connectAria: 'सोशल मीडिया पर जुड़ें',
    ach: 'उपलब्धियाँ', achAria: 'उपलब्धियाँ देखें', achTitle: 'आपकी उपलब्धियाँ', unlocked: 'उपलब्धि मिली',
    diyas: 'दीये जलाए', lightAll: 'सब जलाएँ',
    hint: 'पटाखा उठाइए और ज़मीन पर छोड़िए · दीयों को छूकर जलाइए',
    hintDrop: 'दीयों को छूकर या उन पर उंगली फेरकर जलाइए',
    crowd: 'अब तक फूटे पटाखे',
    tray: 'पटाखे',
    rocket: 'रॉकेट', skyshot: 'स्काईशॉट', fuljhari: 'फुलझड़ी', charkhi: 'चरखी', anaar: 'अनार', bomb: 'बम', jethelal: 'Jethelal Special',
    home: 'मुख्य पृष्ठ',
    a_first: 'पहली चिंगारी', a_fuljhari: 'फुलझड़ी मास्टर', a_rocket: 'रॉकेट वाला', a_sky: 'आसमान के लेखक', a_bomb: 'बम धमाका',
    a_anaar: 'अनार राजा', a_charkhi: 'चरखी चैंपियन', a_jethelal: 'Jethelal Fan', a_diya: 'दीपक रक्षक', a_finale: 'महा आतिशबाज़ी',
    d_first: 'कोई भी पटाखा फोड़ें', d_fuljhari: '10 फुलझड़ियाँ जलाएँ', d_rocket: '10 रॉकेट छोड़ें', d_sky: '3 स्काईशॉट से "Happy Diwali" लिखें',
    d_bomb: '5 बम फोड़ें', d_anaar: '10 अनार जलाएँ', d_charkhi: '10 चरखियाँ घुमाएँ', d_jethelal: '3 बार Jethelal Special चलाएँ',
    d_diya: '50 दीये जलाएँ', d_finale: 'कुल 100 पटाखे फोड़ें',
    tooMany: 'ज़रा रुकिए, पहले कुछ पटाखे खत्म होने दीजिए'
  },
  en: {
    title: 'Ek Diwali Sab Ke Saath',
    brand1: 'Ek Diwali', brand2: 'Sab Ke Saath',
    lead: 'Shri Ram is home,<br>and Ayodhya glows',
    shubh: 'Shubh Deepawali',
    start: 'Start the fireworks',
    introPrompt: 'Tap to light the diya', introAria: 'Light the diya and begin',
    langBtn: 'हिं · EN', langAria: 'Change language',
    soundAria: 'Sound', soundOn: 'Sound on', soundOff: 'Sound off', volume: 'Volume',
    connect: 'Connect', connectAria: 'Connect on social media',
    ach: 'Achievements', achAria: 'View achievements', achTitle: 'Your achievements', unlocked: 'Achievement unlocked',
    diyas: 'Diyas lit', lightAll: 'Light all',
    hint: 'Pick a cracker and drop it on the ground · touch the diyas to light them',
    hintDrop: 'Touch the diyas, or swipe across them, to light them',
    crowd: 'Crackers burst so far',
    tray: 'Crackers',
    rocket: 'Rocket', skyshot: 'Skyshot', fuljhari: 'Fuljhari', charkhi: 'Charkhi', anaar: 'Anaar', bomb: 'Bomb', jethelal: 'Jethelal Special',
    home: 'Home',
    a_first: 'First Spark', a_fuljhari: 'Fuljhari Master', a_rocket: 'Rocket Wala', a_sky: 'Sky Writer', a_bomb: 'Bomb Blaster',
    a_anaar: 'Anaar King', a_charkhi: 'Charkhi Champion', a_jethelal: 'Jethelal Fan', a_diya: 'Diya Keeper', a_finale: 'Grand Finale',
    d_first: 'Burst any cracker', d_fuljhari: 'Burn 10 fuljharis', d_rocket: 'Launch 10 rockets', d_sky: 'Write "Happy Diwali" with 3 skyshots',
    d_bomb: 'Blast 5 bombs', d_anaar: 'Light 10 anaars', d_charkhi: 'Spin 10 charkhis', d_jethelal: 'Play Jethelal Special 3 times',
    d_diya: 'Light 50 diyas', d_finale: 'Burst 100 crackers in total',
    tooMany: 'Easy there, let a few crackers finish first'
  }
};

let lang = 'hi';
try { const s = localStorage.getItem('dk_lang'); if (s === 'hi' || s === 'en') lang = s; } catch (_) { /* private mode */ }
const subs = new Set();

export const getLang = () => lang;
export const t = (k) => (dict[lang] && dict[lang][k]) || dict.en[k] || k;
export const onLang = (fn) => { subs.add(fn); return () => subs.delete(fn); };

export function apply(root = document) {
  document.documentElement.lang = lang;
  document.title = t('title');
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
}
export function setLang(next) {
  lang = next === 'en' ? 'en' : 'hi';
  try { localStorage.setItem('dk_lang', lang); } catch (_) { /* ignore */ }
  apply();
  subs.forEach((fn) => fn(lang));
}
export const toggleLang = () => setLang(lang === 'hi' ? 'en' : 'hi');
