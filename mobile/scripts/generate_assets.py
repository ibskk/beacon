"""Generate Beacon app icon, Android adaptive icon layers and splash image.

Run from the mobile/ directory:  python3 scripts/generate_assets.py
Requires Pillow (pip install pillow).
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw

LIME = (181, 240, 0, 255)
INK = (11, 12, 14, 255)
WHITE = (255, 255, 255, 255)
CLEAR = (0, 0, 0, 0)

OUT = Path(__file__).resolve().parent.parent / "assets"
SUPERSAMPLE = 4


def draw_pin(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float, ink, line) -> None:
    """Draw a map pin whose head is centred at (cx, cy); size is the head diameter."""
    r = size / 2
    # Tail: triangle whose sides are tangent to the head circle.
    d = r * 1.75
    tip_y = cy + d
    ty = r * r / d
    tx = math.sqrt(r * r - ty * ty)
    draw.polygon([(cx - tx, cy + ty), (cx + tx, cy + ty), (cx, tip_y)], fill=ink)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ink)

    # Pitch inside the head: outline, halfway line and centre circle.
    pw, ph = r * 1.05, r * 0.72
    stroke = max(2, int(r * 0.075))
    draw.rounded_rectangle(
        [cx - pw / 2, cy - ph / 2, cx + pw / 2, cy + ph / 2],
        radius=r * 0.06,
        outline=line,
        width=stroke,
    )
    draw.line([(cx, cy - ph / 2), (cx, cy + ph / 2)], fill=line, width=stroke)
    cr = ph * 0.22
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], outline=line, width=stroke)


def render(size: int, bg, pin_scale: float, transparent: bool = False) -> Image.Image:
    s = size * SUPERSAMPLE
    img = Image.new("RGBA", (s, s), CLEAR if transparent else bg)
    draw = ImageDraw.Draw(img)
    head = s * pin_scale
    # Pin spans from cy - r to cy + 1.75r; centre that span.
    cy = s / 2 - head * 0.1875
    draw_pin(draw, s / 2, cy, head, INK, WHITE)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(exist_ok=True)

    icon = render(1024, LIME, 0.46).convert("RGB")  # iOS icon: no alpha channel
    icon.save(OUT / "icon.png")

    # Adaptive icon foreground must keep content inside the 66% safe zone.
    render(1024, LIME, 0.34, transparent=True).save(OUT / "adaptive-icon.png")
    Image.new("RGB", (1024, 1024), LIME[:3]).save(OUT / "adaptive-icon-background.png")

    # Monochrome layer for Android 13 themed icons: same silhouette, single colour.
    mono = render(1024, LIME, 0.34, transparent=True)
    alpha = mono.split()[3]
    solid = Image.new("RGBA", mono.size, WHITE)
    solid.putalpha(alpha)
    solid.save(OUT / "adaptive-icon-monochrome.png")

    # Splash: pin only, transparent, shown centred on the lime background.
    render(1024, LIME, 0.62, transparent=True).save(OUT / "splash-icon.png")

    render(48, LIME, 0.46).convert("RGB").save(OUT / "favicon.png")


if __name__ == "__main__":
    main()
