"""Strip the studio backdrop from each product photo, tightly crop to the
bottle, and re-export as transparent PNGs (full + thumb sizes) so the app
can lay its own accent-color glow behind the product instead of the
original grey/black studio background.

Reads:  web/public/products/<slug>/<n>.jpg
Writes: web/public/products/<slug>/<n>.png, <n>-thumb.png
Leaves the original .jpg files in place (unreferenced once seed-data.ts
switches to .png, but harmless to keep around).
"""

from rembg import remove
from PIL import Image
import os

root = r"C:\Users\sangeeth\Downloads\CLAUDE CODE\SPRAY\web\public\products"

# Fraction of the larger cropped-subject dimension added as transparent
# padding on every side, so the bottle doesn't touch the card edges.
PAD_FRACTION = 0.08

FULL_WIDTH = 1400
THUMB_WIDTH = 700

# rembg's default (u2net) model reliably captures the whole bottle
# including reflective gold caps; stricter models/thresholds tried here
# ended up clipping caps on some bottles, so keep this gentle — it only
# needs to kill near-zero background noise, not fight real reflections.
ALPHA_LOW = 20
ALPHA_HIGH = 120
BBOX_ALPHA_MIN = 30

# A couple of studio shots sit on a mirrored floor and rembg keeps a
# faint (but not negligible) reflection as part of the "foreground" no
# matter how the alpha is thresholded. Cheaper and more reliable to just
# crop the reflection out of the SOURCE photo before rembg ever sees it.
# Value = fraction of the source image height to keep, measured from top.
SOURCE_CROP_BOTTOM = {
    ("lather", "1"): 0.745,
    ("oud-lavender", "1"): 0.765,
    ("imperial", "2"): 0.79,
}


def clean_alpha(im: Image.Image) -> Image.Image:
    r, g, b, a = im.split()

    def ramp(v: int) -> int:
        if v <= ALPHA_LOW:
            return 0
        if v >= ALPHA_HIGH:
            return v
        return int((v - ALPHA_LOW) / (ALPHA_HIGH - ALPHA_LOW) * v)

    return Image.merge("RGBA", (r, g, b, a.point(ramp)))


def cutout(path: str, slug: str, n: str) -> Image.Image:
    im = Image.open(path).convert("RGB")

    crop_frac = SOURCE_CROP_BOTTOM.get((slug, n))
    if crop_frac:
        im = im.crop((0, 0, im.width, round(im.height * crop_frac)))

    out = clean_alpha(remove(im))  # RGBA, background pixels have alpha=0

    alpha = out.split()[-1]
    bbox = alpha.point(lambda a: 255 if a >= BBOX_ALPHA_MIN else 0).getbbox()
    if bbox:
        out = out.crop(bbox)

    w, h = out.size
    pad = int(max(w, h) * PAD_FRACTION)
    padded = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    padded.paste(out, (pad, pad), out)
    return padded


def save_sized(im: Image.Image, path: str, target_w: int):
    ratio = target_w / im.width
    resized = im.resize((target_w, round(im.height * ratio)), Image.LANCZOS)
    resized.save(path, optimize=True)


def main():
    for slug in sorted(os.listdir(root)):
        slug_dir = os.path.join(root, slug)
        if not os.path.isdir(slug_dir):
            continue
        for fname in sorted(os.listdir(slug_dir)):
            if not fname[0].isdigit() or not fname.endswith(".jpg") or "-thumb" in fname:
                continue
            n = fname.split(".")[0]
            src = os.path.join(slug_dir, fname)
            im = cutout(src, slug, n)
            save_sized(im, os.path.join(slug_dir, f"{n}.png"), FULL_WIDTH)
            save_sized(im, os.path.join(slug_dir, f"{n}-thumb.png"), THUMB_WIDTH)
            print(slug, n, "->", im.size)

    print("all done")


if __name__ == "__main__":
    main()
