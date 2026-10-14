# Wordscape GCSE

A browser-based word puzzle game for GCSE revision. The player picks a subject and a topic, which sets the words. Words are found by dragging across a letter wheel, and each word is read aloud with its meaning. The game has levels and points.

How the game should look and work is set out in the specification: [docs/SPEC.md](docs/SPEC.md).

## Status

First test build. Play it from the published test page, or run it locally (below).

## Playing it locally

The game is a plain web page with no build step, but it loads its word lists and pictures from files, so it must be opened through a web server rather than by double-clicking `index.html`. From this folder:

```
python -m http.server 8000
```

Then open <http://localhost:8000> in a browser.

On a laptop you can also type: letters to build a word, Backspace to remove a letter, Enter to try the word, Esc to clear it, and Space to spin the letters.

## What's where

| Folder | Contents |
|---|---|
| `index.html` | The page: layout and styles for every screen. |
| `src/config.js` | **Game settings**: maximum letters on the wheel, maximum words per level, points, clue cost and how levels grow. Change the numbers here after testing. |
| `src/engine.js` | Level planning (which words go in each level), the crossword layout and the scoring rules. |
| `src/app.js` | The screens, play, the clue button, saving and resuming. |
| `src/speech.js` | Reading words and clues aloud. |
| `src/birds.js` | The flock of birds in the sky. |
| `subjects/` | The words. See [subjects/README.md](subjects/README.md). |
| `assets/backgrounds/` | The landscape pictures. See [assets/backgrounds/README.md](assets/backgrounds/README.md). |
| `templates/` | A blank copy of the word list spreadsheet. |
| `tools/` | Scripts for rebuilding the word files, background list and published page. |
| `tests/` | Automated checks. |

## Changing the content

- **Words:** edit `subjects/wordscape-gcse-words.xlsx`, then run `python tools/build_topics.py subjects/wordscape-gcse-words.xlsx`.
- **Backgrounds:** add or remove images, then run `python tools/build_backgrounds.py`.
- **Settings:** edit `src/config.js`.

## Checking it still works

```
node tests/engine.test.mjs     # plays every topic to completion with 25 random seeds
python tests/play_test.py      # plays the game in a real browser (needs Playwright and Chromium)
```

## Publishing the test page

`python tools/build_artifact.py` writes `dist/play.html` and the list of files the page needs, for publishing as a Claude artifact.
