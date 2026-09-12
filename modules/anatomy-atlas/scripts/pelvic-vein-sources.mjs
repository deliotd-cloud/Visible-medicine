const candidates = [
  {
    "id": "FMA18904",
    "file": "FJ3510",
    "name": "left iliolumbar vein",
    "side": "left",
    "kind": "vein",
    "sha256": "5e7fb984d08beac228872a1545a33bdf37092670d151ed11446d2cc7f5dd7b04"
  },
  {
    "id": "FMA18913",
    "file": "FJ3513",
    "name": "left inferior gluteal vein",
    "side": "left",
    "kind": "vein",
    "sha256": "5b1033ac53d09bc0597f1a854aca3bd20a521c863e06aff6dbf043fe33610315"
  },
  {
    "id": "FMA18919",
    "file": "FJ3525",
    "name": "left internal pudendal vein",
    "side": "left",
    "kind": "vein",
    "sha256": "811743a932eb89bfdc16a64d626652997c8136fc3d8fc7847f84e3ea88d28c34"
  },
  {
    "id": "FMA18907",
    "file": "FJ3526",
    "name": "left lateral sacral vein",
    "side": "left",
    "kind": "vein",
    "sha256": "2f40139ce7659fc490236cf41224aeb40bb404d048bd8209c0411c53b2d46358"
  },
  {
    "id": "FMA18916",
    "file": "FJ3527",
    "name": "left obturator vein",
    "side": "left",
    "kind": "vein",
    "sha256": "aa2581514d43322a57ed18573156043e605fd32d2174630aafaaee49221167f8"
  },
  {
    "id": "FMA18910",
    "file": "FJ3531",
    "name": "left superior gluteal vein",
    "side": "left",
    "kind": "vein",
    "sha256": "9b5bbf76ba93e44333cc8915d0df1d2f670dcd9997b9a542b13e383ece7e90c3"
  },
  {
    "id": "FMA18903",
    "file": "FJ3603",
    "name": "right iliolumbar vein",
    "side": "right",
    "kind": "vein",
    "sha256": "6c280dc5a5ef44be36926c62f6bf69d7d12ec9f2b565d7fb3db3ccefcf33113b"
  },
  {
    "id": "FMA18912",
    "file": "FJ3606",
    "name": "right inferior gluteal vein",
    "side": "right",
    "kind": "vein",
    "sha256": "1b99b7f96670faa00b9c735e93bf733e1cb7d1c3779b3870f578694d6af66f6a"
  },
  {
    "id": "FMA18918",
    "file": "FJ3610",
    "name": "right internal pudendal vein",
    "side": "right",
    "kind": "vein",
    "sha256": "74491f125d9becf64c010ab84fff1c4bd123c862e6542ee4c4e2dc2f21859dac"
  },
  {
    "id": "FMA18906",
    "file": "FJ3611",
    "name": "right lateral sacral vein",
    "side": "right",
    "kind": "vein",
    "sha256": "3be470cf3eac06fb284f246b704568d7e47d55a2fb9ad901d41150567fefd1df"
  },
  {
    "id": "FMA18915",
    "file": "FJ3612",
    "name": "right obturator vein",
    "side": "right",
    "kind": "vein",
    "sha256": "2a76779335098634c2bb9a643233f44fda922088015c1bbec90eb453513edee2"
  },
  {
    "id": "FMA18909",
    "file": "FJ3616",
    "name": "right superior gluteal vein",
    "side": "right",
    "kind": "vein",
    "sha256": "ea3cd12444ef7727416d20ca9aaf46a941053218dbd139604e2e047f38164177"
  }
];
// Coordinate sign alone is not an anatomical diagnosis. Keep these two source
// definitions offline until their cross-origin course/laterality is adjudicated.
export const pelvicVeinSources = candidates.map(s => ({...s,
  status: ['FMA18919','FMA18907'].includes(s.id) ? 'held' : 'candidate',
  ...(['FMA18919','FMA18907'].includes(s.id) ? {reason:'Left-labelled source crosses x=0; source-origin/midline course and laterality require anatomical adjudication. Do not shift, crop, mirror or relabel it.'} : {}),
}));
