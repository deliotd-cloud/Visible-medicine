# Reviewing the MRI-only drafts

Open **Workspace → Clinical Review → Head learning** with your authorized administrator account. The structure picker includes two new entries:

- **MRI-only clinical corrections · Private notes** — the pituitary and corpus-callosum clinical notes.
- **MRI-only anatomy check corrections · Private notes** — the paired amygdala, corpus-callosum and pituitary questions and their bound MRI teaching.

Choose an entry, then select **Open summary**. The evidence and correction form are folded together. Inspect the exact MRI and existing 3D targets, sources and answer keys before writing notes. No exact CT counterpart is mapped for these structures; the MRI and generic 3D model are separate, unregistered subjects.

## Saving corrections

1. Wait for your private saved history to load.
2. Enter the scope and notes; use **Corrections requested** for a specific change. That status requires at least ten characters of explanation.
3. Select **Save private draft** or **Save private correction request**. A successful save confirms a new version; previous entries remain in history.

Each packet has its own history, isolated by signed-in account and institution. Saving or checking boxes does not approve or publish content, verify credentials, alter masks or record an exam score. Do not enter patient data.

If another tab saves, the account or institution changes, or the exact source revision changes, saving is locked. Keep your edits, use **Download working copy** if needed, then compare saved history before deliberately starting fresh or reloading. A download is private local JSON, not a confirmed server save or an approval; restore text manually against the current packet.

## Revision boundaries

| Packet | Exact revision | Bound concepts |
| --- | --- | --- |
| MRI-only clinical notes | `7aea768dd0ffb76208cb1a1a785747c022259273856884ade32119a2442b3f1f` | Pituitary, corpus callosum |
| MRI-only anatomy checks | `71f386b735182ce46c0282700b4fe69c1137eb5b8365b706c639deab1222ab2a` | Left/right amygdala, corpus callosum, pituitary |

Both bind head manifest `0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`. The question packet also binds the complete MRI teaching packet, including source metadata, limitations and exact targets. Historical notes keep their recorded revision and cannot silently become current.

The earlier anatomy, MRI teaching and clinical histories are unchanged and cannot approve these separate packets. Formal revision-bound radiologist sign-off remains separate from this correction workflow. Signed-in desktop visual acceptance and the owner's clinical review remain outstanding; automated route tests are not clinical acceptance.

## Implementation scope

This local website change reuses the existing authorized review guard, append-only D1 table, bounded input validation and version checks. No database migration, new dependency, scan upload, access-policy change, fee or public deployment was made. Routes retain the existing primary-first sequential D1 session and parameterized statements, consistent with [Cloudflare's D1 session API](https://developers.cloudflare.com/d1/worker-api/d1-database/#withsession) and [prepared-statement guidance](https://developers.cloudflare.com/d1/worker-api/prepared-statements/).
