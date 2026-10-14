# Wordscape GCSE: specification

This document records how the game should look and work, as described by Dave. It is the reference for the first build.

**Status: incomplete. Do not build until Dave says to.** The screen layout, game logic and subject folder layout are recorded below, and the english word lists are in place. Subject and topic word lists and images are still to come, and the open questions in each section are not yet settled.

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

Background notes on how Wordscapes works are in section 8.

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

**Open questions**

- Are the birds animated (moving across the sky) or part of a still image?
- Should the game also be laid out for a wide screen (laptop or desktop), or for phone-shaped screens only?

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

**Seen in the reference screenshot**

- Two lines of text: a level number on the first line ("LEVEL 9") and a second label beneath it ("SHINE 1").

**Open questions**

- How do level, subject and topic relate? For example, is each level one subject, or does each topic have several levels?
- What should the two lines show (for example, level number on the first line and subject or topic on the second)?

### B. Score / points

**Seen in the reference screenshot**

- A coin icon with a number beside it (150).

**Open questions**

- Is this one figure that is both the player's score and the points spent on clues?

### C. Menu

**Seen in the reference screenshot**

- Two round buttons in this area: a back arrow and a dictionary button ("Aa").

**Open questions**

- What does the menu contain?

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

- A clue costs 10 points.

**Seen in the reference screenshot**

- A round button with a light-bulb icon and the cost shown beneath it.

**Open questions**

- What does a clue do: reveal a letter in the grid, show a written hint or definition, or something else?

### G. Letter wheel

**Seen in the reference screenshot**

- A large, pale, see-through circle with the level's letters spaced evenly around it (four letters in the example).

---

## 4. Game logic

**Stated**

- There is no timer.
- The player can give up on a level if they cannot carry on.
- Each correct word scores +10 points.
- A bonus word scores +20 points. Any English word counts as a bonus word.
- A clue costs 10 points (see area F in section 3).
- The letter count starts at 3 and goes up to the length of the longest word provided in the subject area.
- Gaps are filled with any English word, to make the game work.
- English is the default.
- Example of gap filling: if a subject and topic have only two 3-letter words, but the game wants to offer a four-word game, it takes the other two words from the English dictionary.
- When a topic is chosen, the game uses all of that topic's words, then fills gaps from the English words as needed.
- The wheel has the letters that make all the words in the level.
- The wheel has a maximum of 7 letters.

**How this is read (to be confirmed by Dave)**

- A level contains several topic words. The wheel holds every letter needed to spell each of them, so it can have more letters than any one word. For example, ION and GAS together need the six letters A, G, I, N, O, S.
- Gap-filling words are English words that can be made from the letters already in the wheel.
- Levels run by word length, starting with the topic's 3-letter words and working up to its 7-letter words.

**Open questions**

1. **Topic words longer than 7 letters.** With a 7-letter wheel, a word of 8 letters or more cannot be spelled, so it cannot appear in the game. Many GCSE terms are longer than this (for example FRACTION, MEMBRANE, EQUATION). This also replaces the earlier rule that the letter count runs "up to the longest word in the subject area". Are longer terms simply left out, or should they be handled another way?
2. **How topic words are grouped into levels.** A 7-letter wheel usually has room for one topic word, and sometimes two short ones (ION and GAS need 6 letters; CELL and GENE need 7; CELL, GENE and ATOM need 11). So a topic's words will be spread over a run of levels, each with one or two topic words and the rest filled from English. How should the game choose which words share a level?
3. **Giving up.** What happens when the player gives up: are the answers shown, are any points lost, and does the game move to the next level?
4. **Bonus words score more than puzzle words.** A bonus word (+20) is worth twice a correct puzzle word (+10), so the off-topic words earn more than the topic's own. Is that intended?
5. **How many words a level offers.** In the example the game "wants to offer a four-word game". How is the number of words in a level decided?
6. **Topic terms that are not a single word.** How should terms with a space or hyphen be handled (for example "cell wall")?
7. **Completing a level.** Are any points awarded for finishing a level, beyond the points for each word?

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

**Proposed (not yet confirmed by Dave)**

- Each topic's file is called `words.txt` and holds one word per line.
- Dave may supply the words as a spreadsheet with one row per word and the columns Subject, Topic, Word and (optionally) Clue. The topic files are then produced from it. The template is [templates/wordscape-gcse-words.xlsx](../templates/wordscape-gcse-words.xlsx).
- Topic words are single words of 3 to 7 letters, using the letters A to Z only.
- Two English files instead of one: a puzzle should only ask for words a pupil is likely to know, but a pupil who finds a less common word should still get credit.

**Open questions**

- If a clue shows a written hint or definition (see area F), each topic word will need its hint stored beside it in the words file.
- Subject and topic word lists are still to be provided by Dave.

---

## 6. Images

To be provided by Dave. Each level/topic needs its own landscape background (see section 2).

---

## 7. Reference material

Dave's two reference images are held in the "wordscape GCSE" project files:

- `Screenshot_20261011_124821_Wordscapes.jpg`: the reference screen.
- `Screenshot_20261011_124821_Wordscapes - area.jpg`: the same screen with areas A to G marked.

They are not stored in this repository, because the repository is public and the screenshot is taken from a commercial app.

---

## 8. Background: how Wordscapes works

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
- 2026-10-11: Recorded the inspiration (Wordscapes by PeopleFun) and the working name. Added background notes on how Wordscapes works (section 8).
- 2026-10-11: Recorded the game logic (section 4) and the subjects and topics folder layout (section 5). Added the english word lists under `subjects/english/`.
- 2026-10-11: Recorded that a level uses all of a topic's words and that the wheel holds the letters for all of them. Added the wheel-size question, with test figures.
- 2026-10-11: Recorded the 7-letter maximum for the wheel. Replaced the wheel-size question with its consequences (longer terms, grouping words into levels). Added the proposed spreadsheet layout for word lists.
- 2026-10-14: Added the word list spreadsheet template.
