"""Bring the six PRIVE press shots into the shape the app expects.

Reads:  perfume_assets/prive-<colour>.jpeg
Writes: web/public/products/<slug>/1.jpg        studio shot, for the gallery
        web/public/products/<slug>/1-thumb.jpg  same, half width
        web/public/products/<slug>/1.png        transparent cutout, for cards
        web/public/products/<slug>/1-thumb.png  same, half width

Same outputs as process_products.py + cutout_products.py, which handled the
"me." line; kept separate because these arrived as a batch with their own
framing rather than as more of the same shoot.

The one real difference: every PRIVE shot is the tube standing beside the
bottle, where the "me." shots are a lone bottle. Left whole, the cards would
show a wide two-object composition next to six tall single bottles and the grid
would lose its rhythm. So the gallery keeps the full shot — the packaging is
worth showing on the product page — while the cutout is taken from a crop of
the bottle alone. CUTOUT_LEFT sits in the gap between them: past the widest
tube (~52% across) and short of the leftmost bottle (~54.7%).
"""

from rembg import remove
from PIL import Image
import os

SRC_DIR = r"C:\Users\sangeeth\Downloads\CLAUDE CODE\SPRAY\perfume_assets"
OUT_ROOT = r"C:\Users\sangeeth\Downloads\CLAUDE CODE\SPRAY\web\public\products"

SLUGS = [
    "prive-black",
    "prive-yellow",
    "prive-green",
    "prive-white",
    "prive-oud",
    "prive-red",
]
SOURCES = {slug: f"{slug}.jpeg" for slug in SLUGS}

CUTOUT_LEFT = 0.53

FULL_WIDTH = 1400
THUMB_WIDTH = 700
PAD_FRACTION = 0.08

# Matching cutout_products.py: gentle enough not to eat the glossy caps.
ALPHA_LOW = 20
ALPHA_HIGH = 120
BBOX_ALPHA_MIN = 30


def clean_alpha(im: Image.Image) -> Image.Image:
    r, g, b, a = im.split()

    def ramp(v: int) -> int:
        if v <= ALPHA_LOW:
            return 0
        if v >= ALPHA_HIGH:
            return v
        return int((v - ALPHA_LOW) / (ALPHA_HIGH - ALPHA_LOW) * v)

    return Image.merge("RGBA", (r, g, b, a.point(ramp)))


def save_sized(im: Image.Image, path: str, target_w: int, **kw):
    ratio = target_w / im.width
    im.resize((target_w, round(im.height * ratio)), Image.LANCZOS).save(
        path, optimize=True, **kw
    )


def main():
    for slug, fname in SOURCES.items():
        out_dir = os.path.join(OUT_ROOT, slug)
        os.makedirs(out_dir, exist_ok=True)
        src = Image.open(os.path.join(SRC_DIR, fname)).convert("RGB")

        save_sized(src, os.path.join(out_dir, "1.jpg"), FULL_WIDTH, quality=90)
        save_sized(src, os.path.join(out_dir, "1-thumb.jpg"), THUMB_WIDTH, quality=85)

        bottle = src.crop((round(src.width * CUTOUT_LEFT), 0, src.width, src.height))
        out = clean_alpha(remove(bottle))
        bbox = out.split()[-1].point(lambda a: 255 if a >= BBOX_ALPHA_MIN else 0).getbbox()
        if bbox:
            out = out.crop(bbox)
        pad = int(max(out.size) * PAD_FRACTION)
        padded = Image.new("RGBA", (out.width + pad * 2, out.height + pad * 2), (0, 0, 0, 0))
        padded.paste(out, (pad, pad), out)

        save_sized(padded, os.path.join(out_dir, "1.png"), FULL_WIDTH)
        save_sized(padded, os.path.join(out_dir, "1-thumb.png"), THUMB_WIDTH)
        print(slug, "->", padded.size)

    print("all done")


if __name__ == "__main__":
    main()
