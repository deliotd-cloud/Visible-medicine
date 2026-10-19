/** Typical attachment partners; not measured footprints on the source surfaces. */
export const longusColliAttachmentReference = {
  title: 'Loyola · head and neck muscle attachments',
  url: 'https://www.stritch.luc.edu/lumen/meded/grossanatomy/homepage/muscletables/head-neckmuscletable.pdf',
};
const origin = (bones: string[], site: string) => ({ role: 'proximal' as const, label: 'Origin · bony partners', bones, site });
const insertion = (bones: string[], site: string) => ({ role: 'distal' as const, label: 'Insertion · bony partners', bones, site });
export const longusColliAttachments = [
  { key: 'longus-colli-superior-oblique', fmas: ['FMA46284'], endpoints: [
    origin(['FMA12521', 'FMA12522', 'FMA12523'], 'C3–C5 anterior transverse-process tubercles'),
    insertion(['FMA12519'], 'Anterior tubercle of C1'),
  ] },
  { key: 'longus-colli-vertical', fmas: ['FMA46286'], endpoints: [
    origin(['FMA12523', 'FMA12524', 'FMA12525', 'FMA9165', 'FMA9187', 'FMA9209'], 'Anterior bodies from C5 through T3'),
    insertion(['FMA12520', 'FMA12521', 'FMA12522'], 'Anterior bodies at C2–C4'),
  ] },
  { key: 'longus-colli-inferior-oblique', fmas: ['FMA46288'], endpoints: [
    origin(['FMA9165', 'FMA9187', 'FMA9209'], 'Anterior bodies at T1–T3'),
    insertion(['FMA12523', 'FMA12524'], 'C5–C6 anterior transverse-process tubercles'),
  ] },
];
export const longusColliAttachmentNote = 'Only the supplied left part is shown; no right counterpart is generated. These typical levels do not verify donor footprints, individual slips or a surgical plane. Longus capitis is separate and is not substituted.';
