# Subjects

This folder holds the words the game uses. Each subject is a folder. Each topic is a folder inside its subject, with a file of words.

```
subjects/
  english/              the default subject: no topics
    words.txt
    dictionary.txt
  science/              a subject
    cells/              a topic
      words.txt
    forces/
      words.txt
  maths/
    algebra/
      words.txt
```

"science", "maths" and the topic names above are examples only. Only `english` exists so far.

## Adding a subject or topic

1. Create a folder for the subject (if it does not exist), for example `science`.
2. Inside it, create a folder for the topic, for example `cells`.
3. Inside the topic folder, create a file called `words.txt`.

## The words file (proposed format, to be confirmed)

- Plain text, one word per line.
- Capital or small letters: the game treats them the same.
- Blank lines are ignored.

```
cell
nucleus
membrane
enzyme
```

## The english subject

`english` is the default subject and has no topics. Its words are also used to fill gaps in other subjects' levels and to accept bonus words. See [english/README.md](english/README.md).
