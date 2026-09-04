"""Focused checks for Glide's retained transition and matte background."""
from pathlib import Path
import hashlib
import importlib.util

import numpy as np
from PIL import Image

spec = importlib.util.spec_from_file_location('studies', Path(__file__).with_name('render-signature-studies.py'))
film = importlib.util.module_from_spec(spec)
spec.loader.exec_module(film)
assets = film.prepare()
legacy_assets = {key: value for key, value in assets.items() if key != 'glide_background'}

# Hashes of the unencoded v6 opening and ending before this targeted refinement.
reference = {
    0: '7be6a8927d4b9b534fcc7784407ab25b809880622942657c6c22c17602578103',
    .7: 'a0f1fdaf43ebd076a7f852fbbba3568ee88b9b0850f42445c53a68d521bb1a27',
    1.2: 'd51d23926eef9e31126cb22bbd33a474151e309258822554d0c63b1ec4ac0141',
    1.8: '0327263992bb7f83dfce5b660102cb071bb397a3576edf1f0522824b2ab9ccbb',
    2.4: '4d5f12ec0f217887f364fb5eb74be694ae3756bbc5a56510db657e660adf2388',
    2.65: 'c070e489324211fd67c33fcfeb0bbc8953ef8f223b24af00e97d9869a387ff2f',
    4.9: '50e16150ffac0ba6e957e71cceac4261ea47fe35c1aa7fe7d48d3d076c2cbb20',
    5.3: '50e16150ffac0ba6e957e71cceac4261ea47fe35c1aa7fe7d48d3d076c2cbb20',
}
for time, expected in reference.items():
    # Isolate the requested background replacement from the unchanged animation.
    actual = hashlib.sha256(film.glide_film(time, legacy_assets).tobytes()).hexdigest()
    assert actual == expected, f'Unrelated frame changed at {time} seconds'
film.verify_identity('glide', assets)

# Grain is spatially uniform, deterministic and static: no radial light bands.
matte = np.asarray(assets['glide_background'])[:, :, :3].astype(float)
assert np.max(np.abs(matte - np.array([3, 10, 16]))) <= 1
block_means = matte.reshape(9, 120, 12, 160, 3).mean(axis=(1, 3))
assert np.max(block_means, axis=(0, 1))[1] - np.min(block_means, axis=(0, 1))[1] < .03
assert np.array_equal(matte, np.asarray(film.prepare()['glide_background'])[:, :, :3])

# The four corners must remain visible throughout, including the old dark gap.
for time in np.linspace(2.68, 3.8, 69):
    settle = film.smooth((time - 2.68) / 1.12)
    width = round(800 * (1 - settle) + assets['mark'].width * settle)
    height = round(480 * (1 - settle) + assets['mark'].height * settle)
    frame = film.glide_frame((width, height), settle, film.smooth((time - 2.86) / .72), assets)
    rgba = np.asarray(frame)
    for xs, ys in ((0, 0), (width - 36, 0), (0, height - 36), (width - 36, height - 36)):
        crop = rgba[ys:ys + 36, xs:xs + 36]
        visible = crop[:, :, :3].max(axis=2) * (crop[:, :, 3].astype(float) / 255)
        assert visible.max() > 130, f'Corner faded away at {time}'

# Entry and exit speed stay near zero, unlike the old immediate ease-out launch.
step = 1 / (60 * 1.12)
assert film.smooth(step) * (800 - assets['mark'].width) < .1
assert (1 - film.smooth(1 - step)) * (800 - assets['mark'].width) < .1

sheet = Image.new('RGB', (1600, 900))
for i, time in enumerate((2.68, 2.9, 3.05, 3.2, 3.35, 3.5, 3.65, 3.8, 4.2)):
    image = film.glide_film(time, assets)
    sheet.paste(image.resize((533, 300), film.LANCZOS), ((i % 3) * 533, (i // 3) * 300))
sheet.save(film.WORK / f'glide-transition-{film.version_for("glide")}.jpg', quality=95)
print('Passed: unchanged motion, exact logo, persistent corners, gentle endpoints, uniform matte background.')
