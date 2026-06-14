#!/usr/bin/env python3
"""
Generate WoofWalks branded app icon assets.

Produces:
  assets/icon.png          1024x1024  no transparency (Meta / app icon)
  assets/adaptive-icon.png 1024x1024  with transparency  (Android)
  assets/favicon.png         64x64
  assets/splash.png        1284x2778  (iOS splash screen)
"""

import math
from PIL import Image, ImageDraw, ImageFont

# ── Brand colours ────────────────────────────────────────────────────────────
PRIMARY      = (22, 163, 74)    # #16A34A
PRIMARY_DARK = (20,  83, 45)    # #14532D
ACCENT       = (245, 158, 11)   # #F59E0B
BG_LIGHT     = (240, 255, 244)  # #F0FFF4
WHITE        = (255, 255, 255)


# ── Helpers ──────────────────────────────────────────────────────────────────

def draw_paw(draw: ImageDraw.Draw, cx: float, cy: float, scale: float,
             color: tuple, alpha: int = 255) -> None:
    """
    Draw a dog-paw icon centred at (cx, cy).

    scale = radius of the main pad in pixels.
    The fill colour is `color`; `alpha` lets callers control transparency.
    """
    fill = color + (alpha,) if len(color) == 3 else color

    # ── Main pad (large oval, slightly wider than tall) ──────────────────────
    pw, ph = scale * 1.15, scale
    draw.ellipse(
        [cx - pw, cy - ph * 0.55, cx + pw, cy + ph],
        fill=fill
    )

    # ── Toe-pad positions: evenly spaced above the main pad ──────────────────
    toe_r  = scale * 0.38
    toe_ry = scale * 0.42          # slightly taller than wide

    # Outer two toes are rotated outward a bit
    offsets = [
        (-scale * 1.0, -scale * 0.95),   # outer-left
        (-scale * 0.38, -scale * 1.30),  # inner-left
        ( scale * 0.38, -scale * 1.30),  # inner-right
        ( scale * 1.0, -scale * 0.95),   # outer-right
    ]
    for dx, dy in offsets:
        draw.ellipse(
            [cx + dx - toe_r, cy + dy - toe_ry,
             cx + dx + toe_r, cy + dy + toe_ry],
            fill=fill
        )


def rounded_rectangle(draw: ImageDraw.Draw, xy, radius: int, fill: tuple) -> None:
    """Draw a filled rounded rectangle (xy = [x0,y0,x1,y1])."""
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


# ── 1. icon.png  1024×1024, solid background (no transparency) ───────────────

def make_icon(size: int = 1024) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Green rounded-rectangle background (App-Store style)
    rr = int(size * 0.22)
    rounded_rectangle(draw, [0, 0, size, size], radius=rr, fill=PRIMARY + (255,))

    # White paw centred, big enough to fill ~55 % of canvas
    cx, cy = size / 2, size / 2 + size * 0.04
    draw_paw(draw, cx, cy, scale=size * 0.27, color=WHITE)

    # Accent dot (top-right) — subtle brand accent
    dot_r = int(size * 0.07)
    dot_cx = int(size * 0.72)
    dot_cy = int(size * 0.18)
    draw.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r],
        fill=ACCENT + (200,)
    )

    # Convert to RGB (no alpha) for the main icon
    result = Image.new("RGB", (size, size), (255, 255, 255))
    result.paste(img, mask=img.split()[3])
    return result


# ── 2. adaptive-icon.png  1024×1024, transparent background ──────────────────

def make_adaptive_icon(size: int = 1024) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Circular green background
    pad = int(size * 0.05)
    draw.ellipse([pad, pad, size - pad, size - pad], fill=PRIMARY + (255,))

    # White paw
    cx, cy = size / 2, size / 2 + size * 0.04
    draw_paw(draw, cx, cy, scale=size * 0.27, color=WHITE)

    # Accent dot
    dot_r  = int(size * 0.07)
    dot_cx = int(size * 0.72)
    dot_cy = int(size * 0.18)
    draw.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r],
        fill=ACCENT + (200,)
    )

    return img


# ── 3. favicon.png  64×64 ─────────────────────────────────────────────────────

def make_favicon(size: int = 64) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    rr = int(size * 0.22)
    rounded_rectangle(draw, [0, 0, size, size], radius=rr, fill=PRIMARY + (255,))

    cx, cy = size / 2, size / 2 + size * 0.04
    draw_paw(draw, cx, cy, scale=size * 0.27, color=WHITE)

    return img


# ── 4. splash.png  1284×2778 ─────────────────────────────────────────────────

def make_splash(width: int = 1284, height: int = 2778) -> Image.Image:
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Full green background
    draw.rectangle([0, 0, width, height], fill=PRIMARY + (255,))

    # Large centred paw
    cx, cy = width / 2, height / 2 - height * 0.05
    draw_paw(draw, cx, cy, scale=width * 0.24, color=WHITE, alpha=230)

    # "WoofWalks" wordmark below the paw (simple letter-box)
    # Draw a semi-transparent pill behind label area
    lw, lh = int(width * 0.72), int(height * 0.065)
    lx = (width - lw) // 2
    ly = int(cy + width * 0.35)
    draw.rounded_rectangle(
        [lx, ly, lx + lw, ly + lh],
        radius=lh // 2,
        fill=PRIMARY_DARK + (160,)
    )

    # Accent underline stripe at very bottom
    stripe_h = int(height * 0.012)
    draw.rectangle([0, height - stripe_h, width, height], fill=ACCENT + (255,))

    # Convert to RGB (splash screens are typically opaque)
    result = Image.new("RGB", (width, height), (255, 255, 255))
    result.paste(img, mask=img.split()[3])
    return result


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    assets = "assets"

    print("Generating assets/icon.png (1024x1024, RGB)…")
    make_icon(1024).save(f"{assets}/icon.png", "PNG", optimize=True)

    print("Generating assets/adaptive-icon.png (1024x1024, RGBA)…")
    make_adaptive_icon(1024).save(f"{assets}/adaptive-icon.png", "PNG", optimize=True)

    print("Generating assets/favicon.png (64x64, RGBA)…")
    make_favicon(64).save(f"{assets}/favicon.png", "PNG", optimize=True)

    print("Generating assets/splash.png (1284x2778, RGB)…")
    make_splash(1284, 2778).save(f"{assets}/splash.png", "PNG", optimize=True)

    print("Done! All assets written to assets/")
