// Exact official IS-A definitions; held groups are never exported.
export const deepLegVeinSources = [
  {
    id: 'FMA44336',
    name: 'right anterior tibial vein',
    side: 'right',
    files: [
      {
        file: 'FJ2132',
        sha256:
          '882bc85f20f37456f27048340d2b431b26e9f1fa4e877b935adf984958384cae',
      },
      {
        file: 'FJ2193',
        sha256:
          'f21e0ec17c0a9366b40494fa34c893386301fba3099df0eb9f3a9476fbaeb770',
      },
    ],
    status: 'candidate',
    region: 'leg',
    regions: ['leg', 'foot'],
  },
  {
    id: 'FMA44337',
    name: 'left anterior tibial vein',
    side: 'left',
    files: [
      {
        file: 'FJ2097',
        sha256:
          'baad24d3cc1c5bbc493e95793efa217b3c6d6a6ac87006b15f0bb21a26a0cc1e',
      },
      {
        file: 'FJ2183',
        sha256:
          '64fae2f22228c4da162d61c70e2fe4d59fdcf13e35218df093b58d8eff6dff08',
      },
    ],
    status: 'candidate',
    region: 'leg',
    regions: ['leg', 'foot'],
  },
  {
    id: 'FMA44338',
    name: 'right posterior tibial vein',
    side: 'right',
    files: [
      {
        file: 'FJ2173',
        sha256:
          'e2b3c5e3b353033d69a81457f4d55e9da6261399713600b5e200ae2e236c8b34',
      },
    ],
    status: 'candidate',
    region: 'leg',
    regions: ['leg', 'foot'],
  },
  {
    id: 'FMA44339',
    name: 'left posterior tibial vein',
    side: 'left',
    files: [
      {
        file: 'FJ2118',
        sha256:
          '06d0d03da663cc3c83f8efd7dd1cc99ea0cfb912f6ee01c3ed89d51212605db8',
      },
    ],
    status: 'candidate',
    region: 'leg',
    regions: ['leg', 'foot'],
  },
  {
    id: 'FMA44885',
    name: 'right fibular vein',
    side: 'right',
    files: [
      {
        file: 'FJ2190',
        sha256:
          'a5431e133125281da79f46e03127d9bf02d3af64c97f65e17416f2295ed88fec',
      },
      {
        file: 'FJ2194',
        sha256:
          'a7ea02f9a20652c13078085d42030600b5d3a81ec29ab900a4f6506c78909c3c',
      },
      {
        file: 'FJ2200',
        sha256:
          '24ff387bbecbffcbdd5c54e3fedb2b962e79cecc23966d4106b68eb4f9eafa18',
      },
    ],
    status: 'held',
    reason:
      'Official aggregate includes contralateral proximal fragments (FJ2190); do not crop or relabel it.',
  },
  {
    id: 'FMA44886',
    name: 'left fibular vein',
    side: 'left',
    files: [
      {
        file: 'FJ2184',
        sha256:
          'fa05945c0cd884f7283b80079c48b76177e7881e6e1a68f24b6be8c4466ea2a2',
      },
      {
        file: 'FJ2187',
        sha256:
          '7515a16a47c3fa87f917fb841faaca517bc153b816ead829310a07227688e53e',
      },
    ],
    status: 'held',
    reason:
      'Disconnected accessory fragments and opposite-side aggregate ambiguity require source review.',
  },
  {
    id: 'FMA51042',
    name: 'right deep femoral vein',
    side: 'right',
    files: [
      {
        file: 'FJ2135',
        sha256:
          '4e74f0301c15232ce6cb744bd0439d779a9a77eef51b3cf26bab15a632ad2a95',
      },
    ],
    status: 'candidate',
    region: 'thigh',
    regions: ['thigh'],
  },
  {
    id: 'FMA51043',
    name: 'left deep femoral vein',
    side: 'left',
    files: [
      {
        file: 'FJ2099',
        sha256:
          '7ce931eee500efd0c796c2b29ee29000ad55c9b4c31784bec72dd23b5defa3f3',
      },
    ],
    status: 'candidate',
    region: 'thigh',
    regions: ['thigh'],
  },
];
