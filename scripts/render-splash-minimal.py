"""Render the quieter second cut: one real scan at a time, then the identity.

Sources and rights are documented in docs/cinematic-splash.md. This is a film
composition, not a viewer or a reconstruction. Original source pixels remain
the only anatomy; no synthetic scan details, overlays or decorative particles.
"""
from pathlib import Path
import argparse
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps

PROJECT = Path(__file__).resolve().parents[1]
WORK = PROJECT.parent / 'work' / 'cinematic-splash'
SOURCES = WORK / 'sources'
OUTPUT = PROJECT / 'public' / 'media' / 'splash'
sys.path.insert(0, str(WORK / 'minimal-runtime'))
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
WIDTH, HEIGHT, FPS, DURATION = 1920, 1080, 30, 6.0
RESAMPLE = Image.Resampling.LANCZOS


def smooth(value):
    p = max(0., min(1., float(value)))
    return p * p * (3 - 2 * p)


def envelope(t, start, end, fade=.25):
    return smooth((t - start) / fade) * smooth((end - t) / fade)


def grade(image, gamma=1.2):
    gray = ImageOps.autocontrast(image.convert('L'), cutoff=.3)
    gray = gray.point([int((i / 255) ** gamma * 255) for i in range(256)])
    return ImageOps.colorize(gray, (0, 0, 0), (204, 226, 226))


def prepare():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    chest = grade(Image.open(SOURCES / 'chest.png').crop((80, 140, 2300, 1880)), 1.65)
    chest.thumbnail((1300, 1300), RESAMPLE)
    x = np.linspace(0, 1, chest.width)[None, :]
    y = np.linspace(0, 1, chest.height)[:, None]
    feather = np.minimum(np.clip(x / .14, 0, 1), np.clip((1 - x) / .14, 0, 1))
    feather = feather * np.minimum(np.clip(y / .12, 0, 1), np.clip((1 - y) / .12, 0, 1))
    chest = Image.fromarray(np.uint8(np.asarray(chest) * feather[:, :, None]))
    # These three original-size CT plates avoid the thumbnail-resolution slices.
    ct = [grade(Image.open(SOURCES / f'ct-{i}.png').crop((10, 28, 351, 461)), 1.3)
          for i in range(10, 13)]
    mri = [grade(Image.open(WORK / 'mri-frames' / f'{i:03d}.png'), .92)
           for i in range(28, 33)]
    logo = Image.open(PROJECT / 'public/brand/approved/visible-medicine-lockup-dark.png').convert('RGBA')
    # A near-black, stationary background; nothing competes with the anatomy.
    y, x = np.mgrid[0:HEIGHT, 0:WIDTH].astype(np.float32)
    halo = np.exp(-(((x - WIDTH / 2) / 680) ** 2 + ((y - HEIGHT / 2) / 540) ** 2))
    bg = np.stack((2 + halo * 1, 7 + halo * 3, 13 + halo * 3), axis=-1)
    background = Image.fromarray(bg.astype(np.uint8))
    return chest, ct, mri, logo, background


def slice_at(images, progress):
    position = max(0., min(1., progress)) * (len(images) - 1)
    first = int(position)
    # A gentle temporal dissolve between adjacent acquired slices, not a 3D morph.
    return Image.blend(images[first], images[min(first + 1, len(images) - 1)], position - first)


def scan_layer(image, width):
    size = (round(width), round(width * image.height / image.width))
    image = image.resize(size, RESAMPLE)
    layer = Image.new('RGB', (WIDTH, HEIGHT))
    layer.paste(image, ((WIDTH - size[0]) // 2, (HEIGHT - size[1]) // 2))
    return layer


def screen(base, layer, opacity):
    lut = [round(i * max(0., min(1., opacity))) for i in range(256)] * 3
    return ImageChops.screen(base, layer.point(lut))


def render_frame(t, assets):
    chest, ct, mri, logo, background = assets
    frame = background.copy()
    # Non-overlapping shots fade through the same dark field: only one scan is
    # visible at any instant, without perspective stacks, captions or scan lines.
    if t < 1.45:
        p = smooth(t / 1.45)
        frame = screen(frame, scan_layer(chest, 1050 + p * 28), envelope(t, 0, 1.45) * .94)
    elif t < 2.9:
        p = smooth((t - 1.45) / 1.45)
        frame = screen(frame, scan_layer(slice_at(ct, p), 520 + p * 14), envelope(t, 1.45, 2.9) * .90)
    elif t < 4.45:
        p = smooth((t - 2.9) / 1.55)
        frame = screen(frame, scan_layer(slice_at(mri, p), 1000 + p * 26), envelope(t, 2.9, 4.45) * .98)
    else:
        # The approved identity is used unchanged, without glow or distortion.
        opacity = smooth((t - 4.45) / .55)
        layer = Image.new('RGBA', (WIDTH, HEIGHT))
        layer.alpha_composite(logo, ((WIDTH - logo.width) // 2, 416))
        layer.putalpha(layer.getchannel('A').point([round(i * opacity) for i in range(256)]))
        frame = Image.alpha_composite(frame.convert('RGBA'), layer).convert('RGB')
        text = Image.new('RGB', (WIDTH, HEIGHT))
        draw = ImageDraw.Draw(text)
        font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 28)
        draw.text((WIDTH / 2, 670), 'Where medicine becomes visible.', font=font,
                  fill=(151, 177, 177), anchor='mt')
        frame = screen(frame, text, smooth((t - 4.75) / .55))
    return frame


def make_sound():
    rate = 48000
    time = np.arange(round(rate * DURATION)) / rate
    fade = np.sin(np.pi * np.clip(time / DURATION, 0, 1)) ** 2
    # One restrained, consonant pad. No per-shot whooshes or repeated chimes.
    signal = (np.sin(2 * np.pi * 110 * time) * .018
              + np.sin(2 * np.pi * 165 * time) * .007) * fade
    dt = np.maximum(time - 4.6, 0)
    ending = (1 - np.exp(-dt * 4)) * np.exp(-dt * 2) * (time >= 4.6)
    signal += np.sin(2 * np.pi * 440 * dt) * ending * .025
    signal *= np.clip((DURATION - time) / .4, 0, 1)
    stereo = np.column_stack((signal, signal))
    with wave.open(str(WORK / 'sound-v2.wav'), 'wb') as audio:
        audio.setnchannels(2)
        audio.setsampwidth(2)
        audio.setframerate(rate)
        audio.writeframes((stereo * 32767).astype('<i2').tobytes())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--stills', action='store_true')
    args = parser.parse_args()
    assets = prepare()
    times = [.72, 2.16, 3.65, 5.72]
    storyboard = Image.new('RGB', (1440, 810))
    for i, t in enumerate(times):
        frame = render_frame(t, assets)
        frame.save(WORK / f'minimal-{t:.2f}.jpg', quality=94)
        storyboard.paste(frame.resize((720, 405), RESAMPLE), ((i % 2) * 720, (i // 2) * 405))
    storyboard.save(WORK / 'storyboard-v2.jpg', quality=94)
    if args.stills:
        print('Storyboard:', WORK / 'storyboard-v2.jpg', flush=True)
        return
    make_sound()
    movie = OUTPUT / 'visible-medicine-cinematic-v2.mp4'
    process = subprocess.Popen([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{WIDTH}x{HEIGHT}', '-r', str(FPS), '-i', '-',
        '-i', str(WORK / 'sound-v2.wav'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
        '-t', str(DURATION), str(movie)], stdin=subprocess.PIPE)
    try:
        for i in range(round(DURATION * FPS)):
            process.stdin.write(render_frame(i / FPS, assets).tobytes())
            if i % 30 == 0:
                print(f'Rendered {i}/{round(DURATION * FPS)} frames', flush=True)
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError('Film encoding failed')
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(movie),
        '-vf', 'scale=1280:720', '-an', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        str(OUTPUT / 'visible-medicine-splash-v2.mp4')], check=True)
    render_frame(5.72, assets).save(OUTPUT / 'cinematic-logo-poster-v2.webp', quality=88)
    render_frame(3.65, assets).save(OUTPUT / 'cinematic-film-poster-v2.webp', quality=88)
    print('Finished:', movie, flush=True)


if __name__ == '__main__':
    main()
