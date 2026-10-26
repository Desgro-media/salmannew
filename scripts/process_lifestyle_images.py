"""File the lifestyle + notes artwork in newimages/ under each product.

Reads:  newimages/<Name>.png                         (16 files, 1024x1536 each)
Writes: web/public/products/<slug>/lifestyle.jpg     the hero scene
        web/public/products/<slug>/notes.jpg         the top/middle/base notes sheet

Eight scents have this artwork: Imperial, Orchid, Oud Lavender, Oud, Blue, Love,
Sweet and Lather. Akhdar, Latheer, Kiano and the Prive line have none yet.

These are NOT the <n>.jpg studio shots, and the filenames are deliberately not
numeric. They are composed scenes — the bottle sits on a stone slab with the
ingredients floating around it — so there is no clean cutout to make from them,
and cutout_products.py picks up every <digit>*.jpg it finds. A numeric name
would get a junk .png generated next to it the next time that script runs.

They are also not part of the images[i] <-> sizes[i] pairing: seed-data.ts
appends them AFTER the size photos, and ProductGallery treats anything past the
last size as an extra that does not move the size selector.

The sources are already 2:3, the same ratio as the gallery plate, so there is no
crop and no resize — upscaling a 1024px original would only soften it. The only
change is PNG -> JPEG (~2 MB -> a few hundred KB) to match the rest of
web/public/products/.
"""

from PIL import Image
import os

ROOT = r"C:\Users\sangeeth\Downloads\CLAUDE CODE\SPRAY"
SRC_DIR = os.path.join(ROOT, "newimages")
OUT_ROOT = os.path.join(ROOT, "web", "public", "products")

# slug -> (lifestyle source, notes source). Names are as they sit on disk — the
# capitalisation of "Notes" is inconsistent in the folder and kept as found.
SOURCES = {
    "imperial": ("Imperial 1.png", "Imperial notes.png"),
    "orchid": ("Orchid 1.png", "Orchid notes.png"),
    "oud-lavender": ("Oud Lavender 3.png", "Oud Lavender notes.png"),
    "oud": ("Oud 4.png", "Oud notes.png"),
    "blue": ("Blue 5.png", "Blue notes.png"),
    "love": ("Love 6.png", "Love Notes.png"),
    "sweet": ("Sweet 7.png", "Sweet notes.png"),
    "lather": ("Lather 8.png", "Lather Notes.png"),
}

EXPECTED_SIZE = (1024, 1536)


def main():
    for slug, (lifestyle, notes) in SOURCES.items():
        out_dir = os.path.join(OUT_ROOT, slug)
        if not os.path.isdir(out_dir):
            # A typo'd slug would otherwise mint a stray folder the app never reads.
            raise SystemExit(f"no product folder for '{slug}' at {out_dir}")

        for src_name, out_name in ((lifestyle, "lifestyle.jpg"), (notes, "notes.jpg")):
            im = Image.open(os.path.join(SRC_DIR, src_name)).convert("RGB")
            if im.size != EXPECTED_SIZE:
                raise SystemExit(
                    f"{src_name} is {im.size}, expected {EXPECTED_SIZE} — "
                    "the gallery plate is 2:3, so check this one before shipping it"
                )
            im.save(os.path.join(out_dir, out_name), quality=90, optimize=True)
            print(f"{slug}/{out_name}  <-  {src_name}")

    print("all done")


if __name__ == "__main__":
    main()
