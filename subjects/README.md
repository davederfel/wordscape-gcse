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

1. Add rows to the spreadsheet `wordscape-gcse-words.xlsx`: Subject, Topic, Word and an optional Clue. The spreadsheet checks each word as you type. A blank copy is in [templates/](../templates/wordscape-gcse-words.xlsx).
2. Run `python tools/build_topics.py subjects/wordscape-gcse-words.xlsx`. This rebuilds every topic folder from the spreadsheet.

The spreadsheet is the master copy. Edit it, not the topic files, or the next rebuild will overwrite your changes.

## Folder names

Folder names are the subject and topic in lower case, with spaces replaced by hyphens. For example, the topic "Digital Media" is stored in `digital-media`.

## The topic file

Each topic folder has a `words.csv` file with two columns, `word` and `clue`. Words are stored in lower case. A clue may be blank.

```
word,clue
raster,An image made of tiny coloured squares called pixels
vector,An image made from lines and shapes that can be resized without losing quality.
```

## The english subject

`english` is the default subject and has no topics. Its words are also used to fill gaps in other subjects' levels and to accept bonus words. See [english/README.md](english/README.md).
