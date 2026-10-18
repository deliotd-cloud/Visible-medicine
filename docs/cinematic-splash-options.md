# Opening-film concepts — 4 September 2026

## Adopted selection

The user has approved Glide v8 for implementation as the actual homepage splash.
The local website now uses its silent 720p export, with the shared first-visit
key and matching matte surround documented in `cinematic-splash.md`. Other
concepts remain review-only, and clicking them does not change the homepage.
No public deployment has been performed. The preview-only statements below
record the earlier design-review stages before this adoption.

## Glide matte background — current preview

The user requested removal of the rounded background bands. **Glide v8** removes
the radial glow entirely and uses flat charcoal (#030a10), with deterministic
monochrome grain limited to one RGB level either side. There are no concentric
contours, gradients, particles or additional background motion. The film's
letterbox surround uses the same charcoal colour.

Only Glide's background changes. Its v7 transition, scan sequence, native logo,
soundtrack, 5.4-second duration and 60 fps exports are retained. Other options
remain unchanged, and previous Glide files remain available on disk. Run
`scripts/render-signature-studies.py --only glide` to reproduce the v8 master,
silent export and posters. The focused transition checks isolate the background
change from the retained motion, verify the exact native logo, and also check
that the matte texture is deterministic and spatially uniform.

This is local preview-only: no homepage adoption or public deployment.

## Glide transition refinement — retained in the matte cut

The user selected Glide and requested a smoother hand-off around three seconds.
Option 05 now uses **Glide v7**, retaining the 5.4-second duration and all other
films. The opening scan movement and final composed logo/tagline are unchanged.

The frame now accelerates and decelerates gently over 2.68–3.80 seconds instead
of starting at maximum speed. Its four corners remain visible throughout and
blend into uniformly scaled pieces of the approved frame artwork, anchored to
the same edges. Only the inner symbol fades in; there is no disappearance and
replacement of the outer frame. MRI fades later, with the wordmark reveal
following the settling motion. The same soundtrack is retained.

`scripts/render-signature-studies.py --only glide` exports the v7 master, silent
film and both posters. Previous v6 media are retained. The preview opens on
Glide; no homepage adoption or public deployment is made.

`scripts/check-glide-transition.py` checks unchanged opening/ending frame
hashes, the pixel-exact native logo, persistent frame-corner visibility across
69 transition samples, and near-zero entry/exit motion. It also renders a
nine-frame transition review sheet outside the application checkout.

## Three additional dark studies — current comparison

The user requested three more films in the style of the dark Signature cut.
The primary comparison now contains the unchanged Signature v5 (03) plus:

| Option | Duration | Motion |
| --- | --- | --- |
| 04 Aperture | 5.4 s | A hairline teal aperture opens vertically over the scans, closes to a short line, then yields to the intact identity. Clipping does not stretch the scan. |
| 05 Glide | 5.4 s | The separate scans travel sideways through one wide portal. Its framing contracts toward the approved mark, followed by the wordmark reveal. |
| 06 Lumen | 5.6 s | Larger frameless scans recede subtly, change with brief soft focus pulls, and dissolve into the approved identity. |

All three are 60 fps and remain dark throughout, without interface labels,
particles, strobing or new anatomy. They use the same CC0 chest, CT 10–12 and
MRI frames 028–034 and the approved dark PNG identity. Final logo regions are
checked pixel-for-pixel against the source PNG before encoding. Source credits
and the artistic/non-diagnostic distinction remain visible on the preview.

`scripts/render-signature-studies.py` reproduces the three v6 studies using the
existing refined renderer's grading, timing helpers and assets. `--stills`
produces review sheets; `--only aperture`, `--only glide` or `--only lumen`
limits exports. Each writes `{name}-v6.mp4` (1080p, optional original sound),
`{name}-silent-v6.mp4` (720p, no audio stream), `{name}-poster-v6.webp`, and
`{name}-logo-poster-v6.webp` under `public/media/splash/`.

The initial comparison opened on Aperture. Signature stays beside the new options;
Reveal and Voyage remain available under Earlier directions. Only the chosen
video is mounted, with the existing reduced-motion, data-saving, muted-autoplay,
replay, native-control and download behavior. No home splash adoption,
publication, account change or preference persistence is performed.

## Signature refinement

### Dark cut — retained reference

At the user's request, option 03 now uses **Signature v5**: an edge-to-edge dark
charcoal background with a restrained teal lift, the exact approved dark-theme
lockup (white lettering), and a pale tagline. The player surround is also dark.
The scan sequence, motion, sound and 5.2-second / 60 fps timing are unchanged.
The light v4 files are preserved. This is still preview-only: no homepage
adoption or publication is made.

Run `scripts/render-signature-refined.py --dark` to reproduce `signature-v5.mp4`,
`signature-silent-v5.mp4`, `signature-poster-v5.webp`, and
`signature-logo-poster-v5.webp`. Add `--stills` for a six-frame review sheet.
The final logo composition was checked pixel-for-pixel against the approved
dark PNG before encoding. Omitting `--dark` still reproduces the light v4 cut.

### Previous light cut

The user selected the direction of option 03 and requested a slicker refinement.
This produced **Signature v4**, while Reveal and Voyage remained unchanged.
The previous Signature v3 files were retained but no longer used by that option.
No homepage adoption, storage-key change or publication was made.

The refined film is 5.2 seconds at 60 fps. It keeps the bright palette while
using thinner rounded teal framing, soft directional scan wipes, a restrained
contact shadow, and one continuous movement from the scanning window into the
final logo position. The approved light lockup supplies both the symbol and
wordmark in their exact final coordinates. The endorsement is part of that same
approved artwork. No alternate font or newly drawn brand symbol replaces it.

Files: `signature-v4.mp4` (1080p review master with optional sound),
`signature-silent-v4.mp4` (720p without an audio stream),
`signature-poster-v4.webp`, and `signature-logo-poster-v4.webp`, all beneath
`public/media/splash/`. `scripts/render-signature-refined.py` reproduces the cut;
`--stills` produces six review frames. It uses only NumPy, Pillow and the existing
FFmpeg runtime, not the 3D models or graphics renderer. Source licensing and
clinical boundaries below are unchanged; no new image source is introduced.

---

Status: local comparison, awaiting the user's choice. These concepts are not
wired into `SplashScreen.tsx`, do not change its storage version, and have not
been published. Selection on `/splash-preview` only selects a preview player;
it does not save an adoption preference or change the homepage.

## The three directions

| Concept | Duration | Direction |
| --- | --- | --- |
| Reveal | 7.2 s | A genuine 3D camera pull-back around a lit brain mesh, then large photographic X-ray, CT and MRI shots, and a widescreen title finish. |
| Voyage | 6.8 s | A continuous lateral camera move through separate imaging planes, with perspective and restrained floor reflections. |
| Signature | 5.6 s | A light-background brand ident: the approved mark's framing brackets enclose X-ray, CT and MRI, close into the symbol, and resolve to the full identity. |

All three use the approved PNG identity without recreating its lettering. The
existing tagline appears at the end. The soundtracks are original synthesized
tonal beds with a quiet ending; no third-party music or audio samples are used.

## Files

For each of `reveal`, `voyage` and `signature`, `public/media/splash/` contains:

- `{name}-v3.mp4`: 1920×1080, 30 fps, H.264/AAC, optional-sound review master.
- `{name}-silent-v3.mp4`: 1280×720, 30 fps, H.264 without an audio track, ready
  for possible adoption after selection.
- `{name}-poster-v3.webp`: a representative frame for preview and selection.

Only the selected review film is mounted. Changing concepts unmounts and pauses
the old player. The preview supports replay, explicit sound, download and native
video controls. Reduced-motion/data-saving preferences prevent initial autoplay;
an explicit user selection can play the requested film. Hiding the tab pauses
playback. Preference changes to reduced motion also pause it.

## Provenance and boundaries

The scans below are the existing CC0 sources documented more fully in
`cinematic-splash.md`:

- Chest X-ray: Stillwaterising,
  https://commons.wikimedia.org/wiki/File:Chest_Xray_PA_3-8-2010.png
- CT: Mikael Häggström, M.D., original-size axial plates 10–12,
  https://commons.wikimedia.org/wiki/Scrollable_computed_tomography_images_of_a_normal_brain_(case_1)
- MRI: Edlow et al. (2019), Dryad, https://doi.org/10.5061/dryad.119f80q ;
  the previously downloaded sagittal WebM was converted by Jahobr. The movie
  uses extracted frames 022–042, colour-treated and retimed. It is an ex vivo
  research scan, not a clinical normal-head atlas case.

Reveal additionally uses Drummyfish's hand-modelled brain mesh, based by its
creator on their own MRI. Source page and CC0 declaration verified 4 September
2026: https://opengameart.org/content/brain-and-skull . The downloaded OBJ's
first line also states CC0 1.0/public domain. Exact source:
https://opengameart.org/sites/default/files/head_0.obj . Only its `brain` object
appears in the film, with two Catmull–Clark subdivision passes, smooth normals,
original lighting and camera motion. No face or eyes are used.

The reusable offscreen renderer also supports a CDmir skull mesh obtained during
asset research. It does not appear in any of these three films. Its independent
CC0 source is https://opengameart.org/content/human-skull-0 , with archive
https://opengameart.org/sites/default/files/skull-obj.zip . Its accompanying
textures are assigned directly because the source MTL refers to nonexistent
subdirectories. This research asset remains outside the site checkout.

These are separate sources composed for branding. They are not one patient's
study, a co-registered multimodal reconstruction, a validated segmentation or
educational atlas content. Image interpolation and camera transforms are visual
treatments only. Credits and this distinction are visible on the preview page.

No reference-studio footage, third-party music, generated pseudo-scans or patient
uploads from the application are used. The general cinematic framing approach
was informed by Maxon's account of MadMicrobe's *Beneath the Skin*:
https://www.maxon.net/en/article/beneath-the-skin .

## Reproduction

`scripts/render-splash-options.py` composites and exports the three films;
`scripts/splash_3d.py` renders the licensed meshes offscreen with ModernGL.
`--stills` creates six-frame review sheets, and `--only reveal` (or `voyage` or
`signature`) limits rendering to one concept. The earlier verified projection
helper in `render-splash-film.py` is reused, not its old animation composition.

Source media, intermediate frames and render dependencies live outside the app
in `../work/cinematic-splash/`: existing scans in `sources`, existing extracted
MRI frames in `mri-frames`, new meshes in `new-assets`. Python needs NumPy and
Pillow, imageio-ffmpeg 0.6.0 in `minimal-runtime`, and ModernGL 5.12.0/glcontext
3.0.0 in `motion-runtime`. The local offscreen graphics context supports OpenGL
3.3. Windows Segoe UI is used for the tagline, not for recreating the logo.

All six exports are fast-start MP4s. No rendering dependencies or source models
are needed by the website; browsers receive only the rendered media.
