import fitz  # PyMuPDF
from PIL import Image
import numpy as np
import os

src = r"C:\Users\sangeeth\Downloads\CLAUDE CODE\SPRAY\logo\Salman.pdf"
out_dir = r"C:\Users\sangeeth\Downloads\CLAUDE CODE\SPRAY\web\public\logo"
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(src)
page = doc[0]

zoom = 6
mat = fitz.Matrix(zoom, zoom)
pix = page.get_pixmap(matrix=mat, alpha=False)
full_path = os.path.join(out_dir, "logo-black-card.png")
pix.save(full_path)

svg = page.get_svg_image(matrix=fitz.Matrix(1, 1))
with open(os.path.join(out_dir, "logo-black-card.svg"), "w", encoding="utf-8") as f:
    f.write(svg)

img = Image.open(full_path).convert("RGB")
arr = np.array(img)
r = arr[:, :, 0].astype(int)
g = arr[:, :, 1].astype(int)
b = arr[:, :, 2].astype(int)

gold_mask = (r >= 120) & (b <= (r - 40))
h, w = gold_mask.shape
alpha = np.where(gold_mask, 255, 0).astype(np.uint8)
rgba = np.dstack([arr, alpha])
out = Image.fromarray(rgba, mode="RGBA")


def crop_with_pad(im, bbox, pad, bounds):
    l, t, r2, b2 = bbox
    W, H = bounds
    l = max(0, l - pad)
    t = max(0, t - pad)
    r2 = min(W, r2 + pad)
    b2 = min(H, b2 + pad)
    return im.crop((l, t, r2, b2))


bbox = out.getbbox()
pad = 30
full_gold = crop_with_pad(out, bbox, pad, (w, h))
full_gold.save(os.path.join(out_dir, "logo-gold-transparent.png"))
print("full logo:", full_gold.size)

# Find the gap between the flame glyph and the "SALMAN PERFUMES" wordmark by
# scanning row-sums of gold pixels within the tight bbox and locating the
# largest run of near-empty rows in the middle of the artwork (not at the
# very top/bottom, which are just the mark's and wordmark's own margins).
l, t, r2, b2 = bbox
row_has_gold = gold_mask[t:b2, l:r2].any(axis=1)
n = len(row_has_gold)

# scan the middle 70% of the artwork for the longest empty run
search_start = int(n * 0.25)
search_end = int(n * 0.85)
best_run = (0, 0, 0)  # (length, start, end)
run_start = None
for i in range(search_start, search_end):
    if not row_has_gold[i]:
        if run_start is None:
            run_start = i
    else:
        if run_start is not None:
            length = i - run_start
            if length > best_run[0]:
                best_run = (length, run_start, i)
            run_start = None
if run_start is not None:
    length = search_end - run_start
    if length > best_run[0]:
        best_run = (length, run_start, search_end)

gap_len, gap_start, gap_end = best_run
split_row = t + (gap_start + gap_end) // 2
print(f"detected gap: rows {gap_start}-{gap_end} (len {gap_len}), split at y={split_row}")

mark_region = out.crop((0, 0, w, split_row))
mbbox = mark_region.getbbox()
mark = crop_with_pad(mark_region, mbbox, pad, (mark_region.width, mark_region.height))
mark.save(os.path.join(out_dir, "mark-gold-transparent.png"))
print("mark only:", mark.size, "bbox check:", mark.getbbox())

for size in (512, 192, 32):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ratio = min(size / mark.width, size / mark.height) * 0.86
    new_w, new_h = max(1, int(mark.width * ratio)), max(1, int(mark.height * ratio))
    resized = mark.resize((new_w, new_h), Image.LANCZOS)
    canvas.paste(resized, ((size - new_w) // 2, (size - new_h) // 2), resized)
    canvas.save(os.path.join(out_dir, f"favicon-{size}.png"))
print("saved favicons")
