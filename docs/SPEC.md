# Wordscape GCSE: specification

This document records how the game should look and work, as described by Dave. It is the reference for the first build.

**Status: incomplete. Do not build yet.** The screen layout is recorded below. Game logic, subjects, topics, word lists and images are still to come.

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

To be provided by Dave.

---

## 5. Subjects, topics and word lists

To be provided by Dave.

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

## Change log

- 2026-10-11: First version. Recorded the overview, look and feel, and screen layout (areas A to G).
