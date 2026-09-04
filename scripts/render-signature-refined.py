"""Refine Signature into a continuous scan-window-to-identity animation.

Uses the same CC0 source scans and exact approved identity. No new anatomy or
wordmark is generated. Intermediate scanning brackets are motion graphics, not
a replacement brand asset. Original Signature remains available as v3.
"""
from pathlib import Path
import argparse
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

PROJECT = Path(__file__).resolve().parents[1]
WORK = PROJECT.parent / 'work/cinematic-splash'
SOURCE = WORK / 'sources'
OUTPUT = PROJECT / 'public/media/splash'
sys.path.insert(0, str(WORK / 'minimal-runtime'))
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, DURATION = 1920, 1080, 60, 5.2
LANCZOS = Image.Resampling.LANCZOS
MARK_BOX = (17, 17, 212, 194)
LOGO_POSITION = (448, 431)


def smooth(value):
    p = float(np.clip(value, 0, 1))
    return p * p * p * (p * (6 * p - 15) + 10)


def glide(value):
    p = float(np.clip(value, 0, 1))
    return 1 - (1 - p) ** 4


def alpha_scaled(image, opacity):
    result = image.copy().convert('RGBA')
    result.putalpha(result.getchannel('A').point([round(i * np.clip(opacity, 0, 1)) for i in range(256)]))
    return result


def place(base, layer, xy, opacity=1):
    base.alpha_composite(alpha_scaled(layer, opacity), (round(xy[0]), round(xy[1])))


def grade(image, gamma=1.15):
    gray = ImageOps.autocontrast(image.convert('L'), cutoff=.3)
    gray = gray.point([round((i / 255) ** gamma * 255) for i in range(256)])
    return ImageOps.colorize(gray, (0, 0, 0), (208, 231, 231))


def prepare(dark=False):
    chest = grade(Image.open(SOURCE / 'chest.png').crop((170, 230, 2200, 1810)), 1.5)
    chest.thumbnail((1250, 1250), LANCZOS)
    ct = [grade(Image.open(SOURCE / f'ct-{i}.png').crop((10, 28, 351, 461)), 1.18) for i in range(10, 13)]
    mri = [grade(Image.open(WORK / 'mri-frames' / f'{i:03d}.png'), .9) for i in range(28, 35)]
    theme = 'dark' if dark else 'light'
    logo = Image.open(PROJECT / f'public/brand/approved/visible-medicine-lockup-{theme}.png').convert('RGBA')
    mark_box = (18, 18, 204, 187) if dark else MARK_BOX
    word_start = 220 if dark else 232
    logo_position = (448, 437) if dark else LOGO_POSITION
    mark = logo.crop(mark_box)
    # Exact identity pieces remain in their native coordinates for the final frame.
    words = logo.crop((word_start, 0, logo.width, logo.height))
    mask = Image.new('L', mark.size)
    draw = ImageDraw.Draw(mask)
    mw, mh = mark.size
    for x, y, dx, dy in ((0, 0, 1, 1), (mw, 0, -1, 1), (0, mh, 1, -1), (mw, mh, -1, -1)):
        thick, arm = 22, 58
        draw.rectangle((min(x, x + dx * arm), min(y, y + dy * thick), max(x, x + dx * arm), max(y, y + dy * thick)), fill=255)
        draw.rectangle((min(x, x + dx * thick), min(y, y + dy * arm), max(x, x + dx * thick), max(y, y + dy * arm)), fill=255)
    corners = mark.copy()
    corners.putalpha(ImageChops.multiply(mark.getchannel('A'), mask))
    center = mark.copy()
    center.putalpha(ImageChops.subtract(mark.getchannel('A'), corners.getchannel('A')))
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    glow = np.exp(-(((x - W / 2) / 680) ** 2 + ((y - H * .44) / 530) ** 2))
    bg = (np.stack((2 + glow * 2, 7 + glow * 8, 13 + glow * 8), -1) if dark else
          np.stack((243 + glow * 9, 246 + glow * 7, 246 + glow * 7), -1))
    return {
        'chest': chest, 'ct': ct, 'mri': mri, 'mark': mark, 'corners': corners, 'center': center,
        'words': words, 'background': Image.fromarray(np.uint8(bg)).convert('RGBA'),
        'dark': dark, 'mark_box': mark_box, 'word_start': word_start, 'logo_position': logo_position,
    }


def slice_at(images, progress):
    pos = np.clip(progress, 0, .99999) * (len(images) - 1)
    i = int(pos)
    return Image.blend(images[i], images[min(i + 1, len(images) - 1)], pos - i)


def scan(image, size, zoom=1):
    sw, sh = size
    result = Image.new('RGB', size, (6, 22, 29))
    fit = ImageOps.contain(image, (round(sw * .91 * zoom), round(sh * .91 * zoom)), LANCZOS)
    photograph = Image.new('RGB', size)
    photograph.paste(fit, ((sw - fit.width) // 2, (sh - fit.height) // 2))
    # Feather into the dark field so there is no visible rectangular image plate.
    yy, xx = np.mgrid[0:sh, 0:sw].astype(np.float32)
    feather = np.minimum(np.minimum(xx, sw - 1 - xx) / 42, np.minimum(yy, sh - 1 - yy) / 36)
    feather = np.uint8(np.clip(feather, 0, 1) * 255)
    photograph = Image.composite(photograph, Image.new('RGB', size), Image.fromarray(feather))
    return ImageChops.screen(result, photograph)


def wipe(old, new, progress):
    p = smooth(progress)
    if p <= 0:
        return old
    if p >= 1:
        return new
    sw, sh = old.size
    # A soft directional reveal, without a bright scan line or double-exposed scans.
    reveal = np.clip((p * (sw + 70) - np.arange(sw)[None, :]) / 70, 0, 1)
    mask = Image.fromarray(np.uint8(np.repeat(reveal, sh, axis=0) * 255))
    return Image.composite(new, old, mask)


def thin_brackets(size, morph=0):
    sw, sh = size
    # Supersampled simple framing geometry gives the opening fine, rounded edges.
    scale = 3
    inset = round(5 * (1 - morph) + 2 * morph)
    radius = round(24 * (1 - morph) + sw * .09 * morph)
    arm = round(92 * (1 - morph) + sw * .28 * morph)
    thickness = 8 * (1 - morph) + sw * .087 * morph
    corner = Image.new('RGBA', (arm * scale + 12 * scale, arm * scale + 12 * scale))
    d = ImageDraw.Draw(corner)
    color = (13, 169, 159, 255)
    weight = round(thickness * scale)
    left, top = inset * scale, inset * scale
    r = radius * scale
    d.arc((left, top, left + 2 * r, top + 2 * r), 180, 270, fill=color, width=weight)
    d.line((left + r, top + weight / 2, left + arm * scale, top + weight / 2), fill=color, width=weight)
    d.line((left + weight / 2, top + r, left + weight / 2, top + arm * scale), fill=color, width=weight)
    corner = corner.resize((arm + 12, arm + 12), LANCZOS)
    frame = Image.new('RGBA', size)
    cw, ch = corner.size
    frame.alpha_composite(corner, (0, 0))
    frame.alpha_composite(corner.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (sw - cw, 0))
    frame.alpha_composite(corner.transpose(Image.Transpose.FLIP_TOP_BOTTOM), (0, sh - ch))
    frame.alpha_composite(corner.transpose(Image.Transpose.ROTATE_180), (sw - cw, sh - ch))
    return frame


def render(t, a):
    frame = a['background'].copy()
    mark_box, logo_position = a['mark_box'], a['logo_position']
    entrance = smooth(t / .34)
    settle = glide((t - 2.68) / .96)
    width = round((576 + (1 - entrance) * 18) * (1 - settle) + a['mark'].width * settle)
    height = round(width * a['mark'].height / a['mark'].width)
    final_cx = logo_position[0] + (mark_box[0] + mark_box[2]) / 2
    final_cy = logo_position[1] + (mark_box[1] + mark_box[3]) / 2
    cx = W / 2 * (1 - settle) + final_cx * settle
    cy = (476 + 9 * (1 - entrance)) * (1 - settle) + final_cy * settle
    x, y = cx - width / 2, cy - height / 2
    panel_opacity = entrance * (1 - smooth((t - 2.66) / .48))
    symbol_opacity = smooth((t - 2.93) / .54)

    if panel_opacity > 0:
        panel_size = (width - 24, height - 24)
        chest = scan(a['chest'], panel_size, 1 + min(t, 1.2) * .032)
        ct = scan(slice_at(a['ct'], (t - .96) / .95), panel_size, .96 + min(1, max(0, t - .96)) * .025)
        mri = scan(slice_at(a['mri'], (t - 1.84) / .98), panel_size, 1.04)
        if t < 1.75:
            panel = wipe(chest, ct, (t - 1.0) / .25)
        else:
            panel = wipe(ct, mri, (t - 1.82) / .25)
        mask = Image.new('L', panel_size)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, panel_size[0] - 1, panel_size[1] - 1), radius=22, fill=255)
        panel = panel.convert('RGBA')
        panel.putalpha(mask)
        # A soft contact shadow adds depth, without a reflection or animated flare.
        shadow = Image.new('RGBA', (W, H))
        shadow_rect = Image.new('RGBA', panel_size, (0, 0, 0, 0) if a['dark'] else (15, 52, 59, 0))
        shadow_rect.putalpha(mask.point([round(i * .12) for i in range(256)]))
        place(shadow, shadow_rect, (x + 12, y + 25))
        shadow = shadow.filter(ImageFilter.GaussianBlur(22))
        place(frame, shadow, (0, 0), panel_opacity)
        place(frame, panel, (x + 12, y + 12), panel_opacity)

    # Fine scanning brackets blend into the real identity at exactly the same
    # position and scale. There is no second logo fading in somewhere else.
    transition = smooth((t - 2.83) / .48)
    if t < 3.45:
        place(frame, thin_brackets((width, height), transition), (x, y), entrance * (1 - transition))
    corners = a['corners'].resize((width, height), LANCZOS)
    center = a['center'].resize((width, height), LANCZOS)
    place(frame, corners, (x, y), transition)
    place(frame, center, (x, y), symbol_opacity)

    # The approved wordmark and endorsement are revealed, not redrawn or typed.
    word_progress = smooth((t - 3.43) / .65)
    if word_progress > 0:
        words = a['words'].copy()
        wx = np.arange(words.width)[None, :]
        reveal = np.clip((word_progress * (words.width + 48) - wx) / 48, 0, 1)
        mask = Image.fromarray(np.uint8(np.repeat(reveal, words.height, axis=0) * 255))
        words.putalpha(ImageChops.multiply(words.getchannel('A'), mask))
        place(frame, words, (logo_position[0] + a['word_start'], logo_position[1]))
    tagline = smooth((t - 3.88) / .48)
    if tagline > 0:
        text = Image.new('RGBA', (W, H))
        ImageDraw.Draw(text).text((W / 2, 685 + (1 - tagline) * 6), 'Where medicine becomes visible.',
            anchor='mt', font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 28),
            fill=(165, 192, 195, 255) if a['dark'] else (76, 104, 107, 255))
        place(frame, text, (0, 0), tagline)
    return frame.convert('RGB')


def soundtrack(version='v4'):
    rate = 48000
    t = np.arange(round(DURATION * rate)) / rate
    signal = (.013 * np.sin(2 * np.pi * 130.8128 * t) + .005 * np.sin(2 * np.pi * 196 * t)) * np.sin(np.pi * t / DURATION) ** 2
    dt = np.maximum(t - 3.38, 0)
    note = (1 - np.exp(-dt * 12)) * np.exp(-dt * 2.8) * (t >= 3.38)
    signal += np.sin(2 * np.pi * 523.251 * dt) * note * .018
    signal *= np.clip((DURATION - t) / .4, 0, 1)
    path = WORK / f'signature-{version}.wav'
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes((np.column_stack((signal, signal)) * 32767).astype('<i2').tobytes())
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dark', action='store_true', help='Render the dark v5 cut, retaining the light v4 assets.')
    parser.add_argument('--stills', action='store_true')
    args = parser.parse_args()
    a = prepare(dark=args.dark)
    version = 'v5' if args.dark else 'v4'
    times = [.65, 1.5, 2.4, 3.08, 3.7, 4.7]
    sheet = Image.new('RGB', (1600, 600))
    for i, t in enumerate(times):
        frame = render(t, a)
        frame.save(WORK / f'signature-{version}-{t:.2f}.jpg', quality=95)
        sheet.paste(frame.resize((533, 300), LANCZOS), ((i % 3) * 533, (i // 3) * 300))
    sheet.save(WORK / f'signature-storyboard-{version}.jpg', quality=94)
    if args.stills:
        print('Signature refined storyboard ready', flush=True)
        return
    movie = OUTPUT / f'signature-{version}.mp4'
    process = subprocess.Popen([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
        '-i', str(soundtrack(version)), '-c:v', 'libx264', '-crf', '20', '-preset', 'slow',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
        '-t', str(DURATION), str(movie)], stdin=subprocess.PIPE)
    try:
        for i in range(round(DURATION * FPS)):
            process.stdin.write(render(i / FPS, a).tobytes())
            if i % 60 == 0:
                print(f'Signature refined: {i}/{round(DURATION * FPS)} frames', flush=True)
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError('Refined Signature encoding failed')
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(movie),
        '-vf', 'scale=1280:720', '-an', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(OUTPUT / f'signature-silent-{version}.mp4')], check=True)
    render(2.4, a).save(OUTPUT / f'signature-poster-{version}.webp', quality=90)
    render(4.7, a).save(OUTPUT / f'signature-logo-poster-{version}.webp', quality=90)
    print(f'Signature refined ready: {movie.stat().st_size:,} bytes', flush=True)


if __name__ == '__main__':
    main()
