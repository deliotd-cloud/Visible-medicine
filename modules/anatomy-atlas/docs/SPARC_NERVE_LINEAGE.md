# SPARC nerve-path lineage — 17 September 2026

## New finding

The retained `nervesWithVagus.exf` is byte-identical to the nerve input in the
published Physiome Model Repository workflow at commit
`317fdad54e9aa42c0bd3e06b61ea9d9833d9364c`. This establishes an upstream file
relationship, not independent nerve authorship, anatomical validation or a
transform into this atlas. No candidate is admitted.

The inspected workflow has four nodes: Multiple File Chooser, Argon Viewer and
two Argon Scene Exporter nodes (WebGL and Thumbnail). The chooser supplies17
existing EXF files, including the nerve file, bones, muscles, arteries and veins.
It does not contain a nerve-coordinate construction or fitting step. Therefore,
running this workflow would reproduce a display/export, not establish how the
input nerve coordinates were authored or which upstream asset terms apply.

## Exact inspected evidence

All links below bind to the same immutable PMR commit. Public HTTP reads only;
no accounts, paid services, software installation or third-party API keys.

| Input | Bytes | SHA-256 |
| --- | ---: | --- |
| [Workflow project](https://models.physiomeproject.org/workspace/add/rawfile/317fdad54e9aa42c0bd3e06b61ea9d9833d9364c/mapclient%20workflow/map-client-workflow.proj) | 2387 | `6122879c909136281edaffec9f36a3b4ab0365142f0cd1f5ccae89b7530758d2` |
| [Viewer configuration](https://models.physiomeproject.org/workspace/add/rawfile/317fdad54e9aa42c0bd3e06b61ea9d9833d9364c/mapclient%20workflow/Argon_viewer.conf) | 154 | `0956d9790b7fba7394f2d2a6f678b8ead783a72dd8d86db994bf0f2842aa8720` |
| [Nerve-path input](https://models.physiomeproject.org/workspace/add/rawfile/317fdad54e9aa42c0bd3e06b61ea9d9833d9364c/mapclient%20workflow/Organs/nervesWithVagus.exf) | 797853 | `248b2da5638bbd684894d6ba8a175b1ee6454fc3dfc7b921bc5af2721e5b5b19` |

[File chooser configuration](https://models.physiomeproject.org/workspace/add/rawfile/317fdad54e9aa42c0bd3e06b61ea9d9833d9364c/mapclient%20workflow/Multiple_File_Chooser.conf)
lists the17 inputs. The viewer configuration names
`document-whole-body.json` as its visualization document. Neither inspected
configuration provides nerve-component authorship or licence terms.
The old five-file audit retains the same nerve-file digest. No source was
changed, repaired, tessellated, bridged, mirrored or registered.

## What the publications do and do not establish

[Dataset307 version8](https://discover.pennsieve.io/datasets/307) describes estimated
nerve landmarks checked against literature and labels the dataset CC BY4.0.
The [upstream README](https://models.physiomeproject.org/workspace/add/rawfile/317fdad54e9aa42c0bd3e06b61ea9d9833d9364c/README.rst)
identifies Anatomography/BodyParts3D-derived context but does not supply a
separate nerve-generation provenance record.

Patel et al.'s [2026 SPARC overview](https://doi.org/10.1186/s42234-026-00213-z)
describes the whole-body scaffold and its interactive neural connectivity
mapping. It supports the source's research relevance, not the spatial accuracy
of each branch or the rights chain of this individual EXF input. Its article
licence is CC BY4.0 with the stated third-party-material exception; no article
figures, screenshots, tables, scans or assets are copied into the atlas.

These observations do **not** establish that the nerve file is prohibited from
commercial use. They also do not resolve whether upstream attribution/share-alike
conditions apply to its coordinates. Do not replace that uncertainty with a
blanket non-commercial label or automatically relicense the file.

## Decision and next evidence needed

Keep this candidate in local research storage, outside generated/public assets.
The workflow is now traced; do not repeat the same retrieval or install/run it
hoping to resolve authorship. The next useful evidence is a nerve-specific
creation/source record or clarification from the dataset contributors covering:

1. Whether these exact coordinates were independently placed, transformed from
   another anatomical dataset, or fitted using copyright-bearing source assets.
2. The input sources, applicable licences and attribution chain for the nerve
   component, including any share-alike conditions.
3. Which branches were estimated/reconstructed, and the native coordinate frame
   and units. No BodyParts3D/patient alignment may be inferred from a common name.

No contributor was contacted and no new external coordination was authorized.
Other atlas work can proceed. If cleared, start with a separate schematic source
view and the retained duplicate-ID/zero-length holds from
[the structural audit](SPARC_NERVE_SOURCE_REVIEW.md), not automatic whole-body
overlay or measured-calibre tubes. Owner radiologist review remains required.
