from PIL import Image
import os

src_dir = r"C:\Users\sangeeth\Downloads\CLAUDE CODE\SPRAY\perfume_assets"
out_root = r"C:\Users\sangeeth\Downloads\CLAUDE CODE\SPRAY\web\public\products"

mapping = {
    "imperial": ["photo_2026-08-04_14-56-05.jpg", "photo_2026-08-04_14-56-25.jpg"],
    "lather": ["photo_2026-08-04_14-56-08.jpg"],
    "latheer": ["photo_2026-08-04_14-56-10.jpg"],
    "orchid": ["photo_2026-08-04_14-56-11.jpg", "photo_2026-08-04_14-56-21.jpg"],
    "akhdar": ["photo_2026-08-04_14-56-13.jpg", "photo_2026-08-04_14-56-23.jpg"],
    "oud-lavender": ["photo_2026-08-04_14-56-16.jpg", "photo_2026-08-04_14-56-18.jpg"],
}

for slug, files in mapping.items():
    out_dir = os.path.join(out_root, slug)
    os.makedirs(out_dir, exist_ok=True)
    for i, fname in enumerate(files, start=1):
        im = Image.open(os.path.join(src_dir, fname)).convert("RGB")
        # full size (cap width at 1400 upscaling slightly via high-quality resample if needed)
        target_w = 1400
        ratio = target_w / im.width
        full = im.resize((target_w, int(im.height * ratio)), Image.LANCZOS)
        full.save(os.path.join(out_dir, f"{i}.jpg"), quality=90, optimize=True)

        thumb_w = 700
        tratio = thumb_w / im.width
        thumb = im.resize((thumb_w, int(im.height * tratio)), Image.LANCZOS)
        thumb.save(os.path.join(out_dir, f"{i}-thumb.jpg"), quality=85, optimize=True)
    print(slug, "done", len(files), "images")

print("all done")
