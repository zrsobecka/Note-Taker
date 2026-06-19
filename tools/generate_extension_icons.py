from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "extension" / "icons"
SIZES = [16, 32, 48, 128]

BACKGROUND = "#111016"
BACKGROUND_EDGE = "#252033"
PURPLE = "#8b5cf6"
PURPLE_LIGHT = "#c4b5fd"
PURPLE_DARK = "#6d28d9"
LINE = "#ede9fe"


def scaled(points, scale):
    return [(int(x * scale), int(y * scale)) for x, y in points]


def draw_icon(size):
    scale = 4
    canvas = size * scale
    image = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    radius = max(3, int(canvas * 0.18))
    draw.rounded_rectangle(
        [0, 0, canvas - 1, canvas - 1],
        radius=radius,
        fill=BACKGROUND,
        outline=BACKGROUND_EDGE,
        width=max(1, scale),
    )

    pad = canvas * 0.24
    left = int(pad)
    top = int(canvas * 0.2)
    right = int(canvas * 0.76)
    bottom = int(canvas * 0.82)
    fold = int(canvas * 0.16)

    shadow_offset = max(1, int(canvas * 0.035))
    draw.rounded_rectangle(
        [left + shadow_offset, top + shadow_offset, right + shadow_offset, bottom + shadow_offset],
        radius=max(2, int(canvas * 0.06)),
        fill=(0, 0, 0, 75),
    )

    note_shape = [
        (left, top),
        (right - fold, top),
        (right, top + fold),
        (right, bottom),
        (left, bottom),
    ]
    draw.polygon(note_shape, fill=PURPLE)
    draw.line(note_shape + [(left, top)], fill=PURPLE_LIGHT, width=max(1, int(canvas * 0.018)))

    fold_shape = [
        (right - fold, top),
        (right - fold, top + fold),
        (right, top + fold),
    ]
    draw.polygon(fold_shape, fill=PURPLE_DARK)
    draw.line([(right - fold, top), (right - fold, top + fold), (right, top + fold)], fill=PURPLE_LIGHT, width=max(1, int(canvas * 0.012)))

    line_width = max(1, int(canvas * 0.022))
    line_left = int(left + canvas * 0.09)
    line_right = int(right - canvas * 0.1)
    line_y = int(top + canvas * 0.28)
    gap = int(canvas * 0.13)

    for index in range(3):
        y = line_y + index * gap
        end = line_right if index < 2 else int(line_right - canvas * 0.12)
        draw.rounded_rectangle(
            [line_left, y, end, y + line_width],
            radius=line_width,
            fill=LINE,
        )

    return image.resize((size, size), Image.Resampling.LANCZOS)


def main():
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        draw_icon(size).save(ICON_DIR / f"icon-{size}.png")
        print(f"Generated icon-{size}.png")


if __name__ == "__main__":
    main()

