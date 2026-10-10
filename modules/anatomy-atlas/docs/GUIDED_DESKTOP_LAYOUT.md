# Compact guided learning and screen-side leaders

The shoulder and regional guided players keep the current caption and playback
controls together on wide canvases. References, draft imaging notes and regional
quick checks remain available in a bounded secondary area. Narrow layouts stack
the controls. At 1100 pixels and wider, a side dock contains the caption,
controls and scrollable resources beside the full-height model. Expanding notes
cannot increase that grid's height. Long captions are not truncated: their named, keyboard-focusable
regions can scroll independently. Supplemental reading still pauses the tour;
closing it never resumes playback automatically. Readiness, retry, reduced-motion,
source identity and reversible Exit behavior are unchanged.

The label layer now consumes the layout's leader points instead of drawing every
connection as a straight line. Each accepted label keeps its projected screen
side, box order, endpoint and density priority. A bounded local search tries the
straight connection and two single-bend alternatives, penalizing intersections
and unnecessary length. Frames with no conflicts retain straight leaders without
the search. The reproduced three-label crossing and its mirror are tested both
as independent segment intersections and through the actual SVG frame callback.

This is not a universal non-crossing guarantee. Coincident anchors and densely
packed columns can still conflict, and leader routing does not establish whole-
tissue occlusion or anatomical accuracy. Existing selected-anchor depth cues,
fade/cut/exam guards and hidden-label focus return remain in place.

No anatomy geometry, structure IDs, teaching text, dependencies, fonts, models
or licences are added or changed. Display revisions must be regenerated and
remain subject to revision-bound radiologist review. Source component tests do
not prove browser font metrics, GPU recovery, device coverage or clinical approval.
See the saved local checkpoint for actual desktop verification and its limits.
