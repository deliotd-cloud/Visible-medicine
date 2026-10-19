# Visible Medicine cinematic opening

## Adopted homepage opening: Glide v8

The user selected the refined Glide film and requested adoption. The homepage
now uses `public/media/splash/glide-silent-v8.mp4`: 5.4 seconds, 60 fps, 1280×720,
approximately 200 KB and no audio stream. Its matte charcoal background and
continuous frame-to-logo transition match the selected review version. The
fullscreen surround also uses #030a10, without the earlier radial bands.

The selected media path and first-visit key are defined in `lib/splash-intro.ts`.
The shared key `visible-medicine-splash-glide-v8` lets previous visitors see the
new opening once; later visits go straight to the page. The existing Skip,
Escape, static reduced-motion/data-saving alternative, playback-error handling,
focus management and fallback deadlines remain in place. There is no homepage
audio, and deep links into courses or workbooks do not run the splash.

The comparison page identifies Glide as the website selection and retains the
other options without allowing preview clicks to change that selection. See
`cinematic-splash-options.md` for its motion history and source provenance.

Implementation is local; publication is a separate step. No account, access,
privacy or launch settings are changed. `tests/splash-intro.test.ts` checks
first/repeat visits, old storage keys, deep links, unavailable storage, the
pre-hydration fallback, and the adopted lightweight media asset.

## Historical second cut

The material below records the earlier second cut, no longer used on the homepage.

Revised 4 September 2026. Second cut: 6 seconds, 30 frames/second.

Cut 02 simplifies the first film in response to the request for less visual
activity. It shows one centered real scan at a time, with a small, slow push-in
and fades through a stationary dark background. No particles, perspective
stacks, scanning beams, ghost images, scene captions or transition flashes.
The approved identity then fades in unchanged, with the existing tagline.

## Files and reproduction

- `public/media/splash/visible-medicine-cinematic-v2.mp4`: 1920×1080 review/download
  master with original optional sound design.
- `public/media/splash/visible-medicine-splash-v2.mp4`: 1280×720 homepage movie,
  no audio stream.
- `cinematic-film-poster-v2.webp`: still for the review player.
- `cinematic-logo-poster-v2.webp`: final identity still.
- `scripts/fetch-splash-sources.py`: source retrieval into the workspace's
  `work/cinematic-splash/sources` directory, outside the website source tree.
- `scripts/render-splash-minimal.py`: reproducible current film composition and
  export using NumPy, Pillow and FFmpeg; `--stills` produces a four-frame sheet.
- The first-cut assets and `scripts/render-splash-film.py` remain available for
  reference but are not used by the preview or homepage.

Source media and render intermediates remain outside the deployed app. The
current render script expects imageio-ffmpeg 0.6.0 in
`work/cinematic-splash/minimal-runtime` and Windows Segoe UI for the tagline.
It uses the previously extracted MRI frames in `work/cinematic-splash/mri-frames`.
The approved wordmark is used directly.

## Story and timing

0.00–1.45 s: centered chest radiograph, gently moving closer.
1.45–2.90 s: one CT plane, slowly dissolving through three adjacent source slices.
2.90–4.45 s: a short, slowly advancing section of a 7T brain MRI cine.
4.45–6.00 s: clean approved Visible Medicine logo and existing tagline.

Shot intervals do not overlap. CT uses the full-size source plates 10–12; MRI
uses extracted frames 028–032. All camera motion is approximately 3% scale,
without rotations, lateral travel or simulated depth. Slice interpolation is
a temporal dissolve, not a spatially calibrated clinical reconstruction.

## Verified source rights

All sources were checked against their individual Wikimedia Commons file pages
on 4 September 2026. They use the CC0 1.0 Universal Public Domain Dedication:
https://creativecommons.org/publicdomain/zero/1.0/

| Source | Creator | Source page | Film treatment |
|---|---|---|---|
| Chest Xray PA 3-8-2010.png, 2412×1956 | Stillwaterising | https://commons.wikimedia.org/wiki/File:Chest_Xray_PA_3-8-2010.png | Cropped, graded, feathered and slowly enlarged |
| CT of a normal brain, axial 10–12 | Mikael Häggström, M.D. | https://commons.wikimedia.org/wiki/Scrollable_computed_tomography_images_of_a_normal_brain_(case_1) | Axial panel cropped from original-size sources, graded and retimed with adjacent-slice dissolves |
| 7 Tesla MRI of the ex vivo human brain at 100 micron resolution, FA25 sagittal | Brian L. Edlow et al.; WebM conversion by Jahobr | https://commons.wikimedia.org/wiki/File:7_Tesla_MRI_of_the_ex_vivo_human_brain_at_100_micron_resolution_(100_micron_MRI_acquired_FA25_sagittal).webm | Short selection from the previously extracted 28–56 s excerpt, retimed, graded and reframed |

MRI dataset: Edlow et al. (2019), Dryad, https://doi.org/10.5061/dryad.119f80q .
The source is an ex vivo research specimen and is identified as such in the
preview credits. CT source records consent for online publication.

The source movie is 1760×1280; the rendered film's 1080p frame does not imply
that every constituent source is native 1080p. The CT originals are 646×468
(including a localizer panel). The second cut uses only the three downloaded
original-size CT plates; the thumbnail derivatives used in cut 01 are not used.

## Creative research

The approach was informed by film-title motion references and medical animation
practice, particularly camera placement, macro framing and a resolved identity:

- Maxon / MadMicrobe, Beneath the Skin:
  https://www.maxon.net/en/article/beneath-the-skin
- BBC motion graphics archive, Inside Medicine:
  https://www.ravensbourne.ac.uk/bbc-motion-graphics-archive/inside-medicine-1975

No footage, music or artwork from those creative references was copied. The
sound in cut 02 is an original quiet tonal pad and a soft ending tone. There
are no transition whooshes or repeated chimes. No third-party samples are used.

## Website behaviour

- The homepage plays the selected silent movie once per browser storage version
  (now `visible-medicine-splash-glide-v8`).
- Skip intro and Escape dismiss it; focus stays on the skip button during the
  introduction and returns to page content afterwards.
- Reduced-motion and data-saving preferences show a brief static identity.
- Playback errors, blocked autoplay or an 8.5-second deadline release the page.
- Route changes release inert content and pause the movie.
- A 10-second pre-hydration failsafe restores the page if the client fails to load.
- The review page uses native video controls, replay, optional sound and download.
  Reduced-motion preference prevents review autoplay; deliberate play still works.

No licensing or launch-access policy changes are made by this feature.
