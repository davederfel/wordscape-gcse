// Game settings. Change these after testing; nothing else needs editing.

export const SETTINGS = {
  maxWheelLetters: 7,     // most letters on the wheel; topic words longer than this are not used
  maxWordsPerLevel: 8,    // most words in one level, so the grid fits on screen
  minWordLength: 3,       // shortest word that counts

  pointsPerWord: 10,      // a correct word on the grid
  pointsPerBonus: 20,     // a real English word made from the wheel that is not on the grid
  pointsPerLevel: 1000,   // extra points for completing a level
  clueCost: 10,           // points taken for each press of the clue button

  clueReadEvery: 3,       // every 3rd clue press also reads a clue aloud (and shows it)
  wordSayEvery: 5,        // every 5th clue press also says a word aloud (not shown)

  speechOnAtStart: true,
  voiceLanguage: "en-GB",
  maxGridSize: 11,        // largest grid, in tiles, across or down
};

// How a level grows. Level 1 has one word, level 2 two, then the count and the
// wheel size rise gradually to the maximums above.
export function wordsForLevel(level) {
  if (level <= 2) return level;
  return Math.min(SETTINGS.maxWordsPerLevel, 2 + Math.ceil((level - 2) / 2));
}

export function wheelSizeForLevel(level) {
  if (level <= 2) return 3;
  return Math.min(SETTINGS.maxWheelLetters, 3 + Math.floor((level - 1) / 2));
}
