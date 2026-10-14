"""Build the topic word files from the word list spreadsheet.

Usage:
    python tools/build_topics.py subjects/wordscape-gcse-words.xlsx

Reads the Words sheet (Subject, Topic, Word, Clue) and writes one file per topic:
    subjects/<subject>/<topic>/words.csv   (columns: word, clue)

Folder names are the subject and topic in lower case, with spaces replaced by hyphens
("Digital Media" becomes "digital-media"). Words are stored in lower case.

Rows that fail the spreadsheet's rules (3 to 7 letters, A to Z only, subject and topic
filled in, no duplicate within a topic) are skipped and listed on screen.
Existing topic folders under subjects/ (other than english) are rebuilt from scratch.
"""
import csv
import re
import shutil
import sys
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS = ROOT / "subjects"
WORD = re.compile(r"^[a-z]{3,7}$")


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.strip().lower()).strip("-")


def main(path):
    ws = load_workbook(path, read_only=True)["Words"]
    topics, skipped = {}, []
    for n, row in enumerate(ws.iter_rows(min_row=2, max_col=4, values_only=True), start=2):
        subject, topic, word, clue = [("" if v is None else str(v).strip()) for v in row]
        if not word:
            continue
        w = word.lower()
        if not subject or not topic:
            skipped.append((n, word, "subject or topic missing"))
        elif not WORD.match(w):
            skipped.append((n, word, "must be 3 to 7 letters, A to Z only"))
        elif w in topics.setdefault((slug(subject), slug(topic)), {}):
            skipped.append((n, word, "duplicate in this topic"))
        else:
            topics[(slug(subject), slug(topic))][w] = clue

    for d in SUBJECTS.iterdir():
        if d.is_dir() and d.name != "english":
            shutil.rmtree(d)
    for (subject, topic), words in sorted(topics.items()):
        if not words:
            continue
        folder = SUBJECTS / subject / topic
        folder.mkdir(parents=True, exist_ok=True)
        with (folder / "words.csv").open("w", newline="", encoding="utf-8") as fh:
            out = csv.writer(fh)
            out.writerow(["word", "clue"])
            for w, c in words.items():
                out.writerow([w, c])
        print(f"{subject}/{topic}: {len(words)} words")
    for n, word, why in skipped:
        print(f"Skipped row {n} ({word}): {why}")


if __name__ == "__main__":
    main(sys.argv[1])
