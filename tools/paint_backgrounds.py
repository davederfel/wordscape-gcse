"""Paint the default landscape backgrounds for Wordscape GCSE.

Usage:
    python tools/paint_backgrounds.py [output folder]     (default: assets/backgrounds)

Each scene is a soft, long-distance view: a gradient sky with a low sun, layers of
hills fading into mist, and sometimes a lake. No birds: they are animated in the game.
Images are portrait, 1080 x 1920 pixels, saved as JPG. The same seed always gives the
same picture, so the set can be regenerated exactly.

These pictures are original and generated here, so there is no licence to track.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

W, H = 1080, 1920


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=float)


# name: sky top, sky middle, horizon, sun colour, near-hill colour, options
SCENES = {
    "sunset-lake": dict(sky=("#f6a35a", "#fb8a3c", "#ffd08a"), sun="#fff3c4", sun_x=0.30, sun_y=0.50,
                        hill="#4a3150", layers=6, horizon=0.56, amp=(50, 230), water=0.74, seed=11),
    "dawn-mist": dict(sky=("#7e8fc4", "#e3abc0", "#ffdcc4"), sun="#fff1dc", sun_x=0.68, sun_y=0.52,
                      hill="#4c4a78", layers=7, horizon=0.52, amp=(45, 260), water=None, seed=23),
    "blue-morning": dict(sky=("#6f9fd2", "#a9c7e6", "#e6eef3"), sun="#ffffff", sun_x=0.75, sun_y=0.30,
                         hill="#2f4c6b", layers=6, horizon=0.55, amp=(55, 240), water=0.76, seed=37),
    "golden-hills": dict(sky=("#93bfe0", "#efe0b0", "#fff0c2"), sun="#fff6d6", sun_x=0.40, sun_y=0.47,
                         hill="#5b6a34", layers=6, horizon=0.57, amp=(30, 140), water=None, seed=41, rolling=True),
    "lavender-dusk": dict(sky=("#3c3d6e", "#9a6fa8", "#f2aa9c"), sun="#ffd9b8", sun_x=0.55, sun_y=0.53,
                          hill="#2a2140", layers=6, horizon=0.56, amp=(50, 220), water=0.75, seed=53),
    "green-valley": dict(sky=("#86bbe2", "#c8e2ec", "#eef2e2"), sun="#ffffff", sun_x=0.25, sun_y=0.33,
                         hill="#35583a", layers=7, horizon=0.55, amp=(35, 160), water=None, seed=67, rolling=True),
    "snow-peaks": dict(sky=("#5d8ccb", "#a9c8e6", "#e8eff6"), sun="#ffffff", sun_x=0.70, sun_y=0.28,
                       hill="#2c4466", layers=6, horizon=0.53, amp=(110, 300), water=None, seed=79, snow=True),
    "teal-fjord": dict(sky=("#467f95", "#8fbebd", "#dde6d4"), sun="#fffbe6", sun_x=0.45, sun_y=0.45,
                       hill="#1f4a4f", layers=6, horizon=0.55, amp=(70, 280), water=0.73, seed=97),
}


def noise1d(rng, n, octaves, sharp=False):
    """Fractal value noise across the width, values roughly 0..1."""
    x = np.linspace(0, 1, n)
    out = np.zeros(n)
    total = 0.0
    for o in range(octaves):
        pts = 3 * 2 ** o + 1
        vals = rng.random(pts)
        pos = x * (pts - 1)
        i = np.floor(pos).astype(int).clip(0, pts - 2)
        f = pos - i
        f = (1 - np.cos(f * np.pi)) / 2
        layer = vals[i] * (1 - f) + vals[i + 1] * f
        if sharp:
            layer = 1 - np.abs(layer * 2 - 1)
        a = 0.5 ** o
        out += layer * a
        total += a
    out = out / total
    return (out - out.min()) / (out.max() - out.min() + 1e-9)


def soft_clouds(rng, strength):
    small = rng.random((30, 4))
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    img = img.filter(ImageFilter.GaussianBlur(18))
    a = np.asarray(img, dtype=float) / 255.0
    a = np.clip((a - 0.6) * 3.5, 0, 1) * strength
    return a


def paint(name, s):
    rng = np.random.default_rng(s["seed"])
    top, mid, hor = (hexrgb(c) for c in s["sky"])
    sun = hexrgb(s["sun"])
    hill = hexrgb(s["hill"])
    yy = np.linspace(0, 1, H)[:, None]
    xx = np.linspace(0, 1, W)[None, :]

    # sky: three-stop vertical gradient down to the horizon
    hz = s["horizon"]
    t = np.clip(yy / hz, 0, 1)
    t1 = np.clip(t * 2, 0, 1)
    t2 = np.clip(t * 2 - 1, 0, 1)
    sky = np.where(t[..., None] < 0.5,
                   top * (1 - t1[..., None]) + mid * t1[..., None],
                   mid * (1 - t2[..., None]) + hor * t2[..., None])
    img = np.broadcast_to(sky, (H, W, 3)).copy()

    # sun glow
    dx = (xx - s["sun_x"]) * W
    dy = (yy - s["sun_y"]) * H
    r2 = dx ** 2 + dy ** 2
    glow = 0.85 * np.exp(-r2 / (2 * 70 ** 2)) + 0.35 * np.exp(-r2 / (2 * 260 ** 2))
    img = img * (1 - glow[..., None]) + sun * glow[..., None]

    # soft clouds in the upper sky
    cl = soft_clouds(rng, 0.22) * np.clip(1 - yy / hz, 0, 1)
    img = img * (1 - cl[..., None]) + (hor * 0.6 + sun * 0.4) * cl[..., None]

    haze = hor * 0.85 + sun * 0.15
    L = s["layers"]
    water_y = int(s["water"] * H) if s["water"] else None
    a_far, a_near = s["amp"]
    y_rows = np.arange(H)[:, None]
    for k in range(L):
        f = k / (L - 1)
        base = hz * H + f * (0.26 * H)
        if water_y and base > water_y + 10:
            break
        amp = a_far + (a_near - a_far) * f
        if s.get("rolling"):
            r = noise1d(rng, W, 3)
        else:
            r = noise1d(rng, W, 6, sharp=(k < 3 and s.get("snow")))
        ridge = base - amp * r
        depth = 0.18 + 0.82 * (f ** 1.3)
        col = haze * (1 - depth) + hill * depth
        d = (y_rows - ridge[None, :])
        alpha = np.clip(d / 2.5, 0, 1)
        k_w = 121
        smooth = np.convolve(np.pad(ridge, k_w // 2, mode="edge"), np.ones(k_w) / k_w, mode="valid")
        ds = (y_rows - (smooth[None, :] - amp * 0.35))
        mist = np.clip(ds / (260 + 300 * f), 0, 1) * (0.75 - 0.45 * f)
        layer = col * (1 - mist[..., None]) + haze * mist[..., None]
        if s.get("snow") and k < 2:
            high = np.clip((r - 0.45) * 3, 0, 1)[None, :]
            cap = np.clip(1 - d / (12 + 45 * r[None, :]), 0, 1) ** 1.5 * high
            layer = layer * (1 - cap[..., None] * 0.85) + np.array([246, 249, 253.0]) * cap[..., None] * 0.85
        img = img * (1 - alpha[..., None]) + layer * alpha[..., None]

    # lake: soft reflection of the scene above the waterline
    if water_y:
        rows = np.arange(water_y, H)
        src = np.clip(2 * water_y - rows, 0, H - 1)
        refl = img[src].copy()
        refl_img = Image.fromarray(refl.clip(0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(3)).filter(ImageFilter.GaussianBlur(9))
        refl = np.asarray(refl_img, dtype=float)
        depth = np.linspace(0, 1, len(rows))[:, None, None]
        tint = hor * 0.55 + hill * 0.45
        refl = refl * (1 - 0.25 - 0.35 * depth) + tint * (0.25 + 0.35 * depth)
        glint = np.exp(-((xx - s["sun_x"]) * W) ** 2 / (2 * 110 ** 2)) * 0.28 * (1 - depth[..., 0] * 0.6)
        refl = refl + (sun - refl) * glint[..., None]
        img[water_y:] = refl
        edge = np.exp(-((np.arange(H) - water_y) / 3.0) ** 2)[:, None, None] * 0.25
        img = img * (1 - edge) + haze * edge

    # gentle overall haze and grain, then a final soften
    img = img * 0.94 + haze * 0.06
    img += rng.normal(0, 1.6, img.shape)
    out = Image.fromarray(img.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    return out


def main(folder):
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    for name, s in SCENES.items():
        p = folder / f"{name}.jpg"
        paint(name, s).save(p, quality=86, optimize=True, progressive=True)
        print(p, p.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "assets" / "backgrounds")
