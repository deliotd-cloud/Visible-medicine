# Related lectures from Atlas structures

Learners can now find published lecture slides from selected, explicitly mapped
head anatomy in CT, MRI and the existing 3D Atlas. Discovery opens separately,
preserving the original Atlas view. Atlas access never grants paid lecture access.
Only slides already linked and published through Studio can appear; this feature
does not create lectures or approve teaching.

## Learner route

1. Select mapped anatomy in the native CT or MRI head Atlas. Open Learn this in
   context, then Related lectures. In the existing 3D comparison panel, open
   Related lectures beneath the selected comparison focus.
2. Choose Find related lectures. Sign in if required; the exact anatomy source
   remains in the return address.
3. Open a listed slide. Its link carries the stable slide ID and the verified
   publication hash, using the existing published lecture player.
4. Use the original Atlas tab to resume the scan or model without losing its view.

The discovery page also offers exact CT, MRI and, where explicitly mapped, 3D
return links. Image-only cerebellar concepts do not gain a guessed 3D match.
Existing guided tours remain available. In-model practice, guided playback,
connecting and unavailable states do not disclose related lecture links.

## Access and source boundaries

The server requires an actual signed-in user, including during local preview.
The local demo fallback is not used. Candidate discovery reads only workbook IDs
from active learner allocations with current course enrolment, or from the
educator's own Studio-enabled organization. No lecture titles, slide bodies or
publication hashes are returned by that coarse query.

Every candidate passes the existing published-lecture guard before its title or
slide links are disclosed. That guard checks current allocation, availability,
expiry, prerequisites, organization ownership and canonical publication integrity.
Playback checks access again. Draft, withdrawn, unauthorized, corrupt and stale
anatomy references are omitted rather than replaced with different teaching.
Atlas, case and lecture permissions remain independent; there is no schema,
permission, dependency, licensed-asset or subscription change.

`/learn/related-anatomy` accepts one `concept` and one `headRevision`, with an
optional `offset` for a group of 16 candidates. Repeated, malformed, unknown or
stale inputs cause no lecture database lookup. Groups limit publication checks
per request; More allocated lectures continues to the next group. An empty group
does not claim there are no matches in other groups. Database failures show a
generic retry message, not unavailable lecture metadata or internal errors.

Only explicit current anatomy mappings are supported. Semantic comparisons do
not establish patient-space registration. CT and MRI remain separate subjects.
Accepted masks, scans and the desktop clinical PACS are unchanged.

## Desktop review

Use an allocated, published lecture with an explicit current anatomy link, then
select the same structure in CT, MRI and the existing 3D comparison. Check that
the new tab lists its linked slides and opens the exact slide and publication.
Verify that the original Atlas tab retains its view and that existing guided
tours still work. Repeat with an image-only cerebellar concept: CT and MRI links
are available without an invented 3D target.

Check signed-out sign-in continuity, an Atlas-only account, expired allocations,
unmet prerequisites, a changed publication, stale anatomy pins and a foreign
educator organization. Unavailable lecture titles and slide content must not
appear. Check keyboard focus and long titles at desktop widths. Automated source,
SQLite, real publication-guard, component, type and build checks do not replace
signed-in browser or clinical acceptance. Browser acceptance remains pending
under the previously recorded browser block; nothing is deployed.

## Implementation references

The server uses the existing D1 binding and parameterized statements. JSON
candidate filtering uses the documented JSON functions, with malformed and
non-object values guarded before extraction. See
[Cloudflare D1 JSON querying](https://developers.cloudflare.com/d1/sql-api/query-json/)
and [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
There are no new bindings, paid services or external content requests.
