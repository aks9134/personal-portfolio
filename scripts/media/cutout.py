# cutout.py <in> <out.png> <mode> [fill]: make an image's background see-through without letting the page color
# bleed into the object. Run by build.mjs through .venv-media (setup: scripts/media/README.md).
#
# Modes:
#   cutout    renders and photos of objects: background removal, then a solid matte
#   solidify  images that already have a see-through background: solid matte only
#   ink       plots, schematics, line art on white: only the white goes, lines keep their exact color
#   drawing   shaded CAD drawings on white: parts get a solid matte, labels and arrows are treated as ink
#
# Solid matte: pixels inside the object become fully opaque (no half-transparent interiors for the
# page color to show through), real holes stay fully clear, and the edge keeps a 1 px smooth falloff.
# `fill`: also fill see-through areas fully enclosed by the object. For objects with white faces on a
# white background (the model can't tell them apart); never for objects with real see-through gaps.
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

src, dst, mode = sys.argv[1], sys.argv[2], sys.argv[3]
fill = len(sys.argv) > 4 and sys.argv[4].startswith("fill")
seal = int(sys.argv[4].split(":")[1]) if fill and ":" in sys.argv[4] else 13
image = Image.open(src)


def fill_holes(a: Image.Image, seal: int = 13) -> Image.Image:
    # Seal small breaks in a thin outline first (grow, fill, shrink back), or the fill leaks in from outside.
    border = seal + 1
    padded = ImageOps.expand(a, border=border, fill=0).filter(ImageFilter.MaxFilter(seal))
    ImageDraw.floodfill(padded, (0, 0), 128)  # everything reachable from outside is background
    closed = padded.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.MinFilter(seal))
    inner = closed.crop((border, border, closed.width - border, closed.height - border))
    return Image.fromarray(np.maximum(np.asarray(inner), np.asarray(a)))


def solid(alpha: Image.Image) -> Image.Image:
    a = alpha.point(lambda v: 255 if v >= 48 else 0)
    if fill:
        a = fill_holes(a, seal)
    a = a.filter(ImageFilter.MinFilter(3))  # pull the edge in 1 px, off any leftover background fringe
    return a.filter(ImageFilter.GaussianBlur(0.7))


def removed(img: Image.Image) -> Image.Image:
    from rembg import new_session, remove

    return remove(img.convert("RGB"), session=new_session("isnet-general-use"), post_process_mask=True)


def ink(img: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    # Color-to-alpha against white: each pixel becomes the most transparent color that looks the same on white.
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    a = (255.0 - rgb).max(axis=2) / 255.0
    safe = np.where(a > 0, a, 1.0)[..., None]
    color = np.clip((rgb - (1.0 - a[..., None]) * 255.0) / safe, 0, 255)
    return color, a * 255.0


if mode == "cutout":
    # Shape from the model, color from the original: filled faces get their real pixels back.
    out = image.convert("RGB")
    out.putalpha(solid(removed(image).getchannel("A")))
elif mode == "solidify":
    out = image.convert("RGBA")
    out.putalpha(solid(out.getchannel("A")))
elif mode == "ink":
    flat = Image.new("RGB", image.size, "white")
    flat.paste(image.convert("RGBA"), mask=image.convert("RGBA").getchannel("A"))
    color, a = ink(flat)
    out = Image.fromarray(np.dstack([color, a]).astype(np.uint8), "RGBA")
elif mode == "drawing":
    flat = Image.new("RGB", image.size, "white")
    flat.paste(image.convert("RGBA"), mask=image.convert("RGBA").getchannel("A"))
    parts = np.asarray(solid(removed(flat).getchannel("A"))).astype(np.float32)
    color, a = ink(flat)
    rgb = np.asarray(flat).astype(np.float32)
    w = (parts / 255.0)[..., None]  # inside a part: true color, fully opaque
    color = w * rgb + (1 - w) * color
    alpha = np.maximum(parts, a)
    out = Image.fromarray(np.dstack([color, alpha]).astype(np.uint8), "RGBA")
else:
    sys.exit(f"unknown mode {mode}")

out.save(dst)
