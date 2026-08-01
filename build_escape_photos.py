#!/usr/bin/env python3
"""
Wire licensed property photography into the Journal escapes article.

Drop one or more images into images/escapes/<property>/ and run:

    python3 build_escape_photos.py

For each property it takes the first image it finds, crop-fills it to
1200x630 without distortion, writes images/escapes/<property>.jpg, and
inserts a <figure> under that property's heading in the article. Re-running
is safe: existing figures are replaced, not duplicated.
"""

import os, re, subprocess, sys

SITE = os.path.dirname(os.path.abspath(__file__))
os.chdir(SITE)

ARTICLE = "luxury-escapes-close-to-home.html"
SRC_DIR = "images/escapes"

# folder -> (heading text in the article, alt text)
PROPERTIES = [
    ("twin-farms",      "Twin Farms, Vermont",           "Twin Farms, Vermont"),
    ("winvian",         "Winvian Farm, Connecticut",     "Winvian Farm, Connecticut"),
    ("the-point",       "The Point, Adirondacks",        "The Point, Adirondacks"),
    ("mohonk",          "Mohonk Mountain House, New York","Mohonk Mountain House, New York"),
    ("blackberry-farm", "Blackberry Farm, Tennessee",    "Blackberry Farm, Tennessee"),
]

EXTS = (".jpg", ".jpeg", ".png", ".webp", ".avif")


def dim(path, key):
    out = subprocess.run(["sips", "-g", key, path], capture_output=True, text=True).stdout
    v = out.split()[-1]
    return None if v in ("<nil>", key + ":") else int(v)


def crop_fill(src, out, w=1200, h=630):
    """Scale so the image covers the target, then centre-crop. No distortion."""
    sw, sh = dim(src, "pixelWidth"), dim(src, "pixelHeight")
    if not sw or not sh:
        print(f"  !! unreadable (is it actually an image?): {src}")
        return False
    scale = max(w / sw, h / sh)
    tmp = "/tmp/_escape_resize.jpg"
    subprocess.run(["sips", "--resampleHeightWidth", str(round(sh * scale)), str(round(sw * scale)),
                    src, "--out", tmp], capture_output=True)
    subprocess.run(["sips", "-c", str(h), str(w), tmp, "--out", out,
                    "-s", "format", "jpeg", "-s", "formatOptions", "82"], capture_output=True)
    return os.path.isfile(out)


def first_image(folder):
    if not os.path.isdir(folder):
        return None
    for f in sorted(os.listdir(folder)):
        if f.lower().endswith(EXTS) and not f.startswith("."):
            return os.path.join(folder, f)
    return None


def main():
    if not os.path.isfile(ARTICLE):
        sys.exit(f"cannot find {ARTICLE}")
    html = open(ARTICLE, encoding="utf-8").read()

    built, missing = [], []
    for slug, heading, alt in PROPERTIES:
        src = first_image(os.path.join(SRC_DIR, slug))
        if not src:
            missing.append(heading)
            continue
        out = f"{SRC_DIR}/{slug}.jpg"
        if not crop_fill(src, out):
            missing.append(heading)
            continue

        fig = (f'\n        <figure class="escape-figure">'
               f'\n          <img src="{out}" width="1200" height="630" loading="lazy" alt="{alt}">'
               f'\n        </figure>')

        # drop any figure already sitting under this heading, then insert fresh
        h2 = re.escape(f"<h2>{heading}</h2>")
        html = re.sub(h2 + r'(\s*<figure class="escape-figure">.*?</figure>)?',
                      lambda m: f"<h2>{heading}</h2>" + fig, html, count=1, flags=re.S)
        built.append(heading)

    open(ARTICLE, "w", encoding="utf-8").write(html)

    print(f"photos wired in: {len(built)}")
    for b in built:
        print(f"   ✓ {b}")
    if missing:
        print(f"\nstill needs photography ({len(missing)}):")
        for m in missing:
            print(f"   – {m}")
        print(f"\ndrop images into {SRC_DIR}/<property>/ and run this again.")


if __name__ == "__main__":
    main()
