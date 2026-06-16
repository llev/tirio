/* Dinner Time topic (ported from data-dinner.js). */
const DD = {
  topic: {
    id: "dinner",
    welsh: "Amser Bwyd",
    english: "Dinner Time",
    dialect: "South Wales",
    blurb: "An everyday family meal at home — the food on the table, and the words to ask for it, like it, or leave it."
  },

  /* ---- parent reference: words, grouped by category ---- */
  wordGroups: [
    {
      key: "table", label: "Ar y bwrdd", en: "On the table",
      words: [
        { id: "word_plat_dinner",   welsh: "Plât",    english: "Plate",  cat: "table", color: "indigo", pron: "plaht",     alt: "A dinner plate",               notes: "Circumflex = long vowel" },
        { id: "word_cwpan_dinner",  welsh: "Cwpan",   english: "Cup",    cat: "table", color: "teal",   pron: "KOO-pan",   alt: "A cup",                        notes: "" },
        { id: "word_fforc_dinner",  welsh: "Fforc",   english: "Fork",   cat: "table", color: "gold",   pron: "fork",      alt: "A fork",                       notes: "Ff sounds like English F" },
        { id: "word_llwy_dinner",   welsh: "Llwy",    english: "Spoon",  cat: "table", color: "coral",  pron: "thlooee",   alt: "A spoon",                      notes: "Ll — tongue to roof of mouth, breathe out the sides" },
        { id: "word_cyllell_dinner",welsh: "Cyllell", english: "Knife",  cat: "table", color: "orange", pron: "KUTH-eth",  alt: "A table knife",                notes: "Two Ll sounds — both breathy" },
        { id: "word_bwrdd_dinner",  welsh: "Bwrdd",   english: "Table",  cat: "table", color: "indigo", pron: "boorth",    alt: "A dinner table laid for a meal",notes: "Rhymes with worth" }
      ]
    },
    {
      key: "food", label: "Y bwyd", en: "The food",
      words: [
        { id: "word_tatws_dinner",  welsh: "Tatws",   english: "Potatoes",   cat: "food", color: "gold",   pron: "TAT-oos",   alt: "A pile of potatoes",        notes: "Base form. Mutates to datws after mwy o." },
        { id: "word_pys_dinner",    welsh: "Pys",     english: "Peas",       cat: "food", color: "teal",   pron: "pees",      alt: "A spoonful of green peas",  notes: "" },
        { id: "word_cig_dinner",    welsh: "Cig",     english: "Meat",       cat: "food", color: "coral",  pron: "keeg",      alt: "A portion of cooked meat",  notes: "" },
        { id: "word_pasta_dinner",  welsh: "Pasta",   english: "Pasta",      cat: "food", color: "orange", pron: "PAST-a",    alt: "A bowl of pasta",           notes: "Borrowed word — easy win for parents" },
        { id: "word_llysiau_dinner",welsh: "Llysiau", english: "Vegetables", cat: "food", color: "teal",   pron: "THLUS-yeye",alt: "An assortment of vegetables",notes: "" },
        { id: "word_caws_dinner",   welsh: "Caws",    english: "Cheese",     cat: "food", color: "gold",   pron: "kowss",     alt: "A wedge of cheese",         notes: "" },
        { id: "word_bara_dinner",   welsh: "Bara",    english: "Bread",      cat: "food", color: "orange", pron: "BAR-a",     alt: "Slices of bread",           notes: "Shared with alphabet topic" },
        { id: "word_llaeth_dinner", welsh: "Llaeth",  english: "Milk",       cat: "food", color: "indigo", pron: "thleye-th", alt: "A glass of milk",           notes: "South Wales word. North Wales: llefrith." },
        { id: "word_dwr_dinner",    welsh: "Dŵr",     english: "Water",      cat: "food", color: "indigo", pron: "door",      alt: "A glass of water",          notes: "Circumflex = long vowel" },
        { id: "word_halen_dinner",  welsh: "Halen",   english: "Salt",       cat: "food", color: "coral",  pron: "HAL-en",    alt: "A salt shaker",             notes: "" },
        { id: "word_sos_dinner",    welsh: "Sos",     english: "Sauce",      cat: "food", color: "coral",  pron: "sohss",     alt: "A bottle of sauce",         notes: "Sos coch = ketchup (literally 'red sauce')" }
      ]
    }
  ],

  /* ---- phrases. blocks carry the learnable chunks for the phrase builder ---- */
  phrases: [
    { id: "phrase_dwin_llwgu", welsh: "Dw i'n llwgu", english: "I'm starving!", natural: "I'm starving!", pron: "doo een THLOO-gee", color: "coral",
      context: "Said before a meal when you're really hungry", notes: "Hyperbole — kids enjoy the drama of it.", alt: "A child looking eagerly at the kitchen",
      blocks: [{ id: "dw_in_llwgu", welsh: "Dw i'n llwgu", english: "I'm starving" }] },

    { id: "phrase_dwin_hoffi_pasta", welsh: "Dw i'n hoffi pasta", english: "I like pasta", natural: "I like pasta", pron: "doo een HOFF-ee PAST-a", color: "orange",
      context: "Said to tell someone you like a food", notes: "Swap the last block to make a phrase for any food.", alt: "A child pointing happily at a bowl of pasta",
      blocks: [{ id: "dw_in_hoffi", welsh: "Dw i'n hoffi", english: "I like" }, { id: "pasta", welsh: "pasta", english: "pasta" }] },

    { id: "phrase_dwi_ddim_yn_hoffi_pys", welsh: "Dw i ddim yn hoffi pys", english: "I don't like peas", natural: "I don't like peas", pron: "doo ee thim un HOFF-ee pees", color: "teal",
      context: "Low stakes — meant to be funny, not a real refusal", notes: "The honest first phrase most kids want to say. Keep it light.", alt: "A child playfully pushing peas away",
      blocks: [{ id: "dw_i_ddim_yn_hoffi", welsh: "Dw i ddim yn hoffi", english: "I don't like" }, { id: "pys", welsh: "pys", english: "peas" }] },

    { id: "phrase_dwin_llawn", welsh: "Dw i'n llawn", english: "I'm full", natural: "I'm full / I'm done", pron: "doo een thlown", color: "gold",
      context: "Said at the end of a meal when you've had enough", notes: "", alt: "A child leaning back from a cleared plate",
      blocks: [{ id: "dw_in_llawn", welsh: "Dw i'n llawn", english: "I'm full" }] },

    { id: "phrase_ga_i_fwy_o_datws", welsh: "Ga i fwy o datws", english: "Can I have more potatoes", natural: "More potatoes please", pron: "gah ee voo-ee oh dat-oos", color: "indigo",
      context: "Said at the table when you want more food", notes: "mwy o triggers soft mutation: tatws becomes datws.", alt: "A bowl of potatoes passed across the table",
      blocks: [{ id: "ga_i", welsh: "Ga i", english: "Can I have" }, { id: "mwy_o", welsh: "mwy o", english: "more" }, { id: "datws", welsh: "datws", english: "potatoes" }] },

    { id: "phrase_gair_halen", welsh: "Ga i'r halen, os gwelwch yn dda", english: "Can I have the salt, please", natural: "Can I have the salt please", pron: "gah eer HAL-en, os gwel-ooch un tha", color: "coral",
      context: "Said when you want the salt passed to you", notes: "Ga i'r = Ga i + yr (the).", alt: "A hand reaching toward a salt shaker",
      blocks: [{ id: "gai_r", welsh: "Ga i'r", english: "Can I have the" }, { id: "halen", welsh: "halen", english: "salt" }, { id: "os_gwelwch_yn_dda", welsh: "os gwelwch yn dda", english: "please" }] },

    { id: "phrase_gair_llaeth_plis", welsh: "Ga i'r llaeth, plîs", english: "Can I have the milk, please", natural: "Can I have the milk please", pron: "gah eer thleye-th, pleece", color: "teal",
      context: "Said when you want the milk passed to you", notes: "Uses informal plîs — what a South Wales family actually says.", alt: "A jug of milk on the table",
      blocks: [{ id: "gai_r", welsh: "Ga i'r", english: "Can I have the" }, { id: "llaeth", welsh: "llaeth", english: "milk" }, { id: "plis", welsh: "plîs", english: "please" }] },

    { id: "phrase_diolch", welsh: "Diolch", english: "Thank you", natural: "Thank you", pron: "dee-olch", color: "indigo",
      context: "Said whenever something is passed or received at the table", notes: "High frequency — works in every topic.", alt: "A smiling person saying thank you",
      blocks: [{ id: "diolch", welsh: "Diolch", english: "Thank you" }] }
  ],

  /* phrases used in the phrase-builder practice (multi-block, from content) */
  builderRefs: ["phrase_ga_i_fwy_o_datws", "phrase_gair_halen", "phrase_dwin_hoffi_pasta", "phrase_dwi_ddim_yn_hoffi_pys", "phrase_gair_llaeth_plis"],
  /* food words used in listen & find */
  listenRefs: ["word_tatws_dinner", "word_pys_dinner", "word_cig_dinner", "word_pasta_dinner", "word_llysiau_dinner", "word_caws_dinner", "word_llaeth_dinner", "word_dwr_dinner"],
  /* foods that go on the plate */
  plateRefs: ["word_tatws_dinner", "word_pys_dinner", "word_cig_dinner", "word_pasta_dinner", "word_llysiau_dinner", "word_caws_dinner", "word_bara_dinner"],
  /* café menu: order phrases + servable food words */
  cafePhraseRefs: ["phrase_ga_i_fwy_o_datws", "phrase_gair_halen", "phrase_gair_llaeth_plis"],
  cafeFoodRefs: ["word_pasta_dinner", "word_caws_dinner", "word_bara_dinner", "word_dwr_dinner"],

  challenges: [
    { id: "challenge_phrase_night", title: "Phrase of the night", category: "scripted phrase", color: "gold", duration: "one meal",
      prompt: "Tonight, everyone has to ask for something using Welsh. The app will remind you at dinner time.",
      welsh: "Gofynnwch yn Gymraeg", phraseRef: "phrase_ga_i_fwy_o_datws",
      alternative: "Try just the first word — Ga i is enough to start." },
    { id: "challenge_table_hunt", title: "Name the table", category: "item hunt", color: "teal", duration: "pre meal",
      prompt: "Before anyone sits down, take turns naming something on the table in Welsh. How many can you get?",
      welsh: "Beth sydd ar y bwrdd?", refs: ["word_plat_dinner", "word_cwpan_dinner", "word_fforc_dinner", "word_llwy_dinner", "word_cyllell_dinner"],
      alternative: "Point to things instead — the family guesses the Welsh word." },
    { id: "challenge_taste_test", title: "Blaswr y nos", category: "role play", color: "coral", duration: "one meal",
      prompt: "Pick one taster. They try a forkful of something and give a verdict in Welsh: 'Dw i'n hoffi hwn!' or 'Dw i ddim yn hoffi hwn!' Everyone else guesses before they say it.",
      welsh: "Pwy yw'r blaswr heno?", refs: ["phrase_dwin_hoffi_pasta", "phrase_dwi_ddim_yn_hoffi_pys"],
      alternative: "Thumbs up or thumbs down counts as the verdict — no words needed." },
    { id: "challenge_clear_the_table", title: "Clirio'r bwrdd", category: "competitive", color: "indigo", duration: "after meal",
      prompt: "When the meal's done, clear together — but you can only pick something up after you've named it in Welsh. Last thing on the table loses.",
      welsh: "Clirio'r bwrdd!", refs: ["word_plat_dinner", "word_cwpan_dinner", "word_fforc_dinner", "word_llwy_dinner", "word_cyllell_dinner", "word_halen_dinner", "word_sos_dinner"],
      alternative: "Name it in English first, then have a go at the Welsh — both count." }
  ]
};

/* ---- hand-drawn illustrations, keyed to word id ---- */
DD._art = {
  word_plat_dinner: "/art/plat.svg",   word_cwpan_dinner: "/art/cwpan.svg",
  word_fforc_dinner: "/art/fforc.svg", word_llwy_dinner: "/art/llwy.svg",
  word_cyllell_dinner: "/art/cyllell.svg", word_bwrdd_dinner: "/art/bwrdd.svg",
  word_tatws_dinner: "/art/tatws.svg", word_pys_dinner: "/art/pys.svg",
  word_cig_dinner: "/art/cig.svg",     word_pasta_dinner: "/art/pasta.svg",
  word_llysiau_dinner: "/art/llysiau.svg", word_caws_dinner: "/art/caws.svg",
  word_bara_dinner: "/art/bara.svg",   word_llaeth_dinner: "/art/llaeth.svg",
  word_dwr_dinner: "/art/dwr.svg",     word_halen_dinner: "/art/halen.svg",
  word_sos_dinner: "/art/sos.svg"
};
DD.wordGroups.forEach(g => g.words.forEach(w => {
  const a = DD._art[w.id]; if (a) w.art = a;
}));

/* flat lookups */
DD.allWords = DD.wordGroups.flatMap(g => g.words);
DD.wordById = Object.fromEntries(DD.allWords.map(w => [w.id, w]));
DD.phraseById = Object.fromEntries(DD.phrases.map(p => [p.id, p]));

export default DD;
