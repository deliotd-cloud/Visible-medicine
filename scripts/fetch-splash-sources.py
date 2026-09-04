"""Download the verified CC0 source imagery for the cinematic splash."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import urllib.request
import urllib.parse
import urllib.error
import time

ROOT = Path(__file__).resolve().parents[2] / 'work' / 'cinematic-splash' / 'sources'
ROOT.mkdir(parents=True, exist_ok=True)
AGENT = {'User-Agent': 'VisibleMedicineMotionPreview/1.0 (educational website asset research)'}


def download(url, name):
    dest = ROOT / name
    if dest.exists() and dest.stat().st_size > 1000:
        return
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=90) as response:
                with dest.open('wb') as output:
                    while block := response.read(1024 * 1024):
                        output.write(block)
            print(f'{name}: {dest.stat().st_size:,} bytes', flush=True)
            return
        except urllib.error.HTTPError as error:
            if error.code == 429:
                raise
            if attempt == 2:
                raise
            time.sleep(2 + attempt)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 + attempt)


def get_ct():
    titles = '|'.join(f'File:CT of a normal brain, axial {i}.png' for i in range(10, 37))
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
        'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'iiprop': 'url', 'titles': titles, 'iiurlwidth': 330,
    })
    with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=60) as response:
        result = json.load(response)
    records = []
    for page in result['query']['pages'].values():
        index = int(page['title'].rsplit(' ', 1)[-1].split('.')[0])
        records.append({'index': index, 'url': page['imageinfo'][0]['thumburl'].split('?')[0]})
    (ROOT / 'ct-sources.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
    with ThreadPoolExecutor(max_workers=3) as pool:
        jobs = [pool.submit(download, record['url'], f"ct-{record['index']:02}.png") for record in records]
        for job in jobs:
            job.result()


if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=3) as pool:
        jobs = [
            pool.submit(download, 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Chest_Xray_PA_3-8-2010.png', 'chest.png'),
            pool.submit(download, 'https://upload.wikimedia.org/wikipedia/commons/a/a2/7_Tesla_MRI_of_the_ex_vivo_human_brain_at_100_micron_resolution_%28100_micron_MRI_acquired_FA25_sagittal%29.webm', 'mri-sagittal.webm'),
            pool.submit(get_ct),
        ]
        for job in jobs:
            job.result()
