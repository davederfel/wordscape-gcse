// Reads words and clues aloud with the browser's built-in voice (British English if available).

import { SETTINGS } from "./config.js";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
let voice = null;
let enabled = SETTINGS.speechOnAtStart;

function chooseVoice() {
  if (!synth) return;
  const voices = synth.getVoices();
  const lang = SETTINGS.voiceLanguage.toLowerCase();
  const local = voices.filter((v) => v.lang.toLowerCase().replace("_", "-") === lang);
  const prefer = ["natural", "neural", "google uk english female", "libby", "sonia", "serena", "kate", "martha", "daniel"];
  voice = prefer.map((p) => local.find((v) => v.name.toLowerCase().includes(p))).find(Boolean)
    || local[0]
    || voices.find((v) => v.lang.toLowerCase().startsWith("en"))
    || null;
}

if (synth) {
  chooseVoice();
  synth.addEventListener?.("voiceschanged", chooseVoice);
}

export const speech = {
  available: !!synth,
  get on() { return enabled; },
  set on(value) {
    enabled = value;
    if (!value) synth?.cancel();
  },

  // Speaks one piece of text after anything already queued. Calls done() when it finishes.
  say(text, done) {
    if (!synth || !enabled || !text) { done?.(); return; }
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || SETTINGS.voiceLanguage;
    u.rate = 0.92;
    let finished = false;
    const finish = () => { if (!finished) { finished = true; done?.(); } };
    u.onend = finish;
    u.onerror = finish;
    // some browsers never fire onend; give up waiting after a generous time
    setTimeout(finish, 1500 + text.length * 120);
    synth.speak(u);
  },

  stop() { synth?.cancel(); },
};
