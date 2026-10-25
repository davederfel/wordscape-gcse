"""Write a short meaning for every English word the game can use, from WordNet.

Usage:
    python tools/build_meanings.py PATH_TO_NLTK_DATA_FOLDER

Needs the nltk package and the WordNet 3.0 data, which NLTK downloads with
    python -c "import nltk; nltk.download('wordnet', download_dir='nltk_data')"
(behind a proxy, set NLTK_ALLOW_PROXIED_URLOPEN=1 first). Pass that nltk_data folder.

For each word in subjects/english/dictionary.txt (which includes every word in words.txt) it
picks the word's most common meaning in WordNet. A word that is a form of another word, such
as "cats" or "walked", gets the meaning of the base word, introduced as "Plural of cat: ...".
British spellings missing from WordNet are looked up under the American spelling.

Writes subjects/english/meanings/a.json ... z.json ({word: meaning}); the game loads a
letter's file when it needs a meaning. Words with no WordNet entry are left out, and the
game shows them without a meaning. Hand-written meanings in
subjects/english/meanings-extra.csv (columns word, meaning) take priority over WordNet.
"""
import csv
import json
import re
import sys
from pathlib import Path

import nltk

ROOT = Path(__file__).resolve().parent.parent
ENGLISH = ROOT / "subjects" / "english"
POS_ORDER = {"n": 0, "v": 1, "a": 2, "s": 2, "r": 3}


def tidy(gloss):
    gloss = gloss.split("; ")[0].strip().rstrip(";").strip()   # first sense of the definition only
    gloss = re.sub(r"\s+", " ", gloss)
    gloss = re.sub(r"^(\([^)]*\)\s*)+", "", gloss)          # drop labels such as "(botany)"
    return gloss[:1].upper() + gloss[1:] if gloss else ""


def best_synset(wn, lemma, pos=None):
    """The synset where this word is used most often (WordNet's tagged counts); ties go to the first listed."""
    best, best_key = None, None
    for i, s in enumerate(wn.synsets(lemma, pos=pos)):
        names = [l for l in s.lemmas() if l.name().lower() == lemma]
        if not names:
            continue
        try:
            count = sum(l.count() for l in names)
        except Exception:
            count = 0
        key = (-count, POS_ORDER.get(s.pos(), 9), i)
        if best_key is None or key < best_key:
            best, best_key = s, key
    return best, (-best_key[0] if best_key else 0)


def form_label(word, base, pos):
    if pos == "n":
        return "Plural of"
    if pos == "v":
        if word.endswith("ing"):
            return "The -ing form of"
        if word.endswith("s") and not word.endswith("ss"):
            return "A form of"
        return "Past tense of"
    if pos in ("a", "s"):
        if word.endswith("est"):
            return "Most"
        if word.endswith("er"):
            return "More"
    return "A form of"


def american(word):
    """Likely American spellings of a British word, for looking up WordNet."""
    out = []
    for a, b in [("our", "or"), ("ise", "ize"), ("ised", "ized"), ("ising", "izing"), ("ises", "izes"),
                 ("yse", "yze"), ("tre", "ter"), ("tres", "ters"), ("ogue", "og"), ("ae", "e"), ("oe", "e"),
                 ("ll", "l"), ("ence", "ense"), ("ey", "y")]:
        if a in word:
            out.append(word.replace(a, b))
    return out


def meaning(wn, word):
    own, own_count = best_synset(wn, word)

    # forms of another word: cats -> cat, walked -> walk, went -> go, bigger -> big
    forms = []
    for pos in ("n", "v", "a", "r"):
        for base in wn._morphy(word, pos):
            if base == word:
                continue
            b, count = best_synset(wn, base, pos)
            if b:
                forms.append((count, POS_ORDER[pos], base, pos, b))
    if word.endswith("s") and not word.endswith("ss") and any(f[3] == "n" for f in forms):
        forms = [f for f in forms if f[3] == "n"]          # "sages" is more likely the plural of sage than a form of sag
    forms.sort(key=lambda x: (-x[0], x[1]))
    form = forms[0] if forms else None

    # British spellings that WordNet mostly lists under the American spelling
    alt = None
    for a in american(word):
        s, count = best_synset(wn, a)
        if s and (alt is None or count > alt[1]):
            alt = (s, count)

    use_form = form and (not own or (own_count == 0 and form[0] > 0) or form[0] > 3 * max(own_count, 1))
    if use_form:
        _, _, base, pos, b = form
        gloss = tidy(b.definition())
        return f"{form_label(word, base, pos)} {base}: {gloss[:1].lower() + gloss[1:]}"
    if alt and (not own or alt[1] > 3 * max(own_count, 1)):
        return tidy(alt[0].definition())
    if own:
        return tidy(own.definition())
    return ""


def main(nltk_data):
    nltk.data.path.insert(0, str(Path(nltk_data).resolve()))
    from nltk.corpus import wordnet as wn
    wn.ensure_loaded()
    words = sorted(set((ENGLISH / "dictionary.txt").read_text().split()) | set((ENGLISH / "words.txt").read_text().split()))
    extra = {}
    extra_file = ENGLISH / "meanings-extra.csv"
    if extra_file.exists():
        for row in csv.DictReader(extra_file.open(encoding="utf-8")):
            if row.get("word") and row.get("meaning"):
                extra[row["word"].strip().lower()] = row["meaning"].strip()
    out = {}
    for w in words:
        m = extra.get(w) or meaning(wn, w)
        if m:
            out[w] = m
    folder = ENGLISH / "meanings"
    folder.mkdir(exist_ok=True)
    for f in folder.glob("*.json"):
        f.unlink()
    for letter in "abcdefghijklmnopqrstuvwxyz":
        part = {w: m for w, m in out.items() if w[0] == letter}
        (folder / f"{letter}.json").write_text(json.dumps(part, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    puzzle = set((ENGLISH / "words.txt").read_text().split())
    have = sum(1 for w in puzzle if w in out)
    print(f"Meanings for {len(out)} of {len(words)} words; {have} of {len(puzzle)} puzzle words")
    return out, puzzle


if __name__ == "__main__":
    main(sys.argv[1])
