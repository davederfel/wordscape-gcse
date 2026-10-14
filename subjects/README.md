# Subjects

This folder holds the words the game uses. Each subject is a folder. Each topic is a folder inside its subject, with a file of words.

```
subjects/
  wordscape-gcse-words.xlsx   the master word list (Dave's spreadsheet)
  english/                    the default subject: no topics
    words.txt
    dictionary.txt
  computer/
    digital-media/
      words.csv
  maths/
    algebra/
      words.csv
  science/
    cells/
      words.csv
```

## How words are added

1. Add rows to the spreadsheet `wordscape-gcse-words.xlsx`: Subject, Topic, Word, and optionally a Clue and a Say as. The spreadsheet checks each word as you type. A blank copy is in [templates/](../templates/wordscape-gcse-words.xlsx).
2. Run `python tools/build_topics.py subjects/wordscape-gcse-words.xlsx`. This rebuilds every topic folder from the spreadsheet.

The spreadsheet is the master copy. Edit it, not the topic files, or the next rebuild will overwrite your changes.

## Folder names

Folder names are the subject and topic in lower case, with spaces replaced by hyphens. For example, the topic "Digital Media" is stored in `digital-media`.

## The topic file

Each topic folder has a `words.csv` file with three columns: `word`, `clue` and `say_as`. Words are stored in lower case. The clue and say_as may be blank. `say_as` is how the voice should speak the word, where it would otherwise say it wrongly.

```
word,clue,say_as
raster,An image made of tiny coloured squares called pixels,
bmp,An uncompressed image file format that produces large file sizes but good image quality,B. M. P.
```

## The english subject

`english` is the default subject and has no topics. Its words are also used to fill gaps in other subjects' levels and to accept bonus words. See [english/README.md](english/README.md).
