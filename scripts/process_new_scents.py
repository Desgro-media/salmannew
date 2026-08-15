"""Bring the August 2026 "me." shoot into the shape the app expects.

Reads:  perfumes/WhatsApp Image 2026-08-12 at *.jpeg
Writes: web/public/products/<slug>/<n>.jpg        studio shot, for the gallery
        web/public/products/<slug>/<n>-thumb.jpg  same, half width
        web/public/products/<slug>/<n>.png        transparent cutout, for cards
        web/public/products/<slug>/<n>-thumb.png  same, half width

Same four outputs as process_products.py + cutout_products.py, done in one pass
because this batch arrived already framed the way the "me." line wants — one
bottle, one shot — so there was nothing to reconcile the way process_prive.py
had to.

Only the five NEW scents are listed below. The shoot also re-photographed the
six existing ones (Imperial, Orchid, Akhdar, Oud Lavender, Lather, Latheer);
those already have art under web/public/products/ from the original shoot and
are deliberately left alone — swapping them is a separate call.

The <n> index follows the images[i] <-> sizes[i] convention the app depends on
(see ARCHITECTURE.md §6): 1 is the 20 ml tube, 2 is the 50 ml bottle. Scents
that only come in 50 ml have a single image at index 1.
"""

from rembg import remove
from PIL import Image
import os

SRC_DIR = r"C:\Users\sangeeth\Downloads\CLAUDE CODE\SPRAY\perfumes"
OUT_ROOT = r"C:\Users\sangeeth\Downloads\CLAUDE CODE\SPRAY\web\public\products"


def shot(stamp: str) -> str:
    return f"WhatsApp Image 2026-08-12 at {stamp}.jpeg"


# slug -> source files, in images[i] order (see module docstring).
SOURCES = {
    "love": [shot("10.30.17 AM"), shot("10.30.05 AM")],
    "blue": [shot("10.30.17 AM (1)"), shot("10.30.10 AM")],
    "oud": [shot("10.30.16 AM"), shot("10.30.13 AM")],
    "sweet": [shot("10.30.14 AM")],
    "kiano": [shot("10.30.15 AM")],
}

FULL_WIDTH = 1400
THUMB_WIDTH = 700
PAD_FRACTION = 0.08

# Matching cutout_products.py: gentle enough not to eat the glossy caps.
ALPHA_LOW = 20
ALPHA_HIGH = 120
BBOX_ALPHA_MIN = 30

# Same problem cutout_products.py hit: some of these sit on a mirrored floor
# and rembg keeps the reflection as foreground however the alpha is thresholded.
# Cheaper to crop it out of the source before rembg ever sees it.
# Value = fraction of the source image height to keep, measured from the top.
#
# Cut a little BELOW the bottle's contact line, not level with it. Kiano's base
# bottoms out at 0.798 and cropping there was worse, not better: with no floor
# left underneath, rembg reads the pale studio floor still hugging the base as
# part of the bottle and leaves a bright skirt around it. Leaving a slice of
# reflection in frame gives it the contrast it needs to call that floor
# background, and the alpha threshold then drops the reflection anyway.
SOURCE_CROP_BOTTOM = {
    ("love", 1): 0.855,
    ("blue", 1): 0.855,
    ("kiano", 1): 0.88,
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


def cutout(im: Image.Image, slug: str, n: int) -> Image.Image:
    crop_frac = SOURCE_CROP_BOTTOM.get((slug, n))
    if crop_frac:
        im = im.crop((0, 0, im.width, round(im.height * crop_frac)))

    out = clean_alpha(remove(im))  # RGBA, background pixels have alpha=0

    bbox = out.split()[-1].point(lambda a: 255 if a >= BBOX_ALPHA_MIN else 0).getbbox()
    if bbox:
        out = out.crop(bbox)

    pad = int(max(out.size) * PAD_FRACTION)
    padded = Image.new("RGBA", (out.width + pad * 2, out.height + pad * 2), (0, 0, 0, 0))
    padded.paste(out, (pad, pad), out)
    return padded


def save_sized(im: Image.Image, path: str, target_w: int, **kw):
    ratio = target_w / im.width
    im.resize((target_w, round(im.height * ratio)), Image.LANCZOS).save(
        path, optimize=True, **kw
    )


def main():
    for slug, files in SOURCES.items():
        out_dir = os.path.join(OUT_ROOT, slug)
        os.makedirs(out_dir, exist_ok=True)

        for n, fname in enumerate(files, start=1):
            src = Image.open(os.path.join(SRC_DIR, fname)).convert("RGB")

            save_sized(src, os.path.join(out_dir, f"{n}.jpg"), FULL_WIDTH, quality=90)
            save_sized(src, os.path.join(out_dir, f"{n}-thumb.jpg"), THUMB_WIDTH, quality=85)

            out = cutout(src, slug, n)
            save_sized(out, os.path.join(out_dir, f"{n}.png"), FULL_WIDTH)
            save_sized(out, os.path.join(out_dir, f"{n}-thumb.png"), THUMB_WIDTH)
            print(f"{slug} {n} -> {out.size}")

    print("all done")


if __name__ == "__main__":
    main()
