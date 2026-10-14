"""List the background images so the game knows which ones exist.

Usage:
    python tools/build_backgrounds.py

A web page cannot look inside folders by itself, so the game reads this list instead.
Run this tool after adding, removing or renaming any background image.

It looks in:
    assets/backgrounds/                          the default set, used by every topic
    subjects/<subject>/<topic>/backgrounds/      a topic's own set (optional)
    subjects/english/backgrounds/                the english subject's own set (optional)

A topic with its own backgrounds folder uses only those images. Every other topic uses
the default set. Images are used in alphabetical order of file name, moving to the next
image at each new level and starting again after the last one.

It writes assets/backgrounds/backgrounds.json.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT = ROOT / "assets" / "backgrounds"
SUBJECTS = ROOT / "subjects"
TYPES = {".jpg", ".jpeg", ".png", ".webp"}


def images(folder):
    return [p.relative_to(ROOT).as_posix() for p in sorted(folder.iterdir(), key=lambda p: p.name.lower())
            if p.is_file() and p.suffix.lower() in TYPES]


def main():
    data = {"default": images(DEFAULT), "topics": {}}
    if not data["default"]:
        raise SystemExit("No images found in assets/backgrounds/. The game needs at least one.")
    own = [SUBJECTS / "english" / "backgrounds"] + sorted(SUBJECTS.glob("*/*/backgrounds"))
    for folder in own:
        if not folder.is_dir():
            continue
        key = folder.parent.relative_to(SUBJECTS).as_posix()
        found = images(folder)
        if found:
            data["topics"][key] = found
    out = DEFAULT / "backgrounds.json"
    out.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Default set: {len(data['default'])} images")
    for key, found in data["topics"].items():
        print(f"{key}: {len(found)} images of its own")
    print(f"Written {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
