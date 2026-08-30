from __future__ import annotations

import base64
import csv
import hashlib
import shutil
import textwrap
import zipfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "work" / "visible-medicine-logo-concepts" / "selected-scan-frame-variants"
OUTPUT_DIR = ROOT / "work" / "Visible-Medicine-Brand-Pack-v1"
ZIP_PATH = ROOT / "work" / "Visible-Medicine-Brand-Pack-v1.zip"


@dataclass(frozen=True)
class Variant:
    key: str
    source_name: str
    background: tuple[int, int, int]
    alpha_low: float
    alpha_high: float
    mark_label: str


VARIANTS = (
    Variant(
        key="light",
        source_name="01-light-balanced.png",
        background=(248, 247, 242),
        alpha_low=5.0,
        alpha_high=32.0,
        mark_label="dark-ink",
    ),
    Variant(
        key="dark",
        source_name="02-dark-inline-endorsement.png",
        background=(4, 26, 35),
        alpha_low=6.0,
        alpha_high=28.0,
        mark_label="light-ink",
    ),
)

PALETTE = {
    "Ivory": "#F8F7F2",
    "Midnight": "#041A23",
    "Deep ink": "#002631",
    "Visible teal": "#16C6B2",
    "Signal lime": "#D2DC16",
}


def ensure_output_is_new() -> None:
    if OUTPUT_DIR.exists() or ZIP_PATH.exists():
        raise SystemExit(
            "Output already exists. Move or rename the existing v1 pack before rebuilding; "
            "the generator will not overwrite a delivered brand pack."
        )
    for relative in (
        "SOURCE-MASTERS",
        "PNG/FULL-LOCKUP",
        "PNG/TRANSPARENT",
        "PNG/MARK",
        "PNG/ICONS",
        "JPG",
        "WEB",
        "SVG",
        "PREVIEW",
    ):
        (OUTPUT_DIR / relative).mkdir(parents=True, exist_ok=True)


def sampled_background(image: Image.Image) -> tuple[int, int, int]:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    h, w, _ = rgb.shape
    edge = max(8, min(h, w) // 60)
    samples = np.concatenate(
        (
            rgb[:edge, :, :].reshape(-1, 3),
            rgb[-edge:, :, :].reshape(-1, 3),
            rgb[:, :edge, :].reshape(-1, 3),
            rgb[:, -edge:, :].reshape(-1, 3),
        ),
        axis=0,
    )
    median = np.median(samples, axis=0).round().astype(np.uint8)
    return tuple(int(value) for value in median)


def make_transparent(
    image: Image.Image,
    background: tuple[int, int, int],
    low: float,
    high: float,
) -> Image.Image:
    """Remove the approved canvas while retaining antialiased artwork edges.

    These derivatives are intentionally secondary to the untouched source masters.
    A smooth alpha ramp avoids the hard outline produced by simple colour-keying.
    """

    source = np.asarray(image.convert("RGB"), dtype=np.float32)
    bg = np.array(background, dtype=np.float32).reshape(1, 1, 3)
    distance = np.linalg.norm(source - bg, axis=2)
    t = np.clip((distance - low) / (high - low), 0.0, 1.0)
    alpha = t * t * (3.0 - 2.0 * t)

    # Remove the matte colour from partially transparent edge pixels. This makes
    # the export cleaner when used over a canvas close to its intended theme.
    safe_alpha = np.maximum(alpha[..., None], 0.08)
    foreground = (source - (1.0 - alpha[..., None]) * bg) / safe_alpha
    foreground = np.clip(foreground, 0.0, 255.0)
    foreground[alpha >= 0.995] = source[alpha >= 0.995]

    rgba = np.dstack((foreground.astype(np.uint8), np.rint(alpha * 255).astype(np.uint8)))
    rgba[alpha <= 0.005, :3] = 0
    return Image.fromarray(rgba, mode="RGBA")


def foreground_bbox(
    image: Image.Image,
    background: tuple[int, int, int],
    threshold: float,
    x_limit: int | None = None,
) -> tuple[int, int, int, int]:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    if x_limit is not None:
        rgb = rgb[:, :x_limit, :]
    bg = np.array(background, dtype=np.float32).reshape(1, 1, 3)
    mask = np.linalg.norm(rgb - bg, axis=2) >= threshold
    rows, cols = np.where(mask)
    if len(rows) == 0:
        raise RuntimeError("No foreground pixels detected")
    return int(cols.min()), int(rows.min()), int(cols.max() + 1), int(rows.max() + 1)


def padded_bbox(
    bbox: tuple[int, int, int, int],
    image_size: tuple[int, int],
    pad: int,
) -> tuple[int, int, int, int]:
    left, top, right, bottom = bbox
    width, height = image_size
    return (
        max(0, left - pad),
        max(0, top - pad),
        min(width, right + pad),
        min(height, bottom + pad),
    )


def resize_to_width(image: Image.Image, width: int) -> Image.Image:
    height = max(1, round(image.height * width / image.width))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def fit_on_square(
    artwork: Image.Image,
    size: int,
    background: tuple[int, int, int] | None,
    scale: float = 0.76,
) -> Image.Image:
    mode = "RGBA" if background is None else "RGB"
    fill = (0, 0, 0, 0) if background is None else background
    canvas = Image.new(mode, (size, size), fill)
    max_side = max(1, round(size * scale))
    ratio = min(max_side / artwork.width, max_side / artwork.height)
    target = artwork.resize(
        (max(1, round(artwork.width * ratio)), max(1, round(artwork.height * ratio))),
        Image.Resampling.LANCZOS,
    )
    if mode == "RGB":
        overlay = Image.new("RGBA", canvas.size, (*background, 255))
        overlay.alpha_composite(target, ((size - target.width) // 2, (size - target.height) // 2))
        return overlay.convert("RGB")
    canvas.alpha_composite(target, ((size - target.width) // 2, (size - target.height) // 2))
    return canvas


def save_png(image: Image.Image, path: Path) -> None:
    image.save(path, format="PNG", optimize=True)


def save_svg_wrapper(image_path: Path, destination: Path, title: str) -> None:
    image = Image.open(image_path)
    width, height = image.size
    encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">
  <title id="title">{title}</title>
  <desc id="desc">Faithful raster-backed SVG export of the approved Visible Medicine logo artwork.</desc>
  <image width="{width}" height="{height}" x="0" y="0" preserveAspectRatio="xMidYMid meet"
         href="data:image/png;base64,{encoded}" xlink:href="data:image/png;base64,{encoded}" />
</svg>
'''
    destination.write_text(svg, encoding="utf-8", newline="\n")


def contact_sheet(items: list[tuple[str, Image.Image]]) -> Image.Image:
    sheet_width = 1800
    margin = 80
    panel_gap = 44
    title_height = 68
    panel_width = sheet_width - margin * 2
    panel_height = 420
    sheet_height = margin + len(items) * (panel_height + title_height + panel_gap)
    sheet = Image.new("RGB", (sheet_width, sheet_height), (232, 236, 235))
    draw = ImageDraw.Draw(sheet)
    try:
        title_font = ImageFont.truetype("arialbd.ttf", 32)
    except OSError:
        title_font = ImageFont.load_default()

    y = margin
    for label, image in items:
        draw.text((margin, y), label, fill=(4, 26, 35), font=title_font)
        y += title_height
        is_dark = "Dark" in label
        panel_colour = (4, 26, 35) if is_dark else (248, 247, 242)
        panel = Image.new("RGB", (panel_width, panel_height), panel_colour)
        display = image.convert("RGBA")
        max_width = panel_width - 120
        max_height = panel_height - 90
        ratio = min(max_width / display.width, max_height / display.height)
        display = display.resize(
            (max(1, round(display.width * ratio)), max(1, round(display.height * ratio))),
            Image.Resampling.LANCZOS,
        )
        panel_rgba = panel.convert("RGBA")
        panel_rgba.alpha_composite(
            display,
            ((panel_width - display.width) // 2, (panel_height - display.height) // 2),
        )
        sheet.paste(panel_rgba.convert("RGB"), (margin, y))
        y += panel_height + panel_gap
    return sheet


def write_readme() -> None:
    palette_lines = "\n".join(f"- **{name}:** `{value}`" for name, value in PALETTE.items())
    readme = f"""# Visible Medicine brand pack v1

This pack contains the approved matched logo system for **Visible Medicine — by Elivion**.

## Approved system

- **Light master:** dark wordmark on an ivory canvas, with the typographic `by Elivion` endorsement below the start of the wordmark.
- **Dark master:** light wordmark on a midnight canvas, with a divider and inline typographic `by Elivion` endorsement.
- **Viewer attribution:** use `Powered by Didanix` separately in the imaging viewer. It is not part of the primary Visible Medicine logo.
- Do **not** replace the typographic endorsement with the Elivion `e` emblem.

## Which files to use

- `SOURCE-MASTERS/` — untouched approved source artwork. Keep these as the visual source of truth.
- `PNG/FULL-LOCKUP/` — exact-background PNG exports for presentations, documents and general use.
- `PNG/TRANSPARENT/` — web-optimised transparent derivatives for use on a closely matching light or dark background.
- `PNG/MARK/` — symbol-only exports, with both transparent and approved-background versions.
- `PNG/ICONS/` — favicon, app icon, maskable icon, Apple touch icon and social avatar exports.
- `JPG/` — high-quality solid-background exports for software that does not accept PNG.
- `WEB/` — lossless WebP and ICO exports.
- `SVG/` — faithful raster-backed SVG containers. Read `SVG/README.md` before use.
- `PREVIEW/` — contact sheet for rapid visual checking.

## Important SVG status

The selected logo was approved from high-resolution raster artwork; no original Bézier/vector master was supplied. The SVG files therefore embed the approved PNG artwork so they remain visually faithful. They are valid SVG assets, but they are **not true infinitely scalable vector reconstructions**. This is deliberate: an automatic trace or hand redraw would change the mark and repeat the quality problem already rejected during review.

For large-format print, embroidery, cut vinyl or other fabrication, commission a careful vector master against the approved PNG source and approve it visually before replacing these files.

## Clear space and minimum size

- Keep clear space around the full lockup equal to at least the diameter of the lime dot in the symbol.
- Use the full lockup at **240 px wide or larger** on screen.
- Below that size, use the symbol-only mark.
- Do not stretch, recolour, retype, rearrange or place the logo over visually busy imagery.

## Working colour palette

These sampled screen colours are practical digital references; they are not a substitute for a future print colour proof.

{palette_lines}

## Naming

- Product: `Visible Medicine`
- Endorsement: `by Elivion`
- Imaging viewer attribution: `Powered by Didanix`
- Tagline: `Where medicine becomes visible.`

## Rights and governance

This pack does not itself grant trademark, font, model-release or third-party rights. Retain the original design records and complete normal brand and trademark clearance before public launch.
"""
    (OUTPUT_DIR / "README.md").write_text(readme, encoding="utf-8", newline="\n")

    svg_readme = """# SVG export note

These SVGs are faithful wrappers around the approved high-resolution PNG artwork. They preserve the selected design exactly and avoid an inaccurate redraw.

They are suitable for websites, office documents and other workflows that require an `.svg` container. They are not true path-based vector masters and will not create additional detail beyond the embedded PNG resolution.

Do not extract, auto-trace or simplify the symbol and call the result an approved master. A future path-based vector master should be commissioned and visually approved against `SOURCE-MASTERS/`.
"""
    (OUTPUT_DIR / "SVG" / "README.md").write_text(svg_readme, encoding="utf-8", newline="\n")


def write_manifest() -> None:
    rows: list[tuple[str, int, str]] = []
    for path in sorted(OUTPUT_DIR.rglob("*")):
        if path.is_file() and path.name != "manifest-sha256.csv":
            rows.append(
                (
                    path.relative_to(OUTPUT_DIR).as_posix(),
                    path.stat().st_size,
                    hashlib.sha256(path.read_bytes()).hexdigest(),
                )
            )
    with (OUTPUT_DIR / "manifest-sha256.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(("file", "bytes", "sha256"))
        writer.writerows(rows)


def build() -> None:
    ensure_output_is_new()
    previews: list[tuple[str, Image.Image]] = []
    icon_sources: dict[str, Image.Image] = {}

    for variant in VARIANTS:
        source_path = SOURCE_DIR / variant.source_name
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        image = Image.open(source_path).convert("RGB")
        measured_bg = sampled_background(image)
        background = tuple(
            round((expected + measured) / 2)
            for expected, measured in zip(variant.background, measured_bg, strict=True)
        )

        source_destination = (
            OUTPUT_DIR / "SOURCE-MASTERS" / f"visible-medicine-{variant.key}-approved-original.png"
        )
        shutil.copy2(source_path, source_destination)

        whole_bbox = padded_bbox(
            foreground_bbox(image, background, threshold=variant.alpha_high + 2),
            image.size,
            pad=42,
        )
        mark_limit = round(image.width * 0.235)
        mark_bbox = padded_bbox(
            foreground_bbox(
                image,
                background,
                threshold=variant.alpha_high + 2,
                x_limit=mark_limit,
            ),
            image.size,
            pad=32,
        )

        trimmed_solid = image.crop(whole_bbox)
        transparent = make_transparent(image, background, variant.alpha_low, variant.alpha_high)
        trimmed_transparent = transparent.crop(whole_bbox)
        mark_transparent = transparent.crop(mark_bbox)
        icon_sources[variant.key] = mark_transparent

        original_name = f"visible-medicine-{variant.key}-master-{image.width}px.png"
        save_png(image, OUTPUT_DIR / "PNG" / "FULL-LOCKUP" / original_name)
        for width in (2048, 1024, 512):
            resized = resize_to_width(trimmed_solid, min(width, trimmed_solid.width))
            save_png(
                resized,
                OUTPUT_DIR / "PNG" / "FULL-LOCKUP" / f"visible-medicine-{variant.key}-{resized.width}px.png",
            )

        for width in (2048, 1024, 512):
            resized = resize_to_width(trimmed_transparent, min(width, trimmed_transparent.width))
            save_png(
                resized,
                OUTPUT_DIR
                / "PNG"
                / "TRANSPARENT"
                / f"visible-medicine-{variant.key}-transparent-{resized.width}px.png",
            )

        for size in (1024, 512, 256, 128):
            mark_on_background = fit_on_square(mark_transparent, size, background, scale=0.76)
            mark_on_transparent = fit_on_square(mark_transparent, size, None, scale=0.76)
            save_png(
                mark_on_background,
                OUTPUT_DIR
                / "PNG"
                / "MARK"
                / f"visible-medicine-mark-{variant.key}-background-{size}.png",
            )
            save_png(
                mark_on_transparent,
                OUTPUT_DIR
                / "PNG"
                / "MARK"
                / f"visible-medicine-mark-{variant.mark_label}-transparent-{size}.png",
            )

        resize_to_width(trimmed_solid, min(2048, trimmed_solid.width)).save(
            OUTPUT_DIR / "JPG" / f"visible-medicine-{variant.key}-2048px.jpg",
            format="JPEG",
            quality=95,
            subsampling=0,
            optimize=True,
        )
        resize_to_width(trimmed_solid, min(2048, trimmed_solid.width)).save(
            OUTPUT_DIR / "WEB" / f"visible-medicine-{variant.key}-2048px.webp",
            format="WEBP",
            lossless=True,
            method=6,
        )
        fit_on_square(mark_transparent, 512, background, scale=0.76).save(
            OUTPUT_DIR / "WEB" / f"visible-medicine-mark-{variant.key}-512.webp",
            format="WEBP",
            lossless=True,
            method=6,
        )

        previews.append((f"{variant.key.title()} approved full lockup", trimmed_solid))
        previews.append((f"{variant.key.title()} transparent derivative", trimmed_transparent))

        save_svg_wrapper(
            source_destination,
            OUTPUT_DIR / "SVG" / f"visible-medicine-{variant.key}-approved-faithful.svg",
            f"Visible Medicine {variant.key} approved logo",
        )
        transparent_2048 = OUTPUT_DIR / "PNG" / "TRANSPARENT" / (
            f"visible-medicine-{variant.key}-transparent-{min(2048, trimmed_transparent.width)}px.png"
        )
        save_svg_wrapper(
            transparent_2048,
            OUTPUT_DIR / "SVG" / f"visible-medicine-{variant.key}-transparent-faithful.svg",
            f"Visible Medicine {variant.key} transparent logo",
        )
        mark_1024 = OUTPUT_DIR / "PNG" / "MARK" / (
            f"visible-medicine-mark-{variant.mark_label}-transparent-1024.png"
        )
        save_svg_wrapper(
            mark_1024,
            OUTPUT_DIR / "SVG" / f"visible-medicine-mark-{variant.mark_label}-faithful.svg",
            f"Visible Medicine {variant.mark_label} symbol",
        )

    light_mark = icon_sources["light"]
    dark_mark = icon_sources["dark"]
    dark_background = VARIANTS[1].background
    light_background = VARIANTS[0].background

    for size in (16, 32, 48):
        save_png(
            fit_on_square(dark_mark, size, dark_background, scale=0.78),
            OUTPUT_DIR / "PNG" / "ICONS" / f"favicon-{size}x{size}.png",
        )
    save_png(
        fit_on_square(dark_mark, 180, dark_background, scale=0.74),
        OUTPUT_DIR / "PNG" / "ICONS" / "apple-touch-icon-180x180.png",
    )
    for size in (192, 512):
        save_png(
            fit_on_square(dark_mark, size, dark_background, scale=0.74),
            OUTPUT_DIR / "PNG" / "ICONS" / f"pwa-icon-{size}x{size}.png",
        )
    save_png(
        fit_on_square(dark_mark, 512, dark_background, scale=0.58),
        OUTPUT_DIR / "PNG" / "ICONS" / "pwa-maskable-icon-512x512.png",
    )
    save_png(
        fit_on_square(light_mark, 800, light_background, scale=0.68),
        OUTPUT_DIR / "PNG" / "ICONS" / "social-avatar-light-800x800.png",
    )
    save_png(
        fit_on_square(dark_mark, 800, dark_background, scale=0.68),
        OUTPUT_DIR / "PNG" / "ICONS" / "social-avatar-dark-800x800.png",
    )

    ico_frames = [
        fit_on_square(dark_mark, size, dark_background, scale=0.78)
        for size in (16, 32, 48, 64, 128, 256)
    ]
    ico_frames[-1].save(
        OUTPUT_DIR / "WEB" / "visible-medicine-favicon.ico",
        format="ICO",
        append_images=ico_frames[:-1],
        sizes=[(frame.width, frame.height) for frame in ico_frames],
    )

    preview = contact_sheet(previews)
    save_png(preview, OUTPUT_DIR / "PREVIEW" / "visible-medicine-brand-pack-contact-sheet.png")

    write_readme()
    write_manifest()

    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(OUTPUT_DIR.rglob("*")):
            if path.is_file():
                archive.write(path, Path(OUTPUT_DIR.name) / path.relative_to(OUTPUT_DIR))

    print(
        textwrap.dedent(
            f"""
            Brand pack created:
              {OUTPUT_DIR}
            Zip archive:
              {ZIP_PATH}
            Files:
              {sum(1 for path in OUTPUT_DIR.rglob('*') if path.is_file())}
            """
        ).strip()
    )


if __name__ == "__main__":
    build()
