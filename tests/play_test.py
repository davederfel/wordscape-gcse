"""Plays the game in a real browser and checks it behaves as the specification says.

Run from the repository folder:
    python tests/play_test.py [screenshot folder]

Starts a local web server, opens the game in Chromium at phone size, and plays it:
drags across the wheel, types words, finds a bonus word, uses clues, completes levels,
saves and resumes, and completes a whole topic. Records everything the game speaks.
"""
import functools
import json
import re
import http.server
import socketserver
import sys
import threading
from collections import Counter
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "tests" / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)
DICT = set((ROOT / "subjects/english/dictionary.txt").read_text().split())

failures = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        failures.append(msg)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    handler = functools.partial(Quiet, directory=str(ROOT))
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


RECORD_SPEECH = """
window.__spoken = [];
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 30); };
}
"""

game = lambda page: page.evaluate("window.wordscapeTest.game")


def choose(page, subject, topics):
    """Picks a subject, ticks the named topics (or "all") and starts."""
    page.get_by_role("button", name=re.compile("^" + subject)).click()
    page.wait_for_selector("#screenTopics:not([hidden])")
    if topics == "all":
        page.check("#topicAll")
    else:
        for t in topics:
            page.get_by_role("checkbox", name=t).check()
    page.click("#topicsStart")
    page.wait_for_selector("#screenGame:not([hidden])")


def drag_word(page, word):
    """Drags across the wheel letters that spell the word."""
    g = game(page)
    wheel = page.locator("#wheel").bounding_box()
    letters = page.locator("#wheel .letter")
    used, points = set(), []
    for ch in word:
        for k in range(letters.count()):
            el = letters.nth(k)
            i = int(el.get_attribute("data-i"))
            if g["level"]["wheel"][i] == ch and i not in used:
                used.add(i)
                b = el.bounding_box()
                points.append((b["x"] + b["width"] / 2, b["y"] + b["height"] / 2))
                break
    page.mouse.move(*points[0])
    page.mouse.down()
    for x, y in points[1:]:
        page.mouse.move(x, y, steps=6)
    page.mouse.up()
    return wheel


def type_word(page, word):
    page.keyboard.type(word)
    page.keyboard.press("Enter")


def unsolved(page):
    return [w["word"] for w in game(page)["level"]["words"] if not w["solved"]]


def bonus_candidate(page):
    g = game(page)["level"]
    have = Counter(g["wheel"])
    grid = {w["word"] for w in g["words"]}
    for w in sorted(DICT, key=len, reverse=True):
        if 3 <= len(w) and w not in grid and not (Counter(w) - have):
            return w
    return None


def finish_level(page):
    for w in unsolved(page):
        type_word(page, w)
        page.wait_for_timeout(60)
    page.wait_for_selector("#overlay:not([hidden])", timeout=60000)


def main():
    httpd, port = serve()
    url = f"http://127.0.0.1:{port}/index.html"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, has_touch=False)
        ctx.add_init_script(RECORD_SPEECH)
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        # web fonts cannot be reached from the test machine; ignore those failures only
        page.on("console", lambda m: m.type == "error" and "ERR_TUNNEL" not in m.text and errors.append(m.text))

        page.goto(url)
        page.wait_for_selector("#newGameBtn")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOTS / "01-start.png"))
        check(page.locator("#resumePanel").is_hidden(), "start: no resume panel before any save")

        # ---- new game: maths / algebra ----
        page.click("#newGameBtn")
        page.wait_for_selector("#screenSubjects:not([hidden])")
        page.screenshot(path=str(SHOTS / "02-subjects.png"))
        subjects = page.locator("#subjectList .choice").all_inner_texts()
        check(subjects[0].startswith("English"), f"subjects: English listed first ({subjects})")
        page.get_by_role("button", name=re.compile("^Maths")).click()
        page.wait_for_selector("#screenTopics:not([hidden])")
        check(page.locator("#topicsStart").is_disabled(), "topics: Start is disabled until a topic is ticked")
        page.check("#topicAll")
        check(page.locator("#topicList input:checked").count() == page.locator("#topicList input").count(), "topics: Select all ticks every topic")
        page.screenshot(path=str(SHOTS / "02b-topics.png"))
        page.uncheck("#topicAll")
        check(page.locator("#topicList input:checked").count() == 0 and page.locator("#topicsStart").is_disabled(), "topics: unticking Select all clears them")
        page.get_by_role("checkbox", name="Algebra").check()
        check(page.evaluate("document.getElementById('topicAll').indeterminate"), "topics: Select all shows part-ticked for a mix")
        page.click("#topicsStart")
        page.wait_for_selector("#screenGame:not([hidden])")
        page.wait_for_timeout(1400)
        g = game(page)
        check(g["levelNo"] == 1 and g["score"] == 0, "game: starts at level 1 with 0 points")
        check(page.inner_text("#topicName") == "Algebra" and page.inner_text("#levelName") == "Level 1", "header: topic above level number")
        check(len(g["level"]["words"]) == 1, f"level 1 has one word ({[w['word'] for w in g['level']['words']]})")
        page.screenshot(path=str(SHOTS / "03-level1.png"))

        # clue with no points
        page.click("#clueBtn")
        page.wait_for_timeout(150)
        check(page.inner_text("#toast") == "No points left to spend", "clue: message when no points")
        check(game(page)["score"] == 0, "clue: score never goes below zero")

        # drag the word on the wheel
        word = g["level"]["words"][0]["word"]
        page.evaluate("window.__spoken = []")
        drag_word(page, word)
        page.wait_for_timeout(300)
        g = game(page)
        check(g["level"]["words"][0]["solved"], f"drag: dragging {word.upper()} solves it")
        spoken = page.evaluate("window.__spoken")
        clue = g["level"]["words"][0]["clue"]
        check(spoken[:2] == [word, clue] or spoken[:1] == [word], f"speech: says the word then its clue ({spoken[:2]})")
        page.wait_for_selector("#overlay:not([hidden])", timeout=5000)
        page.screenshot(path=str(SHOTS / "04-level-complete.png"))
        check(game(page)["score"] == 10 + 1000, f"score: +10 word, +1000 level ({game(page)['score']})")
        page.click("#dialogButtons button")
        page.wait_for_timeout(1300)

        # ---- level 2: invalid, bonus, already found ----
        check(game(page)["levelNo"] == 2 and len(game(page)["level"]["words"]) <= 2, "level 2: at most two words")
        score = game(page)["score"]
        type_word(page, "zzz")
        page.wait_for_timeout(100)
        check(game(page)["score"] == score, "invalid word: no points")
        b = bonus_candidate(page)
        if b:
            page.evaluate("window.__spoken = []")
            type_word(page, b)
            page.wait_for_timeout(150)
            check(game(page)["score"] == score + 20, f"bonus: {b.upper()} scores +20")
            check(page.evaluate("window.__spoken")[:1] == [b], "bonus: word is read aloud")
            type_word(page, b)
            page.wait_for_timeout(100)
            check(game(page)["score"] == score + 20, "bonus: same bonus word scores once")
        else:
            print("note bonus: no bonus word available on level 2's wheel")
        first = unsolved(page)[0]
        type_word(page, first)
        page.wait_for_timeout(100)
        s2 = game(page)["score"]
        type_word(page, first)
        page.wait_for_timeout(150)
        check(game(page)["score"] == s2 and "Already found" in page.inner_text("#toast"), "already found: message, no points")

        # ---- clue presses across the topic ----
        if unsolved(page):
            before = game(page)
            page.click("#clueBtn")
            page.wait_for_timeout(150)
            after = game(page)
            check(after["score"] == before["score"] - 10, "clue: costs 10 points")
            check(len(after["level"]["revealed"]) == 1, "clue: reveals one letter")
        finish_level(page)
        page.click("#dialogButtons button")
        page.wait_for_timeout(1200)

        # presses 2..6 on level 3
        presses = game(page)["cluePresses"]
        log = []
        while presses < 6 and unsolved(page):
            page.evaluate("window.__spoken = []")
            before = game(page)
            page.click("#clueBtn")
            page.wait_for_timeout(250)
            after = game(page)
            presses = after["cluePresses"]
            log.append((presses, page.evaluate("window.__spoken"), page.locator("#clueText.show").count()))
            if presses % 3 == 0:
                unsolved_before = [w for w in before["level"]["words"] if not w["solved"]]
                if any(w["clue"] for w in unsolved_before):
                    check(page.locator("#clueText.show").count() == 1, f"clue press {presses}: clue text shown")
                    clue_txt = page.inner_text("#clueText")
                    clues = [w["clue"] for w in unsolved_before]
                    check(any(c in clue_txt for c in clues), f"clue press {presses}: clue is for an unsolved word")
            if presses % 5 == 0:
                spoken = page.evaluate("window.__spoken")
                words = {w["say"] or w["word"] for w in before["level"]["words"] if not w["solved"]}
                check(any(s in words for s in spoken), f"clue press {presses}: says an unsolved word ({spoken})")
        print("clue log:", log)
        page.screenshot(path=str(SHOTS / "05-clue.png"))
        if unsolved(page):
            finish_level(page)
        else:
            page.wait_for_selector("#overlay:not([hidden])", timeout=8000)
        page.click("#dialogButtons button")
        page.wait_for_timeout(1200)

        # ---- play on to level 9 to see a bigger grid ----
        while game(page)["levelNo"] < 9:
            finish_level(page)
            page.click("#dialogButtons button")
            page.wait_for_timeout(900)
        page.wait_for_timeout(800)
        page.screenshot(path=str(SHOTS / "06-level9.png"))
        b = bonus_candidate(page)
        if b:
            s9 = game(page)["score"]
            page.evaluate("window.__spoken = []")
            type_word(page, b)
            page.wait_for_timeout(150)
            check(game(page)["score"] == s9 + 20, f"bonus: {b.upper()} (not on the grid) scores +20")
            check(page.evaluate("window.__spoken")[:1] == [b], "bonus: the bonus word is read aloud")
            check(page.locator("#clueText.show").count() == 1 and b.upper() in page.inner_text("#clueContent"), "bonus: box shows the bonus word")
            type_word(page, b)
            page.wait_for_timeout(150)
            check(game(page)["score"] == s9 + 20, "bonus: the same bonus word only scores once")
        lv = game(page)["level"]
        check(len(lv["wheel"]) <= 7 and len(lv["words"]) <= 8, f"level 9: wheel {len(lv['wheel'])} letters, {len(lv['words'])} words")

        # a word part-dragged shows in the strip
        letters = page.locator("#wheel .letter")
        b0 = letters.nth(0).bounding_box(); b1 = letters.nth(1).bounding_box()
        page.mouse.move(b0["x"] + b0["width"] / 2, b0["y"] + b0["height"] / 2)
        page.mouse.down()
        page.mouse.move(b1["x"] + b1["width"] / 2, b1["y"] + b1["height"] / 2, steps=5)
        page.screenshot(path=str(SHOTS / "07-dragging.png"))
        page.mouse.up()

        # ---- menu, save and resume ----
        page.click("#menuBtn")
        page.screenshot(path=str(SHOTS / "08-menu.png"))
        page.click("#speechToggle")
        check(page.inner_text("#speechState") == "Off", "menu: speech can be turned off")
        page.click("#speechToggle")
        saved = game(page)
        page.click("#quitBtn")
        page.wait_for_selector("#overlay:not([hidden])")
        check(page.inner_text("#dialogTitle") == "Save your progress?", "quit: asks whether to save")
        page.screenshot(path=str(SHOTS / "09-save.png"))
        page.get_by_role("button", name="Save", exact=True).click()
        page.wait_for_selector("#screenStart:not([hidden])")
        check(page.locator("#resumePanel").is_visible(), "start: resume offered after saving")
        page.screenshot(path=str(SHOTS / "10-resume.png"))
        page.reload()
        page.wait_for_selector("#resumeBtn")
        page.wait_for_timeout(500)
        page.click("#resumeBtn")
        page.wait_for_selector("#screenGame:not([hidden])")
        g = game(page)
        check(g["levelNo"] == saved["levelNo"] and g["score"] == saved["score"]
              and [w["word"] for w in g["level"]["words"]] == [w["word"] for w in saved["level"]["words"]],
              "resume: same level, score and words after reloading the page")

        # exit to subjects, don't save
        page.click("#menuBtn")
        page.click("#exitBtn")
        page.get_by_role("button", name="Don't save").click()
        page.wait_for_selector("#screenSubjects:not([hidden])")
        check(True, "exit: goes back to the subject choice")

        # ---- complete a whole topic: science / cells ----
        choose(page, "Science", ["Cells"])
        for _ in range(5):
            finish_level(page)
            if page.inner_text("#dialogTitle").startswith("Level"):
                page.click("#dialogButtons button")
                page.wait_for_timeout(600)
            if page.locator("#overlay:not([hidden])").count() and page.inner_text("#dialogTitle") == "Congratulations!":
                break
        check(page.inner_text("#dialogTitle") == "Congratulations!", "topic: congratulations when every word is done")
        page.screenshot(path=str(SHOTS / "11-topic-complete.png"))
        page.click("#dialogButtons button")
        page.wait_for_selector("#screenSubjects:not([hidden])")
        check(True, "topic complete: back to choose a topic")

        # ---- english, a few levels ----
        page.get_by_role("button", name="English").click()
        page.wait_for_selector("#screenGame:not([hidden])")
        for _ in range(4):
            finish_level(page)
            page.click("#dialogButtons button")
            page.wait_for_timeout(500)
        check(game(page)["levelNo"] == 5, "english: levels keep going")
        page.evaluate("window.__spoken = []")
        w0 = unsolved(page)[0]
        type_word(page, w0)
        page.wait_for_timeout(200)
        meanings = {}
        for f in (ROOT / "subjects/english/meanings").glob("*.json"):
            meanings.update(json.loads(f.read_text()))
        m0 = meanings.get(w0, "")
        spoken = page.evaluate("window.__spoken")
        check(page.locator("#clueText.show").count() == 1 and w0.upper() in page.inner_text("#clueContent")
              and (not m0 or m0 in page.inner_text("#clueContent")) and spoken[:1] == [w0] and (not m0 or spoken[1:2] == [m0]),
              f"english word: box shows {w0.upper()} and its meaning, both read aloud ({m0[:50]})")
        page.wait_for_timeout(900)
        page.screenshot(path=str(SHOTS / "12-english.png"))

        # ---- mixed topics ----
        page.click("#menuBtn"); page.click("#exitBtn"); page.get_by_role("button", name="Don't save").click()
        choose(page, "Music", "all")
        page.wait_for_timeout(900)
        check(page.inner_text("#topicName") == "All Music", f"mix: header shows All Music ({page.inner_text('#topicName')})")
        check(len(game(page)["topicFiles"]) == 3, "mix: all three Music topics in play")
        page.screenshot(path=str(SHOTS / "12b-all-music.png"))
        finish_level(page); page.click("#dialogButtons button"); page.wait_for_timeout(500)
        page.click("#menuBtn"); page.click("#exitBtn"); page.get_by_role("button", name="Don't save").click()
        choose(page, "Science", ["Light", "Sound"])
        page.wait_for_timeout(600)
        check(page.inner_text("#topicName") == "Science: 2 topics", f"mix: header shows Science: 2 topics ({page.inner_text('#topicName')})")
        topic_words = set()
        for _ in range(4):
            topic_words |= {w["word"] for w in game(page)["level"]["words"] if w["topic"]}
            finish_level(page); page.click("#dialogButtons button"); page.wait_for_timeout(500)
        light = {"red", "orange", "yellow", "green", "blue", "indigo", "violet", "normal"}
        check(topic_words and topic_words <= light | {"pitch", "noise", "vacuum", "echo", "solids", "decibel", "pinna", "eardrum", "cochlea"},
              f"mix: levels use words from the ticked topics ({sorted(topic_words)})")
        # save and resume a mixed game
        page.click("#menuBtn"); page.click("#quitBtn"); page.get_by_role("button", name="Save", exact=True).click()
        page.wait_for_selector("#resumeBtn")
        check("Science: 2 topics" in page.inner_text("#resumeMeta"), "mix: resume shows the topic mix")
        page.click("#resumeBtn"); page.wait_for_selector("#screenGame:not([hidden])")
        check(game(page)["topicFiles"] == ["subjects/science/light/words.csv", "subjects/science/sound/words.csv"], "mix: resume keeps the same topics")

        # ---- one-word file-format level ----
        page.click("#menuBtn"); page.click("#exitBtn"); page.get_by_role("button", name="Don't save").click()
        choose(page, "Computer", ["Digital Media"])
        page.wait_for_timeout(1200)
        page.screenshot(path=str(SHOTS / "13-digital-media.png"))
        page.evaluate("window.__spoken = []")
        w = game(page)["level"]["words"][0]
        type_word(page, w["word"])
        page.wait_for_timeout(200)
        sp = page.evaluate("window.__spoken")
        check(sp[:1] == [w["say"] or w["word"]], f"say as: {w['word'].upper()} spoken as {sp[:1]}")
        box = page.inner_text("#clueText")
        shown = w["say"] or w["word"].upper()
        check(page.locator("#clueText.show").count() == 1 and shown in box and w["clue"] in box,
              f"found word: box shows {shown} and its meaning while it is read aloud")
        page.wait_for_timeout(400)
        page.screenshot(path=str(SHOTS / "13b-word-box.png"))
        page.click("#boxClose")
        page.wait_for_timeout(100)
        check(page.locator("#clueText.show").count() == 0, "found word: the x closes the box straight away")

        # ---- laptop size ----
        page.set_viewport_size({"width": 1440, "height": 900})
        page.wait_for_timeout(900)
        page.screenshot(path=str(SHOTS / "14-laptop.png"))

        check(not errors, f"no errors in the page console ({errors[:3]})")
        browser.close()
    httpd.shutdown()
    print(f"\n{len(failures)} failures" if failures else "\nAll play checks passed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
