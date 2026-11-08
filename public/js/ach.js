/* Achievements and lifetime counters, kept in localStorage. */
const LIST = [
  { id: 'first', key: 'a_first', desc: 'd_first', stat: 'total', goal: 1 },
  { id: 'fuljhari', key: 'a_fuljhari', desc: 'd_fuljhari', stat: 'fuljhari', goal: 10 },
  { id: 'rocket', key: 'a_rocket', desc: 'd_rocket', stat: 'rocket', goal: 10 },
  { id: 'sky', key: 'a_sky', desc: 'd_sky', stat: 'skyshot', goal: 3 },
  { id: 'bomb', key: 'a_bomb', desc: 'd_bomb', stat: 'bomb', goal: 5 },
  { id: 'anaar', key: 'a_anaar', desc: 'd_anaar', stat: 'anaar', goal: 10 },
  { id: 'charkhi', key: 'a_charkhi', desc: 'd_charkhi', stat: 'charkhi', goal: 10 },
  { id: 'jethelal', key: 'a_jethelal', desc: 'd_jethelal', stat: 'jethelal', goal: 3 },
  { id: 'diya', key: 'a_diya', desc: 'd_diya', stat: 'diya', goal: 50 },
  { id: 'finale', key: 'a_finale', desc: 'd_finale', stat: 'total', goal: 100 }
];

let prog = { stats: {}, done: [] };
try { const raw = JSON.parse(localStorage.getItem('dk_prog') || 'null'); if (raw && raw.stats) prog = { stats: raw.stats, done: raw.done || [] }; } catch (_) { /* ignore */ }
const save = () => { try { localStorage.setItem('dk_prog', JSON.stringify(prog)); } catch (_) { /* ignore */ } };

/** Add to a counter; returns achievements that were unlocked by this change. */
export function bump(stat, n = 1) {
  prog.stats[stat] = (prog.stats[stat] || 0) + n;
  const fresh = [];
  for (const a of LIST) {
    if (!prog.done.includes(a.id) && (prog.stats[a.stat] || 0) >= a.goal) { prog.done.push(a.id); fresh.push(a); }
  }
  save();
  return fresh;
}
export function all() {
  return LIST.map((a) => ({ ...a, value: Math.min(a.goal, prog.stats[a.stat] || 0), unlocked: prog.done.includes(a.id) }));
}
