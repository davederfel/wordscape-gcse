// Wordscape GCSE: screens, play and saving.

import { SETTINGS } from "./config.js";
import { Lexicon, parseTopicWords, parseWordList, buildLevel, judgeWord, pickHiddenCell,
         wordsCompletedByReveal, levelDone, cellKey, newSeed, shuffle } from "./engine.js";
import { speech } from "./speech.js";
import { startBirds } from "./birds.js";

const $ = (id) => document.getElementById(id);
const SAVE_KEY = "wordscape-gcse-save";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const fmt = (n) => n.toLocaleString("en-GB");

const data = { index: null, lexicon: null, backgrounds: null, topics: new Map() };
let game = null;        // the game in play (this is what gets saved)
let topicList = null;   // the current topic's words, from its words.csv
let path = [];          // letters selected on the wheel, as indexes into level.wheel
let dragging = false;
let pointer = null;
let busy = false;
let cells = new Map();  // cell key -> element

// ---------- saving ----------

function readSave() {
  try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...game, savedAt: Date.now() })); return true; } catch { return false; }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* nothing saved */ } }

// ---------- loading the word lists and pictures ----------

async function getText(p) {
  const r = await fetch(p);
  if (!r.ok) throw new Error(`${p}: ${r.status}`);
  return r.text();
}

async function load() {
  const [index, words, dict, bgs] = await Promise.all([
    getText("subjects/topics.json").then(JSON.parse),
    getText("subjects/english/words.txt"),
    getText("subjects/english/dictionary.txt"),
    getText("assets/backgrounds/backgrounds.json").then(JSON.parse),
  ]);
  data.index = index;
  data.lexicon = new Lexicon(parseWordList(words), parseWordList(dict));
  data.backgrounds = bgs;
}

async function loadTopic(file) {
  if (!data.topics.has(file)) data.topics.set(file, parseTopicWords(await getText(file)));
  return data.topics.get(file);
}

// ---------- backgrounds ----------

let bgFront = "bgA";
function setBackground(url) {
  if (!url) return;
  const front = $(bgFront);
  if (front.dataset.url === url) return;
  const img = new Image();
  img.onload = img.onerror = () => {
    const nextId = bgFront === "bgA" ? "bgB" : "bgA";
    const next = $(nextId);
    next.style.backgroundImage = `url("${url}")`;
    next.dataset.url = url;
    next.classList.add("on");
    front.classList.remove("on");
    bgFront = nextId;
  };
  img.src = url;
}

function menuBackground() {
  const list = data.backgrounds?.default || [];
  return list.find((p) => p.includes("sunset-lake")) || list[0];
}

function levelBackground() {
  const key = game.english ? "english" : `${game.subjectKey}/${game.topicKey}`;
  const list = data.backgrounds.topics[key] || data.backgrounds.default;
  return list[(game.levelNo - 1) % list.length];
}

// ---------- screens ----------

const SCREENS = ["screenStart", "screenSubjects", "screenTopics", "screenGame"];
function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
  closeMenu();
  if (id !== "screenGame") setBackground(menuBackground());
}

function renderStart() {
  const save = readSave();
  $("resumePanel").hidden = !save;
  if (save) {
    const where = save.english ? "English" : cap(save.topicName);
    $("resumeMeta").textContent = `${where} · Level ${save.levelNo} · ${fmt(save.score)} points`;
  }
  show("screenStart");
}

function renderSubjects() {
  const list = $("subjectList");
  list.innerHTML = "";
  const add = (label, note, onClick) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice";
    b.innerHTML = `${esc(label)}<span>${esc(note)}</span>`;
    b.addEventListener("click", onClick);
    list.appendChild(b);
  };
  add("English", "Everyday words", () => startNewGame(null, null));
  for (const s of data.index.subjects) {
    const n = s.topics.length;
    add(cap(s.name), `${n} topic${n === 1 ? "" : "s"}`, () => renderTopics(s));
  }
  show("screenSubjects");
}

function renderTopics(subject) {
  $("topicsTitle").textContent = cap(subject.name);
  const list = $("topicList");
  list.innerHTML = "";
  for (const t of subject.topics) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice";
    b.innerHTML = `${esc(cap(t.name))}<span>${t.words} words</span>`;
    b.addEventListener("click", () => startNewGame(subject, t));
    list.appendChild(b);
  }
  show("screenTopics");
}

// ---------- starting and resuming ----------

async function startNewGame(subject, topic) {
  game = {
    version: 1,
    english: !subject,
    subjectKey: subject?.key || "english",
    subjectName: subject?.name || "English",
    topicKey: topic?.key || "",
    topicName: topic?.name || "English",
    topicFile: topic?.file || "",
    levelNo: 1,
    score: 0,
    used: [],
    cluePresses: 0,
    level: null,
  };
  topicList = game.english ? null : await loadTopic(game.topicFile);
  makeLevel();
  enterGame();
}

async function resumeGame() {
  const save = readSave();
  if (!save) return renderStart();
  delete save.savedAt;
  game = save;
  try {
    topicList = game.english ? null : await loadTopic(game.topicFile);
  } catch {
    openDialog({ title: "This topic is no longer available", body: "<p>Its word list could not be found. Choose another topic.</p>",
      buttons: [{ label: "Choose a topic", action: () => { closeDialog(); renderSubjects(); } }] });
    return;
  }
  enterGame();
}

function makeLevel() {
  const used = new Set(game.used);
  const level = buildLevel({ levelNo: game.levelNo, topic: topicList, used, lexicon: data.lexicon, seed: newSeed() });
  if (!level) return false;
  level.slots = level.wheel.map((_, i) => i); // where each wheel letter sits around the circle
  if (game.english) {
    const main = level.words.reduce((a, b) => (b.word.length > a.word.length ? b : a));
    game.used.push(main.word);
    if (game.used.length > 3000) game.used.splice(0, game.used.length - 3000);
  } else {
    for (const w of level.words) if (w.topic) game.used.push(w.word);
  }
  game.level = level;
  return true;
}

function enterGame() {
  clearAnnouncements();
  busy = false;
  path = [];
  closeDialog();
  show("screenGame");
  renderGame();
}

// ---------- drawing the game ----------

function renderGame() {
  const level = game.level;
  $("topicName").textContent = game.english ? "English" : cap(game.topicName);
  $("levelName").textContent = `Level ${game.levelNo}`;
  $("scoreValue").textContent = fmt(game.score);
  $("clueCost").textContent = SETTINGS.clueCost;
  setBackground(levelBackground());
  buildGrid(level);
  buildWheel(level);
  updateCurrent();
}

function buildGrid(level) {
  const grid = $("grid");
  grid.innerHTML = "";
  cells = new Map();
  for (const w of level.words) {
    w.cells.forEach(([r, c], k) => {
      const key = cellKey(r, c);
      if (cells.has(key)) return;
      const el = document.createElement("div");
      el.className = "cell";
      el.dataset.r = r; el.dataset.c = c;
      el.dataset.letter = w.word[k];
      el.innerHTML = '<span class="ch"></span>';
      grid.appendChild(el);
      cells.set(key, el);
    });
  }
  layoutGrid();
  refreshCells();
}

function layoutGrid() {
  const level = game?.level;
  if (!level) return;
  const board = $("board");
  const W = board.clientWidth, H = board.clientHeight;
  if (!W || !H) return;
  const gap = 0.1;
  const tile = Math.floor(Math.min(
    W / (level.cols + (level.cols - 1) * gap),
    H / (level.rows + (level.rows - 1) * gap),
    W * 0.2,
  ));
  const step = tile * (1 + gap);
  const grid = $("grid");
  grid.style.width = `${tile + step * (level.cols - 1)}px`;
  grid.style.height = `${tile + step * (level.rows - 1)}px`;
  for (const el of cells.values()) {
    el.style.width = el.style.height = `${tile}px`;
    el.style.left = `${el.dataset.c * step}px`;
    el.style.top = `${el.dataset.r * step}px`;
    el.style.fontSize = `${tile * 0.64}px`;
  }
}

function solvedCells(level) {
  const set = new Set();
  for (const w of level.words) if (w.solved) for (const [r, c] of w.cells) set.add(cellKey(r, c));
  return set;
}

function refreshCells(skip = new Set()) {
  const level = game.level;
  const found = solvedCells(level);
  const revealed = new Set(level.revealed);
  for (const [key, el] of cells) {
    if (skip.has(key)) continue;
    const isFound = found.has(key);
    el.classList.toggle("found", isFound);
    el.firstChild.textContent = isFound || revealed.has(key) ? el.dataset.letter : "";
  }
}

function pop(el) {
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
}

// Fills a word's tiles one after another. Returns how long the animation takes.
function animateWord(w) {
  const keys = w.cells.map(([r, c]) => cellKey(r, c));
  const skip = new Set(keys);
  refreshCells(skip);
  keys.forEach((key, k) => {
    setTimeout(() => {
      const el = cells.get(key);
      if (!el) return;
      el.classList.add("found");
      el.firstChild.textContent = el.dataset.letter;
      pop(el);
    }, k * 110);
  });
  return keys.length * 110 + 400;
}

// ---------- the letter wheel ----------

function wheelGeometry(n) {
  const radius = n <= 3 ? 0.29 : n <= 5 ? 0.32 : 0.34;
  const letter = n <= 3 ? 0.3 : n <= 5 ? 0.26 : 0.23;
  return { radius, letter };
}

function slotPosition(slot, n) {
  const { radius } = wheelGeometry(n);
  const a = -Math.PI / 2 + (slot / n) * Math.PI * 2;
  return { x: 0.5 + radius * Math.cos(a), y: 0.5 + radius * Math.sin(a) };
}

function buildWheel(level) {
  const wheel = $("wheel");
  wheel.querySelectorAll(".letter").forEach((el) => el.remove());
  const n = level.wheel.length;
  const { letter } = wheelGeometry(n);
  level.wheel.forEach((ch, i) => {
    const el = document.createElement("div");
    el.className = "letter";
    el.textContent = ch;
    el.dataset.i = i;
    el.style.width = el.style.height = `${letter * 100}%`;
    wheel.appendChild(el);
  });
  placeLetters();
}

function placeLetters() {
  const level = game.level;
  const wheel = $("wheel");
  const n = level.wheel.length;
  const size = wheel.clientWidth;
  const { letter } = wheelGeometry(n);
  wheel.querySelectorAll(".letter").forEach((el) => {
    const p = slotPosition(level.slots[el.dataset.i], n);
    el.style.left = `${p.x * 100}%`;
    el.style.top = `${p.y * 100}%`;
    el.style.fontSize = `${size * letter * 0.78}px`;
  });
}

function letterCentre(i) {
  const n = game.level.wheel.length;
  const p = slotPosition(game.level.slots[i], n);
  const size = $("wheel").clientWidth;
  return { x: p.x * size, y: p.y * size };
}

function hitTest(x, y) {
  const n = game.level.wheel.length;
  const size = $("wheel").clientWidth;
  const reach = size * wheelGeometry(n).letter * 0.55;
  for (let i = 0; i < n; i++) {
    const c = letterCentre(i);
    if (Math.hypot(c.x - x, c.y - y) < reach) return i;
  }
  return -1;
}

function touchLetter(i) {
  if (i < 0) return;
  if (!path.includes(i)) { path.push(i); updateCurrent(); }
  else if (path.length > 1 && path[path.length - 2] === i) { path.pop(); updateCurrent(); }
}

function drawTrail() {
  const line = $("trailLine");
  const size = $("wheel").clientWidth;
  const pts = path.map(letterCentre);
  if (dragging && pointer && pts.length) pts.push(pointer);
  line.setAttribute("points", pts.map((p) => `${p.x},${p.y}`).join(" "));
  line.setAttribute("stroke-width", size * 0.035);
}

function updateCurrent() {
  const level = game?.level;
  const cur = $("current");
  cur.classList.remove("fade", "shake");
  cur.innerHTML = path.map((i) => `<span class="ch">${esc(level.wheel[i])}</span>`).join("");
  $("wheel").querySelectorAll(".letter").forEach((el) => el.classList.toggle("on", path.includes(+el.dataset.i)));
  drawTrail();
}

function canPlay() {
  return game && !$("screenGame").hidden && $("overlay").hidden && $("menu").hidden && !busy;
}

function wheelPoint(e) {
  const r = $("wheel").getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function setupWheel() {
  const wheel = $("wheel");
  wheel.addEventListener("pointerdown", (e) => {
    if (!canPlay()) return;
    e.preventDefault();
    wheel.setPointerCapture?.(e.pointerId);
    dragging = true;
    path = [];
    pointer = wheelPoint(e);
    touchLetter(hitTest(pointer.x, pointer.y));
    drawTrail();
  });
  wheel.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    pointer = wheelPoint(e);
    touchLetter(hitTest(pointer.x, pointer.y));
    drawTrail();
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    pointer = null;
    submitPath();
  };
  wheel.addEventListener("pointerup", end);
  wheel.addEventListener("pointercancel", end);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("menu").hidden) { closeMenu(); return; }
    if (!canPlay() || e.ctrlKey || e.metaKey || e.altKey) return;
    const level = game.level;
    if (/^[a-z]$/i.test(e.key)) {
      const ch = e.key.toLowerCase();
      const i = level.wheel.findIndex((l, k) => l === ch && !path.includes(k));
      if (i >= 0) { path.push(i); updateCurrent(); } else shakeCurrent();
    } else if (e.key === "Backspace") { path.pop(); updateCurrent(); e.preventDefault(); }
    else if (e.key === "Enter") submitPath();
    else if (e.key === "Escape") { if (path.length) { path = []; updateCurrent(); } else closeAnnouncement(); }
    else if (e.key === " ") { e.preventDefault(); shuffleWheel(); }
  });
}

function shuffleWheel() {
  if (!canPlay()) return;
  const level = game.level;
  const n = level.slots.length;
  let next = level.slots;
  for (let k = 0; k < 8 && next.every((s, i) => s === level.slots[i]); k++) next = shuffle(level.slots, Math.random);
  level.slots = next;
  path = [];
  placeLetters();
  updateCurrent();
}

function shakeCurrent() {
  const cur = $("current");
  cur.classList.remove("shake");
  void cur.offsetWidth;
  cur.classList.add("shake");
}

function clearCurrentSoon(how) {
  const cur = $("current");
  if (how === "shake") shakeCurrent();
  setTimeout(() => cur.classList.add("fade"), how === "shake" ? 250 : 0);
  setTimeout(() => { if (!dragging && !path.length) cur.innerHTML = ""; }, 700);
}

// ---------- playing ----------

function submitPath() {
  const level = game.level;
  const word = path.map((i) => level.wheel[i]).join("");
  path = [];
  $("wheel").querySelectorAll(".letter").forEach((el) => el.classList.remove("on"));
  drawTrail();
  if (word) handleWord(word);
}

function handleWord(word) {
  const level = game.level;
  const topicSet = new Set((topicList || []).map((t) => t.word));
  const verdict = judgeWord(level, word, data.lexicon, topicSet);
  switch (verdict.result) {
    case "solved":
      solveWord(verdict.index, true);
      clearCurrentSoon("fade");
      break;
    case "already":
      toast("Already found");
      clearCurrentSoon("shake");
      break;
    case "bonus":
      level.bonus.push(word);
      addScore(SETTINGS.pointsPerBonus);
      toast(`Bonus word  +${SETTINGS.pointsPerBonus}`, true);
      {
        // a bonus word from this topic's list has a meaning to show; others are just read aloud
        const t = (topicList || []).find((x) => x.word === word);
        if (t?.clue) announce({ heading: "Bonus word", said: t.say || word.toUpperCase(), text: t.clue, speak: [t.say || word, t.clue] });
        else speech.say(t?.say || word);
      }
      clearCurrentSoon("fade");
      break;
    case "bonus-again":
      toast("Bonus word already found");
      clearCurrentSoon("shake");
      break;
    default:
      clearCurrentSoon("shake");
  }
  return verdict.result;
}

function solveWord(index, withPoints) {
  const level = game.level;
  const w = level.words[index];
  w.solved = true;
  if (withPoints) addScore(SETTINGS.pointsPerWord);
  const ms = animateWord(w);
  // show the word as it is spoken, with its meaning, while both are read aloud
  // a word with a meaning gets the box; a word without one is just read aloud
  let shown = Promise.resolve();
  if (w.clue) shown = announce({ said: w.say || w.word.toUpperCase(), text: w.clue, speak: [w.say || w.word, w.clue] });
  else speech.say(w.say || w.word);
  if (levelDone(level)) {
    busy = true;
    Promise.all([shown, new Promise((r) => setTimeout(r, ms + 600))]).then(levelComplete);
  }
  return ms;
}

function addScore(n) {
  game.score = Math.max(0, game.score + n);
  $("scoreValue").textContent = fmt(game.score);
  const s = $("score");
  s.classList.remove("bump");
  void s.offsetWidth;
  s.classList.add("bump");
}

let toastTimer;
function toast(text, good = false) {
  const t = $("toast");
  t.textContent = text;
  t.classList.toggle("good", good);
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

// The clue button: reveals a hidden letter; every 3rd press also reads and shows a clue,
// every 5th press also says a word. The press count runs across the whole topic.
function useClue() {
  if (!canPlay()) return;
  const level = game.level;
  if (game.score < SETTINGS.clueCost) { toast("No points left to spend"); return; }
  const key = pickHiddenCell(level);
  if (!key) return;
  addScore(-SETTINGS.clueCost);
  game.cluePresses += 1;
  level.revealed.push(key);
  refreshCells();
  pop(cells.get(key));

  // a revealed letter can finish a word; it counts as found, without the word points
  for (const i of wordsCompletedByReveal(level)) solveWord(i, false);

  const n = game.cluePresses;
  const unsolved = level.words.filter((w) => !w.solved);
  if (n % SETTINGS.clueReadEvery === 0) {
    const withClue = unsolved.filter((w) => w.clue);
    if (withClue.length) {
      const w = withClue[Math.floor(Math.random() * withClue.length)];
      showClue(w.clue);
    }
  }
  if (n % SETTINGS.wordSayEvery === 0 && unsolved.length) {
    const w = unsolved[Math.floor(Math.random() * unsolved.length)];
    speech.say(w.say || w.word);
  }
}

// The box at the bottom of the grid area. It shows a found word with its meaning, or a clue,
// for as long as it takes to read aloud. Several in a row take turns.
const announcements = [];
let announcing = false;
let announceTimer;

function announce({ heading = "", said = "", text = "", speak = [] }) {
  return new Promise((resolve) => {
    announcements.push({ heading, said, text, speak: speak.filter(Boolean), resolve });
    nextAnnouncement();
  });
}

let currentAnnouncement = null;

function nextAnnouncement() {
  if (announcing || !announcements.length) return;
  announcing = true;
  const a = announcements.shift();
  currentAnnouncement = a;
  const box = $("clueText");
  $("clueContent").innerHTML = (a.heading ? `<b>${esc(a.heading)}</b>` : "")
    + (a.said ? `<span class="said">${esc(a.said)}</span>` : "")
    + (a.text ? `<span class="meaning">${esc(a.text)}</span>` : "");
  box.classList.add("show");
  const shownAt = Date.now();
  // keep it up long enough to read; when speech is on, the speaking sets the pace
  const least = speech.on ? 1800 : a.text ? 4500 : 2000;
  const done = () => {
    if (a.cancelled) return;
    const wait = Math.max(0, least - (Date.now() - shownAt)) + 600;
    announceTimer = setTimeout(() => finishAnnouncement(a), wait);
  };
  const sayFrom = (k) => {
    if (a.cancelled) return;
    if (k < a.speak.length && speech.on) speech.say(a.speak[k], () => sayFrom(k + 1));
    else done();
  };
  sayFrom(0);
}

function finishAnnouncement(a) {
  if (currentAnnouncement !== a) return;
  currentAnnouncement = null;
  clearTimeout(announceTimer);
  if (!announcements.length) $("clueText").classList.remove("show");
  announcing = false;
  a.resolve();
  nextAnnouncement();
}

// The x on the box: stop reading it out and move on.
function closeAnnouncement() {
  const a = currentAnnouncement;
  if (!a) return;
  a.cancelled = true;
  speech.stop();
  finishAnnouncement(a);
}

function clearAnnouncements() {
  clearTimeout(announceTimer);
  if (currentAnnouncement) { currentAnnouncement.cancelled = true; currentAnnouncement.resolve(); currentAnnouncement = null; }
  for (const a of announcements.splice(0)) a.resolve();
  announcing = false;
  $("clueText").classList.remove("show");
}

function showClue(text) {
  announce({ heading: "Clue", text, speak: [text] });
}

function levelComplete() {
  addScore(SETTINGS.pointsPerLevel);
  const used = new Set(game.used);
  const topicDone = !game.english && topicList.every((t) => used.has(t.word));
  openDialog({
    title: `Level ${game.levelNo} complete`,
    body: `<div class="points-big">+${fmt(SETTINGS.pointsPerLevel)}</div><p>Score: ${fmt(game.score)}</p>`,
    buttons: [{ label: topicDone ? "Continue" : "Next level", action: topicDone ? topicComplete : nextLevel }],
  });
}

function nextLevel() {
  clearAnnouncements();
  game.levelNo += 1;
  if (!makeLevel()) return topicComplete();
  closeDialog();
  busy = false;
  renderGame();
}

function topicComplete() {
  const save = readSave();
  if (save && save.subjectKey === game.subjectKey && save.topicKey === game.topicKey) clearSave();
  speech.say(`Congratulations. You have completed ${game.topicName}.`);
  openDialog({
    title: "Congratulations!",
    body: `<p>You've completed <strong>${esc(cap(game.topicName))}</strong>: all ${topicList.length} words.</p>
           <div class="points-big">${fmt(game.score)}</div><p>points</p>`,
    buttons: [{ label: "Choose a topic", action: () => { game = null; closeDialog(); renderSubjects(); } }],
  });
}

// ---------- menu and dialogs ----------

function openMenu() {
  if (!game || $("screenGame").hidden || !$("overlay").hidden) return;
  $("menu").hidden = false;
  $("menuBtn").setAttribute("aria-expanded", "true");
  $("speechToggle").focus();
}
function closeMenu() {
  $("menu").hidden = true;
  $("menuBtn").setAttribute("aria-expanded", "false");
}

function updateSpeechPill() {
  const pill = $("speechState");
  pill.textContent = speech.on ? "On" : "Off";
  pill.classList.toggle("off", !speech.on);
}

function openDialog({ title, body, buttons }) {
  $("dialogTitle").textContent = title;
  $("dialogBody").innerHTML = body || "";
  const row = $("dialogButtons");
  row.innerHTML = "";
  for (const b of buttons) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "big-btn" + (b.quiet ? " quiet" : "");
    el.textContent = b.label;
    el.addEventListener("click", b.action);
    row.appendChild(el);
  }
  $("overlay").hidden = false;
  row.firstChild?.focus();
}
function closeDialog() { $("overlay").hidden = true; }

// Asks whether to save before leaving the game.
function askSave(then) {
  closeMenu();
  const leave = () => { speech.stop(); clearAnnouncements(); closeDialog(); game = null; then(); };
  openDialog({
    title: "Save your progress?",
    body: `<p>You can resume ${esc(game.english ? "English" : cap(game.topicName))} from level ${game.levelNo} next time. This replaces any game saved before.</p>`,
    buttons: [
      { label: "Save", action: () => {
        if (writeSave()) leave();
        else openDialog({ title: "Could not save", body: "<p>This browser is not allowing the game to save. Your progress will be lost if you leave.</p>",
          buttons: [{ label: "Leave anyway", action: leave }, { label: "Keep playing", quiet: true, action: closeDialog }] });
      } },
      { label: "Don't save", quiet: true, action: leave },
      { label: "Keep playing", quiet: true, action: closeDialog },
    ],
  });
}

function setupControls() {
  $("newGameBtn").addEventListener("click", renderSubjects);
  $("resumeBtn").addEventListener("click", resumeGame);
  $("subjectsBack").addEventListener("click", renderStart);
  $("topicsBack").addEventListener("click", renderSubjects);
  $("menuBtn").addEventListener("click", (e) => { e.stopPropagation(); $("menu").hidden ? openMenu() : closeMenu(); });
  document.addEventListener("pointerdown", (e) => { if (!$("menu").hidden && !$("menu").contains(e.target) && e.target !== $("menuBtn")) closeMenu(); });
  $("speechToggle").addEventListener("click", () => { speech.on = !speech.on; updateSpeechPill(); });
  $("exitBtn").addEventListener("click", () => askSave(renderSubjects));
  $("quitBtn").addEventListener("click", () => askSave(renderStart));
  $("shuffleBtn").addEventListener("click", shuffleWheel);
  $("clueBtn").addEventListener("click", useClue);
  $("boxClose").addEventListener("click", closeAnnouncement);
  new ResizeObserver(() => { layoutGrid(); if (game?.level) { placeLetters(); drawTrail(); } }).observe($("app"));
}

// ---------- start up ----------

async function main() {
  startBirds($("birds"));
  setupControls();
  setupWheel();
  updateSpeechPill();
  try {
    await load();
  } catch (err) {
    console.error(err);
    const note = $("loadNotice");
    note.hidden = false;
    note.textContent = "The game's word lists could not be loaded. Open the game from its web address, not as a file on this computer.";
    $("newGameBtn").disabled = true;
    return;
  }
  renderStart();
}

// for automated testing only
window.wordscapeTest = {
  get game() { return game; },
  submit: (word) => handleWord(word),
  clue: () => useClue(),
  get speechOn() { return speech.on; },
};

main();
