/* ============================================================
   Alphabet illustrations — links the hand-drawn art in /art/alpha/
   onto the alphabet content (D). Ported from data-art.js.
   Mutates D in place; called once from data.ts at import time.
   ============================================================ */

export default function attachAlphabetArt(T) {
  const DIR = '/art/alpha/';
  if (!T) return;

  // Most word ids are `word_<stem>` and the file is `<stem>.svg`.
  // A few need an explicit override (id stem !== filename).
  const ID_OVERRIDE = {
    word_ffon_f: 'ffon', // "Ffon" entry under F (mutation page) reuses the phone art
  };

  // Sneaky-letter examples have no id — key their art off the Welsh string.
  const EXAMPLE_ART = {
    'Ddaear': 'daear', 'dydd': 'dydd', 'mynydd': 'mynydd', 'padden': 'padden',
    'angen': 'angen', 'dangos': 'dangos', 'llong': 'llong',
    'ei phêl hi': 'pel', 'ei phensil hi': 'pensil', 'ei phlât hi': 'plat',
  };

  function fileForWord(w) {
    if (ID_OVERRIDE[w.id]) return ID_OVERRIDE[w.id];
    if (w.id && w.id.indexOf('word_') === 0) return w.id.slice(5);
    return null;
  }

  function attach(w) {
    if (!w || w.art) return;
    const stem = fileForWord(w);
    if (stem) w.art = DIR + stem + '.svg';
  }

  // 1) words on each letter
  (T.letters || []).forEach(function (l) {
    (l.words || []).forEach(attach);
    // 2) sneaky-letter examples
    (l.examples || []).forEach(function (ex) {
      if (ex.art) return;
      const stem = EXAMPLE_ART[ex.welsh];
      if (stem) ex.art = DIR + stem + '.svg';
    });
  });

  // 3) flat buildable list (separate objects, used by the word builder)
  (T.buildable || []).forEach(attach);
}
