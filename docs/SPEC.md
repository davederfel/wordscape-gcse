# Wordscape GCSE: specification

This document records how the game should look and work, as described by Dave. It is the reference for the first build.

**Status: ready for review. Do not build until Dave says to.** All open questions have been answered. Points marked "How this is read (to be confirmed by Dave)" are Claude's readings of what Dave said and should be checked before the build. More topic words can be added at any time.

Each section separates three things:

- **Stated**: what Dave has said the game should do.
- **Seen in the reference screenshot**: details visible in the reference image that Dave has not yet confirmed he wants.
- **Open questions**: points to settle before building.

---

## 1. Overview

**Stated**

- A learning game that runs in a web browser.
- Subjects, and topics within each subject, set the word list.
- The game has levels and points.
- Dave will supply the visual guide, subjects, topics, words, images and some of the game logic.
- The game is inspired by "Wordscapes" by PeopleFun (on Google Play).
- The working name, for now, is "wordscape GCSE".

**Proposed (not yet confirmed by Dave)**

- Wordscapes is used as inspiration for how the game plays and feels only. The game's words, images and code are original, and nothing is taken from the Wordscapes app itself (including its installation file).

Background notes on how Wordscapes works are in section 9.

---

## 2. Look and feel

**Stated**

- The background is the reason for the name "wordscape": a lovely landscape, with little birds flying in the sky.
- The visuals are very soft.
- The game controls and information sit on top of the landscape. They are clear to read, but see-through, so the landscape shows behind them.
- Every level/topic has a different landscape background.

**Seen in the reference screenshot**

- An orange sunset over a lake, with hills on the horizon and a few small birds in the sky.
- A tall, phone-shaped (portrait) screen.
- Round, dark, semi-transparent buttons with white icons.

- The landscape is a long-distance scenic view.
- A small flock of birds moves slowly around in the background.

- The layout is portrait, like a phone.

**How this is read (to be confirmed by Dave)**

- On a laptop or desktop, the game shows as a phone-shaped portrait column in the middle of the screen, with the landscape filling the space either side.

---

## 3. Screen layout

The screen has seven areas, labelled A to G on Dave's marked-up screenshot.

| Area | Position | Purpose (stated) |
|------|----------|------------------|
| A | Top centre | Level information: level 1 (maths), level 2, and so on |
| B | Top right | Score / points |
| C | Top left | Menu |
| D | Upper half, the largest area | Main area, where the crossword-style words appear |
| E | Left, above the letter wheel | Spin (rearrange) the letters in the letter wheel |
| F | Right, above the letter wheel | Clue: spend 10 points to get a clue |
| G | Bottom centre, a large circle | The letter wheel: the letters for this level |

### A. Level information

**Stated**

- Two lines of text: the topic on the first line, the level number on the second.

**Seen in the reference screenshot**

- Two lines of text: a level number on the first line ("LEVEL 9") and a second label beneath it ("SHINE 1").

### B. Score / points

**Seen in the reference screenshot**

- A coin icon with a number beside it (150).

**Stated**

- Shows the player's score. Clues are paid for from this score (see area F).

### C. Menu

**Seen in the reference screenshot**

- Two round buttons in this area: a back arrow and a dictionary button ("Aa").

**Stated**

- The menu is at the top left. It contains:
  - Speech on/off.
  - Exit back to the subject choice.
  - Quit the whole game.

- Speech is on when the game starts.
- When the player quits, the game asks whether they want to save. A saved game can be resumed later (see section 4).

### D. Main area (crossword-style words)

**Seen in the reference screenshot**

- Square tiles arranged as an interlocking crossword, with words running across and down and sharing letters.
- Words that have been found are shown on solid pink tiles with white letters.
- Other tiles are pale and see-through. Some are empty and some show a single dark letter.

### E. Spin the letters

**Seen in the reference screenshot**

- A round button with a "shuffle" icon (two crossing arrows).

### F. Clue

**Stated**

- A clue costs 10 points, taken from the player's score.
- The player must have the points to pay for it. The score cannot go below zero.
- Each press reveals one letter on the grid, chosen at random from the letters not yet solved.
- On every 3rd press, the game also reads a word's clue aloud (if one is set) and shows the clue text while it is spoken.
- On every 5th press, the game says a word aloud, but does not show it.
- The pattern keeps repeating: clue read at presses 3, 6, 9, 12 and so on; word said at presses 5, 10, 15 and so on.
- The press count runs across the whole topic. It does not restart at each new level.
- The clue read out, or word said, is always one that is not yet solved on the grid. A completed word is never used.
- If the player does not have the points, pressing the button shows the message "No points left to spend".

**Seen in the reference screenshot**

- A round button with a light-bulb icon and the cost shown beneath it.

**How this is read (to be confirmed by Dave)**

- Where more than one word is unsolved, one is chosen at random.
- Every press still reveals a letter, including the 3rd and 5th presses.
- When the letter just revealed completes the last unsolved word, there is nothing left to read out, so only the letter is revealed.
- When both fall due on the same press (15, 30 and so on), the clue is read first, then the word is said.
- The message shows whenever the score is under 10, even if it is not zero.

### G. Letter wheel

**Seen in the reference screenshot**

- A large, pale, see-through circle with the level's letters spaced evenly around it (four letters in the example).

---

## 4. Game logic

**Stated: playing a level**

- There is no timer.
- There is no give-up. A player who is stuck has to quit the game (see the menu, area C).
- Each correct word scores +10 points.
- Completing a level scores an extra +1,000 points.
- A bonus word scores +20 points. A bonus word is a word the player makes from the wheel's letters that is not on the grid but is in the English word list. For example, the grid expects TOP and the player tries POT.
- A clue costs 10 points (see area F in section 3). The score cannot go below zero.
- The wheel has the letters that make all the words in the level.
- The wheel has a maximum of 7 letters. This is a setting, not a fixed rule: it may be increased after testing.
- Topic words longer than the maximum are not used.
- Gaps are filled with English words, to make the game work. For example, if a topic has only two 3-letter words but the game wants a four-word level, it takes the other two from the English words.
- A topic word whose letters make no other words becomes an easy one-word level. For example, the wheel shows B, M and P, and the player learns the word BMP and what it means.
- English is the default subject. It has no end: its levels just keep going.
- Every topic word is a single word. Terms of two or more words are not used.

**Stated: levels and completing a topic**

- When a topic is chosen, the game uses all of that topic's words, filling gaps from the English words as needed.
- The number of words in a level grows as the levels go up: level 1 has one 3-letter word, level 2 has two 3-letter words, and then the mix gradually increases.
- A level has at most 8 words, so that it fits on screen. This is a setting and may change after testing.
- Levels start with 3-letter words. As the levels go up, they move gradually to a mix of 3- to 7-letter words.
- After that, levels keep going up, using new words.
- Topic words do not repeat.
- When every topic word has been used at least once and completed, the topic is complete. The game shows a congratulations message and returns to the start, to choose a topic.

**How this is read (to be confirmed by Dave)**

- A level can contain more than one topic word, as long as all of them fit on the wheel. For example, ION and GAS together need the six letters A, G, I, N, O, S.
- Gap-filling words are English words that can be made from the letters already in the wheel.
- Each level uses topic words that have not appeared before, so the number of levels in a topic depends on how many words it has.

**Stated: saving and resuming**

- Progress can be saved.
- When the player tries to quit, the game asks whether they want to save.
- When the game starts, the player can resume the saved game or choose a new game.

**How this is read (to be confirmed by Dave)**

- The saved game holds the topic, level and score, and which topic words have been used.
- There is one saved game at a time. Saving a new game replaces it.
- The save is kept in the browser on that device. It is not available on another device or another browser, and it is lost if the browser's site data is cleared.

**Points to note**

- With +1,000 for each level, a clue (10 points) costs very little after the first level, so from then on the clue button is effectively free. If clues are meant to be a real choice, the clue cost or the level bonus may need adjusting after testing.

**Stated: other screens**

- Besides the game screen, there is a start screen (resume or new game), a subject and topic choice, the save prompt on quitting, and the topic-complete congratulations.
- These use the same style as the game screen: soft, see-through panels over a landscape background.

---

## 5. Subjects, topics and word lists

**Stated**

- Subjects are folders, for example science and maths.
- Each subject folder has subfolders, one per topic.
- Each topic folder has a file of words to use.
- Dave creates these folders and files himself.
- There is a default subject called english. It has no topics, and the player can select it.
- The english words are also used to fill gaps in other subjects (see section 4).
- The English word source covers words of 3 to 7 letters.

**Provided**

- The layout is in place under [`subjects/`](../subjects/README.md).
- The english subject is in [`subjects/english/`](../subjects/english/README.md), with two files:
  - `words.txt`: 17,644 everyday words, which the game may place in a puzzle.
  - `dictionary.txt`: 36,198 words, used to decide whether a bonus word is a valid English word.
- Both are British English and have had offensive words removed. The source, licence and method are described in the english folder's README.

- Dave has provided a first set of words: computer / Digital Media (9 words), maths / algebra (36) and science / cells (2), each word with a clue. The master copy is `subjects/wordscape-gcse-words.xlsx`.

**Proposed (not yet confirmed by Dave)**

- Each topic's file is called `words.csv`, with three columns: `word`, `clue` and `say_as`.
- Dave may supply the words as a spreadsheet with one row per word and the columns Subject, Topic, Word and (optionally) Clue. The topic files are then produced from it. The template is [templates/wordscape-gcse-words.xlsx](../templates/wordscape-gcse-words.xlsx).
- Topic words are single words of 3 to 7 letters, using the letters A to Z only.
- Two English files instead of one: a puzzle should only ask for words a pupil is likely to know, but a pupil who finds a less common word should still get credit.



---

## 6. Spoken words and meanings

**Stated**

- When the player gets a word correct, the game says the word out loud, then reads out its clue. For example, on completing CELL it says "Cell", then "The basic unit of all living things".
- All words are read out: topic words, English fill words and bonus words.
- A word with no clue is just said aloud.
- Words the voice would say wrongly have a "Say as" entry in the word spreadsheet. For example, BMP is read out as its letters: "B. M. P."
- The speech on/off button is in the menu at the top left (see area C).
- This happens while the word is animated, drawing and filling in on the grid.
- The purpose is for the player to hear how the word is said correctly and what it means.

**Proposed (not yet confirmed by Dave)**

- Speech uses the browser's built-in voice, set to British English. This needs no recorded audio files, but the voice sounds different on different devices and browsers.
- The "Say as" column is optional and filled in only where needed. Entries added so far: BMP as "B. M. P.", SVG as "S. V. G." and JPG as "J. P. G.". GIF has none and is said as written. Dave to check these.

**Points to note**

- English fill and bonus words come from the word lists, which have no "Say as" column. If the voice says one of them wrongly, it can only be fixed by removing the word from the list.

---

## 7. Images

**Stated**

- Claude supplies the background images for the first version.
- The backgrounds are an element Dave controls as the developer: the folder structure lets him swap images over and supply his own as needed.

**Provided**

- A default set of eight original landscape paintings in [`assets/backgrounds/`](../assets/backgrounds/README.md), generated by `tools/paint_backgrounds.py`. They are portrait (1080 x 1920), 50 to 70 KB each, with no birds in them, so there is no licence to track. Photo libraries could not be reached from Claude's workspace, so photos were not used.
- A topic can have its own set in `subjects/<subject>/<topic>/backgrounds/`. If that folder has images, the topic uses only those; otherwise it uses the default set.
- `tools/build_backgrounds.py` writes the list of images the game reads (`assets/backgrounds/backgrounds.json`). It must be run after adding, removing or renaming an image.
- The README in `assets/backgrounds/` explains how to swap images and what makes a good background.

**How this is read (to be confirmed by Dave)**

- The background changes at each new level, moving through the topic's images in alphabetical order of file name and starting again after the last one. This meets "every level/topic has a different landscape background" (section 2) for as many levels as there are images.

---

## 8. Reference material

Dave's two reference images are held in the "wordscape GCSE" project files:

- `Screenshot_20261011_124821_Wordscapes.jpg`: the reference screen.
- `Screenshot_20261011_124821_Wordscapes - area.jpg`: the same screen with areas A to G marked.

They are not stored in this repository, because the repository is public and the screenshot is taken from a commercial app.

---

## 9. Background: how Wordscapes works

These notes describe the app that inspired this game. **They are background, not requirements.** Nothing here is part of the game unless Dave confirms it in the sections above.

**From the Google Play listing and Wikipedia**

- A mix of word-connect, anagram and crossword play, described as relaxing, with landscape backgrounds that change as the player advances.
- The player finds every word that can be made from the letters in the circle at the bottom of the screen.
- A level has between 3 and 7 letters in the circle, depending on the level.
- Difficulty starts easy and increases.
- Each level allows unlimited tries. There is no timer and no way to fail a level.
- Bonus words (valid words that are not in the grid) earn extra coins.
- A separate daily puzzle offers extra rewards.

**From general knowledge of the app (to be checked against the app before relying on it)**

- Words are formed by dragging a finger from letter to letter around the circle, then letting go.
- A correct word fills its place in the crossword grid. A word that is not valid is rejected and nothing is lost.
- The shuffle button rearranges the letters in the circle and is free.
- The hint button costs coins and reveals one letter in the grid.
- Coins are awarded for completing a level.
- Levels are grouped into named packs, each with its own background. In the reference screenshot, "SHINE 1" is the pack name and the level's number within that pack.

The points this raised (timer, bonus words, letter count and scoring) have been answered by Dave and are recorded in section 4.

Sources: [Wordscapes on Google Play](https://play.google.com/store/apps/details?id=com.peoplefun.wordcross), [Wordscapes on Wikipedia](https://en.wikipedia.org/wiki/Wordscapes).

---

## Change log

- 2026-10-11: First version. Recorded the overview, look and feel, and screen layout (areas A to G).
- 2026-10-11: Recorded the inspiration (Wordscapes by PeopleFun) and the working name. Added background notes on how Wordscapes works (section 9).
- 2026-10-11: Recorded the game logic (section 4) and the subjects and topics folder layout (section 5). Added the english word lists under `subjects/english/`.
- 2026-10-11: Recorded that a level uses all of a topic's words and that the wheel holds the letters for all of them. Added the wheel-size question, with test figures.
- 2026-10-11: Recorded the 7-letter maximum for the wheel. Replaced the wheel-size question with its consequences (longer terms, grouping words into levels). Added the proposed spreadsheet layout for word lists.
- 2026-10-14: Added the word list spreadsheet template.
- 2026-10-14: Added Dave's first word list (47 words in three topics) and the tool that builds topic files from it. Topic files changed from `words.txt` to `words.csv` to hold clues.
- 2026-10-14: Recorded one-word levels for topic words with no fill words. Added spoken words and meanings (section 6).
- 2026-10-14: Recorded the clue button rules (area F), the sound on/off button (area C), and that all words are read aloud. Added the "Say as" column to the spreadsheet and topic files.
- 2026-10-14: Settled the clue button rules (area F) and the menu contents (area C).
- 2026-10-14: Recorded no give-up, level progression and topic completion, the level display (area A), the maximum letters as a setting, the meaning of bonus words, and the moving birds.
- 2026-10-14: Recorded saving and resuming, words per level (up to 8), the +1,000 level bonus, single-word terms only, speech on at start, the level display order and the portrait layout.
- 2026-10-14: Recorded the style of the other screens. Added the default backgrounds, the per-topic backgrounds folders and the background list tool (section 7).
- 2026-10-14: All open questions answered; specification ready for review.
