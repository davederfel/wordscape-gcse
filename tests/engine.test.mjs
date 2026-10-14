// Plays every topic to completion with many random seeds and checks the game's rules.
// Run: node tests/engine.test.mjs
import { readFileSync } from "node:fs";
import { SETTINGS, wordsForLevel } from "../src/config.js";
import { Lexicon, parseTopicWords, parseWordList, buildLevel, counts, fits, judgeWord,
         pickHiddenCell, wordsCompletedByReveal, cellKey, makeRng } from "../src/engine.js";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const lexicon = new Lexicon(parseWordList(read("subjects/english/words.txt")), parseWordList(read("subjects/english/dictionary.txt")));
const index = JSON.parse(read("subjects/topics.json"));

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.log("FAIL:", msg); };

function checkLevel(level, label) {
  const grid = new Map();
  const wheel = counts(level.wheel.join(""));
  if (level.wheel.length > SETTINGS.maxWheelLetters) fail(`${label}: wheel has ${level.wheel.length} letters`);
  if (level.words.length > SETTINGS.maxWordsPerLevel) fail(`${label}: ${level.words.length} words`);
  if (new Set(level.words.map((w) => w.word)).size !== level.words.length) fail(`${label}: repeated word`);
  if (level.rows > SETTINGS.maxGridSize + 2 || level.cols > SETTINGS.maxGridSize + 2) fail(`${label}: grid ${level.rows}x${level.cols}`);
  for (const w of level.words) {
    if (!fits(w.word, wheel)) fail(`${label}: ${w.word} not makeable from wheel ${level.wheel.join("")}`);
    w.cells.forEach(([r, c], k) => {
      const ch = grid.get(cellKey(r, c));
      if (ch && ch !== w.word[k]) fail(`${label}: clash at ${r},${c}`);
      grid.set(cellKey(r, c), w.word[k]);
      if (r < 0 || c < 0 || r >= level.rows || c >= level.cols) fail(`${label}: ${w.word} outside grid`);
    });
  }
  // every run of 2+ letters across or down must be one of the level's words
  const words = new Set(level.words.map((w) => w.word));
  for (const [dr, dc] of [[0, 1], [1, 0]]) {
    for (let r = 0; r < level.rows; r++) for (let c = 0; c < level.cols; c++) {
      if (!grid.has(cellKey(r, c)) || grid.has(cellKey(r - dr, c - dc))) continue;
      let run = "", rr = r, cc = c;
      while (grid.has(cellKey(rr, cc))) { run += grid.get(cellKey(rr, cc)); rr += dr; cc += dc; }
      if (run.length > 1 && !words.has(run)) fail(`${label}: stray run "${run}"`);
    }
  }
}

const SEEDS = 25;
for (const subject of index.subjects) {
  for (const t of subject.topics) {
    const topic = parseTopicWords(read(t.file));
    const summary = [];
    for (let s = 0; s < SEEDS; s++) {
      const used = new Set();
      const seen = [];
      let levelNo = 1;
      for (; levelNo < 200; levelNo++) {
        const level = buildLevel({ levelNo, topic, used, lexicon, seed: s * 1000 + levelNo });
        if (!level) break;
        const label = `${t.name} seed ${s} level ${levelNo}`;
        checkLevel(level, label);
        const topicHere = level.words.filter((w) => w.topic);
        if (!topicHere.length) fail(`${label}: no topic word`);
        if (level.words.length > wordsForLevel(levelNo) && level.words.length > topicHere.length) fail(`${label}: more words than planned`);
        for (const w of topicHere) { if (used.has(w.word)) fail(`${label}: ${w.word} repeated`); used.add(w.word); seen.push(w.word); }
        for (const w of level.words.filter((x) => !x.topic)) if (topic.some((x) => x.word === w.word)) fail(`${label}: topic word ${w.word} used as filler`);
        if (s === 0) summary.push(`L${levelNo}: ${level.words.map((w) => (w.topic ? w.word.toUpperCase() : w.word)).join(" ")}  [wheel ${level.wheel.join("").toUpperCase()}, ${level.rows}x${level.cols}]`);
      }
      if (seen.length !== topic.length) fail(`${t.name} seed ${s}: used ${seen.length} of ${topic.length} topic words`);
    }
    console.log(`\n${subject.name} / ${t.name}: ${topic.length} words`);
    console.log(summary.map((l) => "  " + l).join("\n"));
  }
}

// english subject: 40 levels, no repeated main word
{
  const used = new Set();
  const summary = [];
  for (let levelNo = 1; levelNo <= 40; levelNo++) {
    const level = buildLevel({ levelNo, topic: null, used, lexicon, seed: 777 + levelNo });
    if (!level) { fail(`english level ${levelNo}: no level`); break; }
    checkLevel(level, `english level ${levelNo}`);
    const main = level.words.find((w) => w.word.length === level.wheel.length) || level.words[0];
    used.add(main.word);
    if (levelNo <= 12 || levelNo % 10 === 0) summary.push(`L${levelNo}: ${level.words.map((w) => w.word).join(" ")}  [wheel ${level.wheel.join("").toUpperCase()}]`);
  }
  console.log("\nenglish:\n" + summary.map((l) => "  " + l).join("\n"));
}

// play rules: judging words, clue letters, completion by reveal
{
  const topic = parseTopicWords(read("subjects/computer/digital-media/words.csv"));
  const level = buildLevel({ levelNo: 5, topic, used: new Set(), lexicon, seed: 42 });
  const topicSet = new Set(topic.map((t) => t.word));
  const first = level.words[0].word;
  const j1 = judgeWord(level, first.toUpperCase(), lexicon, topicSet);
  if (j1.result !== "solved") fail(`judge: expected solved, got ${j1.result}`);
  level.words[j1.index].solved = true;
  if (judgeWord(level, first, lexicon, topicSet).result !== "already") fail("judge: expected already");
  if (judgeWord(level, "zzz", lexicon, topicSet).result !== "invalid") fail("judge: expected invalid");
  if (judgeWord(level, "ab", lexicon, topicSet).result !== "short") fail("judge: expected short");
  const rng = makeRng(1);
  let guard = 0;
  while (level.words.some((w) => !w.solved) && guard++ < 100) {
    const k = pickHiddenCell(level, rng);
    if (!k) { fail("clue: no hidden cell while words unsolved"); break; }
    level.revealed.push(k);
    for (const i of wordsCompletedByReveal(level)) level.words[i].solved = true;
  }
  if (level.words.some((w) => !w.solved)) fail("clue: revealing every letter did not solve the level");
  if (pickHiddenCell(level, rng) !== null) fail("clue: hidden cell offered on a solved level");
  console.log(`\nplay rules: level of ${level.words.length} words fully revealed in ${level.revealed.length} clue presses`);
}

// bonus words
{
  const level = { words: [{ word: "top", solved: false, cells: [] }], wheel: ["t", "o", "p"], bonus: [] };
  const r = judgeWord(level, "pot", lexicon, new Set());
  if (r.result !== "bonus") fail(`bonus: expected bonus for POT, got ${r.result}`);
  level.bonus.push("pot");
  if (judgeWord(level, "pot", lexicon, new Set()).result !== "bonus-again") fail("bonus: expected bonus-again");
}

console.log(failures ? `\n${failures} FAILURES` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
