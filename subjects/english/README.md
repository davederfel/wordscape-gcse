# English word lists

The default subject, "english". It has no topics. Its words are also used to fill gaps in other subjects' levels.

All words are British English, 3 to 7 letters, lower case, one per line, in alphabetical order.

| File | Words | Used for |
|------|-------|----------|
| `words.txt` | 17,644 | Everyday words. The game may place these in a puzzle, for the english subject and to fill gaps in other subjects. |
| `dictionary.txt` | 36,198 | A wider list, which includes every word in `words.txt`. Any word in it counts as a valid English word, so it is used to accept bonus words. |

Words by length:

| Letters | `words.txt` | `dictionary.txt` |
|---------|-------------|------------------|
| 3 | 472 | 781 |
| 4 | 1,845 | 3,106 |
| 5 | 3,412 | 6,332 |
| 6 | 5,242 | 10,668 |
| 7 | 6,673 | 15,311 |

Two files are used because the two jobs need different lists. A puzzle should only ask for words a pupil is likely to know, but a pupil who finds a less common word should still be given credit for it.

Both files are plain text and can be edited by hand. To remove a word, delete its line. To add one, add a line. A word added to `words.txt` should also be added to `dictionary.txt`.

## Where the words come from

The lists are taken from SCOWL (Spell Checking Oriented Word Lists), version 2020.12.07, by Kevin Atkinson: <http://wordlist.aspell.net/>. SCOWL may be used, copied, modified and distributed for any purpose, provided its copyright notice is kept. The notice is in [SCOWL-LICENCE.txt](SCOWL-LICENCE.txt).

SCOWL grades words by how common they are, from size 10 (the most common) to size 95.

- `words.txt` uses sizes 10 to 35, with British spellings.
- `dictionary.txt` uses sizes 10 to 70, with British spellings. It accepts both "-ise" and "-ize" endings.

## What was left out

- Names and other words with a capital letter, abbreviations, and words with an apostrophe, hyphen or accent.
- American-only spellings (for example "color" and "center").
- Offensive words. Swearing, slurs, crude sexual slang and words for sexual violence were removed from both files (237 words).
- From `words.txt` only: a further group of words that are proper English but unsuitable to show at random in a school game, such as sexual and anatomical terms, drug names and mild insults. These stay in `dictionary.txt`, so they are accepted if a pupil enters them, but the game will never put them in a puzzle. In total 156 words were removed from `words.txt`.

The offensive words were found by comparing the lists with three published lists of offensive words, then reviewing each match by hand, and adding British terms those lists missed. The list of removed words is not stored in this repository.

## What was added

Three words that the source does not include at these sizes were added to both files: `maths`, `sulfur` (the spelling used in GCSE science; `sulphur` is also included) and `app`.

## Known limits

- The lists stop at 7 letters. Subject words can be longer; these lists are only for the english subject, gap filling and bonus words.
- `words.txt` includes some uncommon forms of common words (for example "eagerer"). Delete any that are not wanted.
- No filter catches everything. If an unsuitable word turns up, delete its line from both files.
