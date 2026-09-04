"""Three separately directed splash films, for comparison before adoption.

Anatomy is sourced from existing CC0 scans and a licensed anatomical mesh.
Camera moves, lighting, typography and sound are original. See the provenance
and artistic/clinical distinction in docs/cinematic-splash-options.md.
"""
from pathlib import Path
import argparse
import importlib.util
import math
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps
from splash_3d import AnatomyRenderer

PROJECT = Path(__file__).resolve().parents[1]
WORK = PROJECT.parent / 'work' / 'cinematic-splash'
OUTPUT = PROJECT / 'public/media/splash'
SOURCES = WORK / 'sources'
sys.path.insert(0, str(WORK / 'minimal-runtime'))
import imageio_ffmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1920, 1080, 30
LANCZOS = Image.Resampling.LANCZOS
DURATIONS = {'reveal': 7.2, 'voyage': 6.8, 'signature': 5.6}

# Reuse the previously verified real-scan perspective projection, not its design.
spec = importlib.util.spec_from_file_location('first_film', PROJECT / 'scripts/render-splash-film.py')
old = importlib.util.module_from_spec(spec)
spec.loader.exec_module(old)
camera_image = old.camera_image


def ease(x):
    p = max(0., min(1., x))
    return p * p * (3 - 2 * p)


def fade(t, start, end, duration=.22):
    return ease((t - start) / duration) * ease((end - t) / duration)


def grade(image, color=(211, 227, 230), gamma=1.15):
    gray = ImageOps.autocontrast(image.convert('L'), cutoff=.35)
    gray = gray.point([round((i / 255) ** gamma * 255) for i in range(256)])
    return ImageOps.colorize(gray, (0, 0, 0), color)


def screen(frame, plate, amount=1):
    values = [round(i * max(0, min(1, amount))) for i in range(256)] * 3
    return ImageChops.screen(frame, plate.convert('RGB').point(values))


def composite(frame, plate, amount=1):
    plate = plate.copy().convert('RGBA')
    plate.putalpha(plate.getchannel('A').point([round(i * max(0, min(1, amount))) for i in range(256)]))
    return Image.alpha_composite(frame.convert('RGBA'), plate).convert('RGB')


def sequence(images, progress):
    position = max(0, min(.99999, progress)) * (len(images) - 1)
    i = int(position)
    return Image.blend(images[i], images[min(i + 1, len(images) - 1)], position - i)


def prepare():
    chest = grade(Image.open(SOURCES / 'chest.png').crop((100, 170, 2280, 1870)), gamma=1.6)
    chest.thumbnail((1700, 1500), LANCZOS)
    x, y = np.linspace(0, 1, chest.width)[None, :], np.linspace(0, 1, chest.height)[:, None]
    feather = np.minimum(np.clip(x / .16, 0, 1), np.clip((1 - x) / .16, 0, 1))
    feather = feather * np.minimum(np.clip(y / .14, 0, 1), np.clip((1 - y) / .14, 0, 1))
    chest = Image.fromarray(np.uint8(np.asarray(chest) * feather[:, :, None]))
    ct = [grade(Image.open(SOURCES / f'ct-{i}.png').crop((10, 28, 351, 461)), (204, 232, 226), 1.24) for i in range(10, 13)]
    mri = [grade(Image.open(WORK / 'mri-frames' / f'{i:03d}.png'), (221, 230, 240), .92) for i in range(22, 43)]
    dark_logo = Image.open(PROJECT / 'public/brand/approved/visible-medicine-lockup-dark.png').convert('RGBA')
    light_logo = Image.open(PROJECT / 'public/brand/approved/visible-medicine-lockup-light.png').convert('RGBA')
    symbol = Image.open(PROJECT / 'public/brand/approved/visible-medicine-mark-light-theme.png').convert('RGBA')
    symbol = symbol.crop(symbol.getbbox())
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    halo = np.exp(-(((x - W * .53) / 730) ** 2 + ((y - H * .48) / 420) ** 2))
    dark = Image.fromarray(np.uint8(np.stack((3 + halo * 3, 8 + halo * 12, 13 + halo * 15), -1)))
    # Static ivory field for a deliberately different, bright brand direction.
    light = Image.fromarray(np.uint8(np.stack((242 + halo * 7, 245 + halo * 6, 243 + halo * 7), -1)))
    return {'xr': chest, 'ct': ct, 'mri': mri, 'dark_logo': dark_logo, 'light_logo': light_logo,
            'symbol': symbol, 'dark': dark, 'light': light, 'renderer': AnatomyRenderer()}


def brand(frame, t, start, assets, light=False, amount=1):
    logo = assets['light_logo' if light else 'dark_logo']
    opacity = ease((t - start) / .55) * amount
    plate = Image.new('RGBA', (W, H))
    plate.alpha_composite(logo, ((W - logo.width) // 2, 415))
    frame = composite(frame, plate, opacity)
    text = Image.new('RGBA', (W, H))
    draw = ImageDraw.Draw(text)
    color = (54, 89, 88, 255) if light else (167, 195, 194, 255)
    draw.text((W / 2, 665), 'Where medicine becomes visible.', anchor='mt',
              font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 29), fill=color)
    return composite(frame, text, ease((t - start - .25) / .6) * amount)


def reveal(t, a):
    frame = a['dark'].copy()
    # Start inside a close-up of lit 3D anatomy, and pull back to reveal its form.
    # The subsequent scans are separate sources, not a registered reconstruction.
    if t < 2.35:
        p = 1 - (1 - min(1, t / 2.35)) ** 2
        mesh = a['renderer'].render('brain', yaw=-.35 - p * .90, pitch=.08, roll=-.06,
                                     distance=2.55 + p * 2.35, light=.35 + p * .43)
        frame = composite(frame, mesh, fade(t, -.08, 2.35, .25))
    elif t < 3.4:
        p = ease((t - 2.35) / 1.05)
        image = camera_image(a['xr'], 1050 - p * 90, 545, 2020 - p * 340, -8 + p * 6, -2 + p * 2)
        frame = screen(frame, image, fade(t, 2.35, 3.4, .17) * .96)
    elif t < 4.45:
        p = ease((t - 3.4) / 1.05)
        image = camera_image(sequence(a['ct'], p), 960, 527, 760 + p * 135, 5 - p * 5, 0)
        frame = screen(frame, image, fade(t, 3.4, 4.45, .17) * .92)
    elif t < 5.5:
        p = ease((t - 4.45) / 1.05)
        image = camera_image(sequence(a['mri'], .3 + p * .3), 960, 520, 1360 - p * 130, 2 - p * 2, 0)
        frame = screen(frame, image, fade(t, 4.45, 5.5, .16) * .96)
    if t > 5.35:
        frame = brand(frame, t, 5.35, a)
    # Fixed letterbox, not an animated shutter. The brand remains fully visible.
    draw = ImageDraw.Draw(frame)
    draw.rectangle((0, 0, W, 110), fill=(2, 5, 8))
    draw.rectangle((0, H - 110, W, H), fill=(2, 5, 8))
    return frame


def voyage(t, a):
    frame = a['dark'].copy()
    # One continuous sideways dolly. Each study occupies a separate optical
    # plane and takes the foreground in turn; this is not a stack of CT layers.
    center_time = [1.0, 2.55, 4.10]
    for index in (2, 1, 0):
        dt = t - center_time[index]
        if abs(dt) > 1.6:
            continue
        if index == 0:
            image, width = a['xr'], 1550
        elif index == 1:
            image, width = sequence(a['ct'], (t - 1.6) / 1.8), 650
        else:
            image, width = sequence(a['mri'], (t - 3.15) / 1.9), 1320
        # Ease onto each plane, then continue past it with perspective rotation.
        travel = dt * .42 + dt ** 3 * .47
        cx = W / 2 - travel * 1000
        yaw = np.clip(dt * 26, -44, 44)
        size = width * (1 - .13 * min(1, abs(dt)))
        plate = camera_image(image, cx, 490, size, yaw, -dt * 1.5)
        opacity = fade(t, center_time[index] - 1.55, center_time[index] + 1.55, .36)
        opacity *= ease((5.05 - t) / .5)
        frame = screen(frame, plate, opacity * .94)
        # One subtle floor reflection gives the move depth without extra overlays.
        reflection = Image.new('RGB', (W, H))
        reflected = plate.transpose(Image.Transpose.FLIP_TOP_BOTTOM).resize((W, 400), LANCZOS)
        reflection.paste(reflected, (0, 790))
        frame = screen(frame, reflection.filter(ImageFilter.GaussianBlur(15)), opacity * .075)
    if t > 4.9:
        frame = brand(frame, t, 4.9, a)
    return frame


def signature(t, a):
    frame = a['light'].copy()
    if t < 4.1:
        # The framing brackets are actual pieces of the approved brand asset.
        # They frame the imaging, then close into the complete original symbol.
        close = ease((t - 2.85) / 1.05)
        size = round(590 - close * 260)
        cx, cy = W / 2, 472
        box = (round(cx - size / 2), round(cy - size / 2))
        study = Image.new('RGB', (size, size), (4, 16, 22))
        if t < .95:
            image = a['xr']
            progress = t / .95
        elif t < 1.9:
            image = sequence(a['ct'], (t - .95) / .95)
            progress = (t - .95) / .95
        else:
            image = sequence(a['mri'], (t - 1.9) / 1.1)
            progress = (t - 1.9) / 1.1
        contained = ImageOps.contain(image, (round(size * (.98 + progress * .04)), round(size * (.98 + progress * .04))), LANCZOS)
        study.paste(contained, ((size - contained.width) // 2, (size - contained.height) // 2))
        mask = Image.new('L', (size, size))
        ImageDraw.Draw(mask).rounded_rectangle((12, 12, size - 12, size - 12), radius=35, fill=255)
        picture = Image.new('RGBA', (W, H))
        study.putalpha(mask)
        picture.alpha_composite(study, box)
        frame = composite(frame, picture, ease((t + .08) / .3) * (1 - close))
        symbol = a['symbol'].resize((size, round(size * a['symbol'].height / a['symbol'].width)), LANCZOS)
        sw, sh = symbol.size
        corner_mask = Image.new('L', symbol.size)
        dr = ImageDraw.Draw(corner_mask)
        thick, arm = round(sw * .099), round(sw * .29)
        for x, y, dx, dy in ((0, 0, 1, 1), (sw, 0, -1, 1), (0, sh, 1, -1), (sw, sh, -1, -1)):
            dr.rectangle((min(x, x + dx * arm), min(y, y + dy * thick), max(x, x + dx * arm), max(y, y + dy * thick)), fill=255)
            dr.rectangle((min(x, x + dx * thick), min(y, y + dy * arm), max(x, x + dx * thick), max(y, y + dy * arm)), fill=255)
        corners = symbol.copy()
        corners.putalpha(ImageChops.multiply(corners.getchannel('A'), corner_mask))
        # Solid original symbol resolves only as the imaging aperture disappears.
        combined = Image.blend(corners, symbol, close)
        plate = Image.new('RGBA', (W, H))
        plate.alpha_composite(combined, (round(cx - sw / 2), round(cy - sh / 2)))
        frame = composite(frame, plate, ease(t / .3) * (1 - ease((t - 3.65) / .4)))
    if t > 3.65:
        frame = brand(frame, t, 3.65, a, light=True)
    return frame


def sound(name, duration):
    rate = 48000
    time = np.arange(round(rate * duration)) / rate
    root = {'reveal': 65.4064, 'voyage': 82.4069, 'signature': 130.8128}[name]
    shape = np.sin(np.pi * np.clip(time / duration, 0, 1)) ** 1.4
    signal = (np.sin(2 * np.pi * root * time) * .024 + np.sin(2 * np.pi * root * 1.5 * time) * .008) * shape
    for hz, at, strength in [(root * 4, duration - 1.8, .020), (root * 6, duration - 1.55, .009)]:
        dt = np.maximum(time - at, 0)
        env = (1 - np.exp(-dt * 16)) * np.exp(-dt * 2.5) * (time >= at)
        signal += np.sin(2 * np.pi * hz * dt) * env * strength
    signal *= np.clip((duration - time) / .4, 0, 1)
    data = np.column_stack((signal, signal))
    path = WORK / f'{name}-v3.wav'
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes((data * 32767).astype('<i2').tobytes())
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--stills', action='store_true')
    parser.add_argument('--only', choices=list(DURATIONS))
    args = parser.parse_args()
    assets = prepare()
    names = [args.only] if args.only else list(DURATIONS)
    moments = {'reveal': [.55, 1.75, 2.85, 3.95, 4.98, 6.55], 'voyage': [.85, 1.65, 2.55, 3.35, 4.10, 6.1], 'signature': [.55, 1.45, 2.45, 3.2, 3.5, 4.95]}
    for name in names:
        render = globals()[name]
        sheet = Image.new('RGB', (1600, 600))
        for i, t in enumerate(moments[name]):
            frame = render(t, assets)
            frame.save(WORK / f'{name}-{t:.2f}.jpg', quality=94)
            sheet.paste(frame.resize((533, 300), LANCZOS), ((i % 3) * 533, (i // 3) * 300))
        sheet.save(WORK / f'{name}-storyboard-v3.jpg', quality=94)
        if args.stills:
            print(f'{name}: storyboard ready', flush=True)
            continue
        duration = DURATIONS[name]
        movie = OUTPUT / f'{name}-v3.mp4'
        audio = sound(name, duration)
        encoder = subprocess.Popen([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y',
            '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
            '-i', str(audio), '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-t', str(duration), str(movie)], stdin=subprocess.PIPE)
        try:
            for i in range(round(duration * FPS)):
                encoder.stdin.write(render(i / FPS, assets).tobytes())
                if i % 60 == 0:
                    print(f'{name}: {i}/{round(duration * FPS)} frames', flush=True)
        finally:
            encoder.stdin.close()
        if encoder.wait() != 0:
            raise RuntimeError(f'{name} failed to encode')
        subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(movie),
            '-vf', 'scale=1280:720', '-an', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(OUTPUT / f'{name}-silent-v3.mp4')], check=True)
        poster_time = {'reveal': 1.75, 'voyage': 1.65, 'signature': 2.45}[name]
        render(poster_time, assets).save(OUTPUT / f'{name}-poster-v3.webp', quality=90)
        print(f'{name}: finished {movie.stat().st_size:,} bytes', flush=True)


if __name__ == '__main__':
    main()
