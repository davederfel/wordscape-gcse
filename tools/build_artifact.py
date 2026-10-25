"""Prepare the game for publishing as a Claude artifact (a hosted web page).

Usage:
    python tools/build_artifact.py

Writes dist/play.html (index.html without its outer page wrapper, which the artifact
host adds itself) and dist/files.json (every file the game loads, for the publish step).
The game's own files are published at the same paths they have in this repository.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


def main():
    html = (ROOT / "index.html").read_text()
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
    head = re.sub(r'\s*<meta charset="utf-8">', "", head)
    head = re.sub(r'\s*<meta name="viewport"[^>]*>', "", head)
    DIST.mkdir(exist_ok=True)
    (DIST / "play.html").write_text(head.strip() + "\n" + body.strip() + "\n")

    files = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "src").glob("*.js"))
    files += ["subjects/topics.json", "subjects/english/words.txt", "subjects/english/dictionary.txt"]
    files += sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "subjects/english/meanings").glob("*.json"))
    index = json.loads((ROOT / "subjects/topics.json").read_text())
    files += [t["file"] for s in index["subjects"] for t in s["topics"]]
    bgs = json.loads((ROOT / "assets/backgrounds/backgrounds.json").read_text())
    files += ["assets/backgrounds/backgrounds.json"] + bgs["default"]
    files += [p for imgs in bgs["topics"].values() for p in imgs]
    missing = [f for f in files if not (ROOT / f).exists()]
    if missing:
        raise SystemExit(f"Missing files: {missing}")
    (DIST / "files.json").write_text(json.dumps({f: f for f in files}, indent=2) + "\n")
    print(f"dist/play.html and {len(files)} files ready to publish")


if __name__ == "__main__":
    main()
