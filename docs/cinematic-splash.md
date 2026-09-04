# Visible Medicine cinematic opening

Created 4 September 2026. Duration: 6.6 seconds, 30 frames/second.

The new film replaces the rejected relay/orbit/dissolve concepts. It is a rendered
MP4 with actual scan imagery, perspective movement, a real MRI slice sequence,
subtle light treatments, a brain-image particle dissolve, and the approved logo.

## Files and reproduction

- `public/media/splash/visible-medicine-cinematic-v1.mp4`: 1920×1080 review/download
  master with original optional sound design.
- `public/media/splash/visible-medicine-splash-v1.mp4`: 1280×720 homepage movie,
  no audio stream; approximately 1.34 MB.
- `cinematic-film-poster.webp`: still for the review player.
- `cinematic-logo-poster.webp`: final identity still.
- `scripts/fetch-splash-sources.py`: source retrieval into the workspace's
  `work/cinematic-splash/sources` directory, outside the website source tree.
- `scripts/render-splash-film.py`: reproducible film composition and export using
  NumPy, Pillow and FFmpeg; `--stills` produces a six-frame contact sheet.

Source media and render intermediates remain outside the deployed app. The
render script expects imageio-ffmpeg in `work/cinematic-splash/python` and Windows
Segoe UI for the restrained scene labels. The approved wordmark is used directly.

## Story and timing

0.00–2.12 s: close chest radiograph with travelling light and a slow camera pull.
1.60–3.72 s: real CT planes separated in perspective, with the selected slices
advancing through the source sequence. This is artistic plane compositing, not
a spatially calibrated clinical volume reconstruction.
3.13–5.30 s: a retimed section of a 7T research brain MRI cine.
4.40–5.62 s: particle field sampled from the MRI converges toward the identity.
4.92–6.60 s: approved Visible Medicine logo and existing tagline.

## Verified source rights

All sources were checked against their individual Wikimedia Commons file pages
on 4 September 2026. They use the CC0 1.0 Universal Public Domain Dedication:
https://creativecommons.org/publicdomain/zero/1.0/

| Source | Creator | Source page | Film treatment |
|---|---|---|---|
| Chest Xray PA 3-8-2010.png, 2412×1956 | Stillwaterising | https://commons.wikimedia.org/wiki/File:Chest_Xray_PA_3-8-2010.png | Cropped away from acquisition marker, graded, feathered and moved in perspective |
| CT of a normal brain, axial 10–36 | Mikael Häggström, M.D. | https://commons.wikimedia.org/wiki/Scrollable_computed_tomography_images_of_a_normal_brain_(case_1) | Axial panel cropped from source, downsampled where necessary, graded and composited into layered motion |
| 7 Tesla MRI of the ex vivo human brain at 100 micron resolution, FA25 sagittal | Brian L. Edlow et al.; WebM conversion by Jahobr | https://commons.wikimedia.org/wiki/File:7_Tesla_MRI_of_the_ex_vivo_human_brain_at_100_micron_resolution_(100_micron_MRI_acquired_FA25_sagittal).webm | 28–56 s excerpt, sampled, retimed, graded, reframed and used to derive the point field |

MRI dataset: Edlow et al. (2019), Dryad, https://doi.org/10.5061/dryad.119f80q .
The source is an ex vivo research specimen and is identified as such in the
preview credits. CT source records consent for online publication.

The source movie is 1760×1280; the rendered film's 1080p frame does not imply
that every constituent source is native 1080p. The CT originals are 646×468
(including a localizer panel). To follow Wikimedia's rate-limit guidance,
330-pixel thumbnail derivatives were used for most CT slices. CT clarity is
therefore intentionally secondary to the spatial motion and the higher-detail MRI.

## Creative research

The approach was informed by film-title motion references and medical animation
practice, particularly camera placement, macro framing and a resolved identity:

- Maxon / MadMicrobe, Beneath the Skin:
  https://www.maxon.net/en/article/beneath-the-skin
- BBC motion graphics archive, Inside Medicine:
  https://www.ravensbourne.ac.uk/bbc-motion-graphics-archive/inside-medicine-1975

No footage, music or artwork from those creative references was copied. The
sound is an original synthesis of a quiet tonal bed, soft transitions and a
three-note ending. No third-party sound samples are used.

## Website behaviour

- The homepage plays the silent movie once per browser storage version (v5).
- Skip intro and Escape dismiss it; focus stays on the skip button during the
  introduction and returns to page content afterwards.
- Reduced-motion and data-saving preferences show a brief static identity.
- Playback errors, blocked autoplay or an 8.5-second deadline release the page.
- Route changes release inert content and pause the movie.
- A 10-second pre-hydration failsafe restores the page if the client fails to load.
- The review page uses native video controls, replay, optional sound and download.
  Reduced-motion preference prevents review autoplay; deliberate play still works.

No licensing or launch-access policy changes are made by this feature.
