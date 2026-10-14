// Wordscape GCSE game engine: word lists, level planning and crossword layout.
// No screen code here, so it can be tested on its own.

import { SETTINGS, wordsForLevel, wheelSizeForLevel } from "./config.js";

// ---------- random numbers (seeded, so a level can be rebuilt exactly) ----------

export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const newSeed = () => Math.floor(Math.random() * 2 ** 31);
const pick = (list, rng) => list[Math.floor(rng() * list.length)];

export function shuffle(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- reading the word files ----------

export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

const VALID = /^[a-z]+$/;

// A topic's words.csv: columns word, clue, say_as.
export function parseTopicWords(text) {
  const [header, ...rows] = parseCsv(text);
  const col = (name) => header.map((h) => h.trim().toLowerCase()).indexOf(name);
  const iw = col("word"), ic = col("clue"), is = col("say_as");
  const seen = new Set();
  const words = [];
  for (const r of rows) {
    const word = (r[iw] || "").trim().toLowerCase();
    if (!VALID.test(word) || word.length < SETTINGS.minWordLength) continue;
    if (word.length > SETTINGS.maxWheelLetters || seen.has(word)) continue;
    seen.add(word);
    words.push({ word, clue: (r[ic] || "").trim(), say: (r[is] || "").trim() });
  }
  return words;
}

export function parseWordList(text) {
  return text.split(/\r?\n/).map((w) => w.trim().toLowerCase()).filter((w) => VALID.test(w));
}

// ---------- letter counting ----------

export function counts(word) {
  const c = new Array(26).fill(0);
  for (const ch of word) c[ch.charCodeAt(0) - 97]++;
  return c;
}

export function fits(word, have) {
  const c = counts(word);
  for (let i = 0; i < 26; i++) if (c[i] > have[i]) return false;
  return true;
}

const union = (a, b) => a.map((v, i) => Math.max(v, b[i]));
const size = (c) => c.reduce((s, v) => s + v, 0);

export function lettersOf(c) {
  const out = [];
  c.forEach((n, i) => { for (let k = 0; k < n; k++) out.push(String.fromCharCode(97 + i)); });
  return out;
}

// ---------- the English word lists ----------

export class Lexicon {
  constructor(puzzleWords, dictionaryWords) {
    const ok = (w) => w.length >= SETTINGS.minWordLength && w.length <= SETTINGS.maxWheelLetters;
    this.puzzle = puzzleWords.filter(ok);
    this.dictionary = new Set(dictionaryWords.filter(ok));
    for (const w of this.puzzle) this.dictionary.add(w);
    this.byLength = {};
    for (const w of this.puzzle) (this.byLength[w.length] ||= []).push(w);
  }

  wordsFrom(have, exclude) {
    return this.puzzle.filter((w) => !exclude.has(w) && fits(w, have));
  }
}

// ---------- planning a level ----------

// Chooses the words for one level. Returns null when a topic has no unused words left.
//   topic:   array of {word, clue, say}, or null for the english subject
//   used:    Set of words already used (topic words, or english main words)
export function planLevel({ levelNo, topic, used, lexicon, rng }) {
  const target = wordsForLevel(levelNo);
  const cap = wheelSizeForLevel(levelNo);
  const chosen = [];
  let have;

  if (topic) {
    const unused = topic.filter((t) => !used.has(t.word));
    if (!unused.length) return null;
    let fitting = unused.filter((t) => t.word.length <= cap);
    if (!fitting.length) {
      const shortest = Math.min(...unused.map((t) => t.word.length));
      fitting = unused.filter((t) => t.word.length === shortest);
    }
    const first = pick(fitting, rng);
    chosen.push({ ...first, topic: true });
    have = counts(first.word);
    const limit = Math.max(cap, first.word.length);
    const others = shuffle(unused.filter((t) => t !== first), rng);
    // other topic words that can be made from the letters already on the wheel
    for (const t of others) {
      if (chosen.length >= target) break;
      if (fits(t.word, have)) chosen.push({ ...t, topic: true });
    }
    // then topic words that need a few more letters, if the wheel has room
    while (chosen.length < target) {
      let best = null, bestExtra = Infinity;
      for (const t of others) {
        if (chosen.some((c) => c.word === t.word)) continue;
        const u = union(have, counts(t.word));
        const extra = size(u) - size(have);
        if (size(u) <= limit && extra < bestExtra) { best = t; bestExtra = extra; }
      }
      if (!best) break;
      chosen.push({ ...best, topic: true });
      have = union(have, counts(best.word));
    }
  } else {
    // english: a main word of the level's wheel size with enough words inside it
    const pool = (lexicon.byLength[cap] || []).filter((w) => !used.has(w));
    let best = null, bestCount = -1;
    for (let i = 0; i < 250 && pool.length; i++) {
      const w = pick(pool, rng);
      const n = lexicon.wordsFrom(counts(w), new Set([w])).length;
      if (n > bestCount) { best = w; bestCount = n; }
      if (n >= target - 1 && n <= target + 25) break;
    }
    if (!best) return null;
    chosen.push({ word: best, clue: "", say: "", topic: false, main: true });
    have = counts(best);
  }

  const exclude = new Set(chosen.map((c) => c.word));
  if (topic) for (const t of topic) exclude.add(t.word); // topic words never come back as fillers
  const fillers = lexicon.wordsFrom(have, exclude)
    .map((w) => ({ w, s: w.length + rng() * 2.5 }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.w);

  return { target, wheelSize: size(have), have, required: chosen, fillers };
}

// ---------- crossword layout ----------

const key = (r, c) => r + "," + c;

function tryLayout(required, fillers, target, rng) {
  const grid = new Map(); // key -> {ch, dirs: Set}
  const placed = [];
  let minR = 0, maxR = 0, minC = 0, maxC = 0;

  const put = (word, r0, c0, dir) => {
    const [dr, dc] = dir === "H" ? [0, 1] : [1, 0];
    for (let k = 0; k < word.length; k++) {
      const r = r0 + dr * k, c = c0 + dc * k;
      const cell = grid.get(key(r, c)) || { ch: word[k], dirs: new Set() };
      cell.dirs.add(dir);
      grid.set(key(r, c), cell);
      minR = Math.min(minR, r); maxR = Math.max(maxR, r);
      minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    }
    placed.push({ word, row: r0, col: c0, dir });
  };

  const tileScore = (r1, r2, c1, c2) => {
    const rows = r2 - r1 + 1, cols = c2 - c1 + 1;
    return Math.min(1 / cols, 0.8 / rows);
  };

  const check = (word, r0, c0, dir) => {
    const [dr, dc] = dir === "H" ? [0, 1] : [1, 0];
    const len = word.length;
    if (grid.has(key(r0 - dr, c0 - dc)) || grid.has(key(r0 + dr * len, c0 + dc * len))) return null;
    let crossings = 0;
    for (let k = 0; k < len; k++) {
      const r = r0 + dr * k, c = c0 + dc * k;
      const cell = grid.get(key(r, c));
      if (cell) {
        if (cell.ch !== word[k] || cell.dirs.has(dir)) return null;
        crossings++;
      } else if (grid.has(key(r + dc, c + dr)) || grid.has(key(r - dc, c - dr))) {
        return null;
      }
    }
    if (!crossings) return null;
    const r1 = Math.min(minR, r0), r2 = Math.max(maxR, r0 + dr * (len - 1));
    const c1 = Math.min(minC, c0), c2 = Math.max(maxC, c0 + dc * (len - 1));
    if (r2 - r1 + 1 > SETTINGS.maxGridSize || c2 - c1 + 1 > SETTINGS.maxGridSize) return null;
    return crossings * 0.02 + tileScore(r1, r2, c1, c2) + rng() * 0.01;
  };

  const best = (word) => {
    let top = null;
    for (const p of placed) {
      const dir = p.dir === "H" ? "V" : "H";
      for (let i = 0; i < p.word.length; i++) {
        for (let j = 0; j < word.length; j++) {
          if (p.word[i] !== word[j]) continue;
          const r = p.dir === "H" ? p.row : p.row + i;
          const c = p.dir === "H" ? p.col + i : p.col;
          const r0 = dir === "V" ? r - j : r, c0 = dir === "V" ? c : c - j;
          const s = check(word, r0, c0, dir);
          if (s !== null && (!top || s > top.s)) top = { r0, c0, dir, s };
        }
      }
    }
    return top;
  };

  // a required word that cannot cross the others goes on its own, below or beside them
  const putApart = (word) => {
    const below = tileScore(minR, maxR + 2, minC, Math.max(maxC, minC + word.length - 1));
    const beside = tileScore(minR, Math.max(maxR, minR + word.length - 1), minC, maxC + 2);
    if (below >= beside) put(word, maxR + 2, minC, "H");
    else put(word, minR, maxC + 2, "V");
  };

  const req = shuffle(required, rng).sort((a, b) => b.length - a.length);
  put(req[0], 0, 0, "H");
  let apart = 0;
  for (const w of req.slice(1)) {
    const b = best(w);
    if (b) put(w, b.r0, b.c0, b.dir);
    else { putApart(w); apart++; }
  }
  for (const w of fillers) {
    if (placed.length >= target) break;
    const b = best(w);
    if (b) put(w, b.r0, b.c0, b.dir);
  }
  const cross = [...grid.values()].filter((c) => c.dirs.size > 1).length;
  return {
    placed, minR, minC,
    rows: maxR - minR + 1, cols: maxC - minC + 1,
    score: placed.length * 10 - apart * 3 + tileScore(minR, maxR, minC, maxC) * 8 + cross * 0.05,
  };
}

export function layoutWords(required, fillers, target, rng, attempts = 60) {
  let best = null;
  for (let a = 0; a < attempts; a++) {
    // vary which fillers are tried first, keeping a lean towards longer words
    const pool = fillers.slice(0, 40);
    const order = pool.map((w, i) => ({ w, s: -i + rng() * 12 })).sort((x, y) => y.s - x.s).map((x) => x.w);
    const lay = tryLayout(required, order, target, rng);
    if (!best || lay.score > best.score) best = lay;
    if (best.placed.length >= target && a > 15) break;
  }
  return {
    rows: best.rows,
    cols: best.cols,
    words: best.placed.map((p) => {
      const [dr, dc] = p.dir === "H" ? [0, 1] : [1, 0];
      const cells = [];
      for (let k = 0; k < p.word.length; k++) cells.push([p.row - best.minR + dr * k, p.col - best.minC + dc * k]);
      return { word: p.word, dir: p.dir, cells };
    }),
  };
}

// ---------- building a whole level ----------

export function buildLevel({ levelNo, topic, used, lexicon, seed }) {
  const rng = makeRng(seed);
  const plan = planLevel({ levelNo, topic, used, lexicon, rng });
  if (!plan) return null;
  const req = plan.required.map((r) => r.word);
  const lay = layoutWords(req, plan.fillers, plan.target, rng);
  const info = new Map(plan.required.map((r) => [r.word, r]));
  const words = lay.words.map((w) => {
    const r = info.get(w.word);
    return { ...w, clue: r?.clue || "", say: r?.say || "", topic: !!r?.topic, solved: false };
  });
  // wheel: the letters needed for every word on the grid, in an order that does not spell a word
  let have = new Array(26).fill(0);
  for (const w of words) have = union(have, counts(w.word));
  let wheel = shuffle(lettersOf(have), rng);
  for (let i = 0; i < 6 && words.some((w) => w.word === wheel.join("")); i++) wheel = shuffle(wheel, rng);
  return {
    levelNo,
    seed,
    rows: lay.rows,
    cols: lay.cols,
    words,
    wheel,
    revealed: [],   // cell keys shown by the clue button
    bonus: [],      // bonus words found in this level
  };
}

// ---------- during play ----------

export const cellKey = key;

export function visibleCells(level) {
  const shown = new Set(level.revealed);
  for (const w of level.words) if (w.solved) for (const [r, c] of w.cells) shown.add(key(r, c));
  return shown;
}

// What happens when the player enters a word.
export function judgeWord(level, word, lexicon, topicWords) {
  word = word.toLowerCase();
  if (word.length < SETTINGS.minWordLength) return { result: "short" };
  const onGrid = level.words.findIndex((w) => w.word === word);
  if (onGrid >= 0) return level.words[onGrid].solved ? { result: "already", index: onGrid } : { result: "solved", index: onGrid };
  if (!fits(word, counts(level.wheel.join("")))) return { result: "invalid" };
  if (lexicon.dictionary.has(word) || topicWords.has(word)) {
    return level.bonus.includes(word) ? { result: "bonus-again" } : { result: "bonus" };
  }
  return { result: "invalid" };
}

// Picks a hidden letter on an unsolved word for the clue button.
export function pickHiddenCell(level, rng = Math.random) {
  const shown = visibleCells(level);
  const hidden = [];
  for (const w of level.words) {
    if (w.solved) continue;
    for (const [r, c] of w.cells) if (!shown.has(key(r, c)) && !hidden.includes(key(r, c))) hidden.push(key(r, c));
  }
  return hidden.length ? hidden[Math.floor(rng() * hidden.length)] : null;
}

// Words whose letters are now all showing (for example after a clue) count as solved.
export function wordsCompletedByReveal(level) {
  const shown = visibleCells(level);
  return level.words
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => !w.solved && w.cells.every(([r, c]) => shown.has(key(r, c))))
    .map(({ i }) => i);
}

export const levelDone = (level) => level.words.every((w) => w.solved);
