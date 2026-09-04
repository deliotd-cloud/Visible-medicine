"""Three dark Signature-family films using existing CC0 scans and approved art.

Nothing in this renderer synthesizes anatomy or redraws the identity. These are
branding compositions, not diagnostic or teaching reconstructions. The current
Signature v5 is kept untouched. Run --stills to review, or --only aperture/glide/
lumen to export one film. Source media and render runtime stay outside the app.
"""
from pathlib import Path
import argparse
import importlib.util
import subprocess
import wave

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

SPEC = importlib.util.spec_from_file_location('signature_base', Path(__file__).with_name('render-signature-refined.py'))
base = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(base)
W, H, FPS = base.W, base.H, 60
WORK, OUTPUT, FFMPEG, LANCZOS = base.WORK, base.OUTPUT, base.FFMPEG, base.LANCZOS
smooth, glide, place = base.smooth, base.glide, base.place
VERSION = 'v6'
STUDIES = {'aperture': 5.4, 'glide': 5.4, 'lumen': 5.6}


def version_for(name):
    return 'v8' if name == 'glide' else VERSION


def prepare():
    assets = base.prepare(dark=True)
    # Flat charcoal replaces Glide's quantized radial glow. Static, monochrome
    # one-level grain gives a quiet matte finish without rings or moving noise.
    grain = np.clip(np.random.default_rng(42).normal(0, .55, (H, W, 1)), -1, 1)
    matte = np.rint(np.array([3, 10, 16]) + grain).astype(np.uint8)
    assets['glide_background'] = Image.fromarray(matte).convert('RGBA')
    assets['logo'] = Image.open(base.PROJECT / 'public/brand/approved/visible-medicine-lockup-dark.png').convert('RGBA')
    assets['font'] = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 28)
    return assets


def background_for(name, assets):
    if name == 'glide':
        return assets.get('glide_background', assets['background'])
    return assets['background']


def photograph(image, size, zoom=1):
    """Fit the actual scan into a black, softly feathered photographic plate."""
    sw, sh = size
    photo = Image.new('RGB', size)
    fit = ImageOps.contain(image, (round(sw * .94 * zoom), round(sh * .94 * zoom)), LANCZOS)
    photo.paste(fit, ((sw - fit.width) // 2, (sh - fit.height) // 2))
    yy, xx = np.mgrid[0:sh, 0:sw].astype(np.float32)
    edges = np.minimum(np.minimum(xx, sw - 1 - xx) / 50, np.minimum(yy, sh - 1 - yy) / 44)
    mask = Image.fromarray(np.uint8(np.clip(edges, 0, 1) * 255))
    return Image.composite(photo, Image.new('RGB', size), mask)


def screen_photo(frame, photo, xy, opacity):
    """Screen black pixels directly into the background: no rectangular matte."""
    x, y = map(round, xy)
    region = frame.crop((x, y, x + photo.width, y + photo.height)).convert('RGB')
    lit = ImageChops.screen(region, photo.convert('RGB'))
    place(frame, lit, (x, y), opacity)


def scan_sequence(t, a, size, transition='wipe', zoom=1):
    photos = [photograph(a['chest'], size, zoom),
              photograph(base.slice_at(a['ct'], (t - .9) / .9), size, zoom),
              photograph(base.slice_at(a['mri'], (t - 1.85) / .9), size, zoom)]
    if t < 1.75:
        old, new, p = photos[0], photos[1], (t - 1.0) / .26
    else:
        old, new, p = photos[1], photos[2], (t - 1.9) / .28
    if transition == 'wipe':
        return base.wipe(old, new, p)
    p = smooth(p)
    # Brief focus pulls separate the modalities without a conspicuous transition.
    softness = float(np.sin(np.pi * p) * 4)
    return Image.blend(old, new, p).filter(ImageFilter.GaussianBlur(softness))


def rounded_mask(size, radius):
    scale = 3
    mask = Image.new('L', (size[0] * scale, size[1] * scale))
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, mask.width - 1, mask.height - 1), radius=radius * scale, fill=255)
    return mask.resize(size, LANCZOS)


def outline(size):
    """A single hairline teal aperture, not a second brand mark."""
    sw, sh = size
    scale = 3
    layer = Image.new('RGBA', (sw * scale, sh * scale))
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle((2 * scale, 2 * scale, (sw - 3) * scale, (sh - 3) * scale),
                           radius=min(22, sh / 2 - 3) * scale,
                           outline=(40, 191, 177, 210), width=2 * scale)
    return layer.resize(size, LANCZOS)


def tagline(frame, a, progress):
    if progress <= 0:
        return
    layer = Image.new('RGBA', (W, H))
    ImageDraw.Draw(layer).text((W / 2, 685 + (1 - progress) * 6), 'Where medicine becomes visible.',
                               anchor='mt', font=a['font'], fill=(165, 192, 195, 255))
    place(frame, layer, (0, 0), progress)


def identity(frame, a, progress, blur=0):
    if progress <= 0:
        return
    logo = a['logo']
    if blur > 0:
        # Padding avoids cutting off the exact art during a brief focus pull.
        pad = 28
        layer = Image.new('RGBA', (logo.width + pad * 2, logo.height + pad * 2))
        layer.alpha_composite(logo, (pad, pad))
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
        xy = (a['logo_position'][0] - pad, a['logo_position'][1] - pad + (1 - progress) * 8)
    else:
        layer = logo
        xy = (a['logo_position'][0], a['logo_position'][1] + (1 - progress) * 8)
    place(frame, layer, xy, progress)


def aperture(t, a):
    frame = a['background'].copy()
    opening = smooth(t / .58)
    closing = smooth((t - 2.68) / .62)
    width = round(640 * (1 - closing) + 180 * closing)
    height = max(8, round(8 + 540 * opening * (1 - closing)))
    x, y = (W - width) / 2, 480 - height / 2
    visibility = smooth(t / .18) * (1 - smooth((t - 3.13) / .25))
    if visibility > 0:
        photo = scan_sequence(t, a, (640, 540), zoom=1 + min(t, 2.7) * .018)
        # Aperture clips a fixed photographic field; it never squashes anatomy.
        full = Image.new('RGB', (W, H))
        full.paste(photo, ((W - photo.width) // 2, 480 - photo.height // 2))
        clipped = full.crop((round(x), round(y), round(x) + width, round(y) + height))
        clipped = Image.composite(clipped, Image.new('RGB', clipped.size), rounded_mask(clipped.size, min(20, height / 2)))
        screen_photo(frame, clipped, (x, y), visibility)
        place(frame, outline((width, height)), (x, y), visibility)
    p = smooth((t - 3.28) / .68)
    identity(frame, a, p)
    tagline(frame, a, smooth((t - 3.99) / .46))
    return frame.convert('RGB')


def glide_frame(size, settle, transition, a):
    """Keep the same four corners visible all the way into the native logo.

    Each approved corner is scaled uniformly and stays anchored to its own edge.
    This avoids the old hand-off between differently sized rectangular frames.
    Premultiplied-alpha blending prevents a dark dip during the material change.
    """
    width, height = size
    corners = a['corners']
    mw, mh = corners.size
    span = round(104 * (1 - settle) + 58 * settle)
    native = Image.new('RGBA', size)
    for box, xy in (
        ((0, 0, 58, 58), (0, 0)),
        ((mw - 58, 0, mw, 58), (width - span, 0)),
        ((0, mh - 58, 58, mh), (0, height - span)),
        ((mw - 58, mh - 58, mw, mh), (width - span, height - span)),
    ):
        native.alpha_composite(corners.crop(box).resize((span, span), LANCZOS), xy)
    if transition >= 1:
        return native
    scanning = base.thin_brackets(size)
    if transition <= 0:
        return scanning
    return Image.blend(scanning.convert('RGBa'), native.convert('RGBa'), transition).convert('RGBA')


def glide_film(t, a):
    frame = background_for('glide', a).copy()
    entrance = smooth(t / .42)
    # Zero velocity and acceleration at both ends; no sudden launch at 2.68 s.
    settle = smooth((t - 2.68) / 1.12)
    mark = a['mark']
    width = round(800 * (1 - settle) + mark.width * settle)
    height = round(480 * (1 - settle) + mark.height * settle)
    mx = a['logo_position'][0] + a['mark_box'][0]
    my = a['logo_position'][1] + a['mark_box'][1]
    cx = W / 2 * (1 - settle) + (mx + mark.width / 2) * settle
    cy = (484 + (1 - entrance) * 10) * (1 - settle) + (my + mark.height / 2) * settle
    x, y = cx - width / 2, cy - height / 2
    panel_opacity = entrance * (1 - smooth((t - 2.88) / .58))
    if panel_opacity > 0:
        spacing = 816
        movement = smooth((t - .82) / .48) + smooth((t - 1.75) / .48)
        plate_size = (740, 440)
        viewport = Image.new('RGB', (776, 456))
        photos = [photograph(a['chest'], plate_size, 1.025),
                  photograph(base.slice_at(a['ct'], (t - .9) / .9), plate_size),
                  photograph(base.slice_at(a['mri'], (t - 1.85) / .9), plate_size, 1.03)]
        for i, photo in enumerate(photos):
            viewport.paste(photo, (round((viewport.width - photo.width) / 2 + (i - movement) * spacing), 8))
        # The portal changes shape, but each image is fit without aspect distortion.
        fit = ImageOps.contain(viewport, (width - 24, height - 24), LANCZOS)
        screen_photo(frame, fit, (cx - fit.width / 2, cy - fit.height / 2), panel_opacity)
    transition = smooth((t - 2.86) / .72)
    place(frame, glide_frame((width, height), settle, transition, a), (x, y), entrance)
    # Only the inner symbol appears; the outer framing is already in place.
    symbol_opacity = smooth((t - 3.27) / .5)
    if symbol_opacity > 0:
        fitted_center = ImageOps.contain(a['center'], (width, height), LANCZOS)
        place(frame, fitted_center, (cx - fitted_center.width / 2, cy - fitted_center.height / 2), symbol_opacity)
    wp = smooth((t - 3.68) / .55)
    if wp > 0:
        words = a['words'].copy()
        reveal = np.clip((wp * (words.width + 48) - np.arange(words.width)[None, :]) / 48, 0, 1)
        mask = Image.fromarray(np.uint8(np.repeat(reveal, words.height, axis=0) * 255))
        words.putalpha(ImageChops.multiply(words.getchannel('A'), mask))
        place(frame, words, (a['logo_position'][0] + a['word_start'], a['logo_position'][1]))
    tagline(frame, a, smooth((t - 4.02) / .46))
    return frame.convert('RGB')


def lumen(t, a):
    frame = a['background'].copy()
    entrance = smooth(t / .55)
    departure = smooth((t - 2.75) / .68)
    if entrance * (1 - departure) > 0:
        size = (round(880 - t * 12 - departure * 90), round(686 - t * 9 - departure * 70))
        photo = scan_sequence(t, a, size, transition='focus', zoom=.99)
        # Broad, low-contrast falloff removes the plate entirely for a frameless cut.
        yy, xx = np.mgrid[0:size[1], 0:size[0]].astype(np.float32)
        radius = ((xx - size[0] / 2) / (size[0] * .55)) ** 4 + ((yy - size[1] / 2) / (size[1] * .55)) ** 4
        mask = Image.fromarray(np.uint8(np.clip(1 - radius, 0, 1) * 255))
        photo = Image.composite(photo, Image.new('RGB', size), mask)
        screen_photo(frame, photo, ((W - size[0]) / 2, 478 - size[1] / 2), entrance * (1 - departure))
    p = smooth((t - 3.18) / .9)
    identity(frame, a, p, blur=(1 - p) * 7)
    tagline(frame, a, smooth((t - 4.12) / .48))
    return frame.convert('RGB')


RENDERERS = {'aperture': aperture, 'glide': glide_film, 'lumen': lumen}


def soundtrack(name, duration):
    rate = 48000
    t = np.arange(round(duration * rate)) / rate
    # Original quiet tonal bed; no speech, medical alarms or third-party samples.
    signal = (.011 * np.sin(2 * np.pi * 130.8128 * t) + .004 * np.sin(2 * np.pi * 196 * t)) * np.sin(np.pi * t / duration) ** 2
    dt = np.maximum(t - 3.4, 0)
    signal += .015 * np.sin(2 * np.pi * 523.251 * dt) * (1 - np.exp(-dt * 12)) * np.exp(-dt * 2.8) * (t >= 3.4)
    signal *= np.clip((duration - t) / .4, 0, 1)
    path = WORK / f'{name}-{version_for(name)}.wav'
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes((np.column_stack((signal, signal)) * 32767).astype('<i2').tobytes())
    return path


def verify_identity(name, a):
    actual = RENDERERS[name](STUDIES[name] - .05, a)
    expected = background_for(name, a).copy()
    expected.alpha_composite(a['logo'], a['logo_position'])
    x, y = a['logo_position']
    box = (x, y, x + a['logo'].width, y + a['logo'].height)
    error = np.abs(np.array(actual.crop(box)).astype(int) - np.array(expected.convert('RGB').crop(box)).astype(int))
    assert error.max() == 0, f'{name}: native logo mismatch {error.max()}'
    print(f'{name}: final logo is pixel-exact before encoding', flush=True)


def export(name, a):
    renderer, duration = RENDERERS[name], STUDIES[name]
    version = version_for(name)
    movie = OUTPUT / f'{name}-{version}.mp4'
    process = subprocess.Popen([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
        '-i', str(soundtrack(name, duration)), '-c:v', 'libx264', '-crf', '20', '-preset', 'slow',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
        '-t', str(duration), str(movie)], stdin=subprocess.PIPE)
    try:
        for i in range(round(duration * FPS)):
            process.stdin.write(renderer(i / FPS, a).tobytes())
            if i % 60 == 0:
                print(f'{name}: {i}/{round(duration * FPS)} frames', flush=True)
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError(f'{name} encoding failed')
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(movie),
        '-vf', 'scale=1280:720', '-an', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(OUTPUT / f'{name}-silent-{version}.mp4')], check=True)
    renderer(2.45, a).save(OUTPUT / f'{name}-poster-{version}.webp', quality=90)
    renderer(duration - .2, a).save(OUTPUT / f'{name}-logo-poster-{version}.webp', quality=90)
    print(f'{name}: ready ({movie.stat().st_size:,} bytes)', flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--stills', action='store_true')
    parser.add_argument('--only', choices=STUDIES)
    args = parser.parse_args()
    a = prepare()
    for name in ([args.only] if args.only else STUDIES):
        version = version_for(name)
        verify_identity(name, a)
        sheet = Image.new('RGB', (1600, 600))
        for i, t in enumerate((.65, 1.5, 2.45, 3.12, 3.82, 4.9)):
            shot = RENDERERS[name](t, a)
            shot.save(WORK / f'{name}-{version}-{t:.2f}.jpg', quality=95)
            sheet.paste(shot.resize((533, 300), LANCZOS), ((i % 3) * 533, (i // 3) * 300))
        sheet.save(WORK / f'{name}-storyboard-{version}.jpg', quality=94)
        if not args.stills:
            export(name, a)


if __name__ == '__main__':
    main()
