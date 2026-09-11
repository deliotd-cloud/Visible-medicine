// Exact original definitions; held labels are never silently corrected or mirrored.
export const collicularBrachiaSources = [
  {
    id: 'FMA73462',
    name: 'brachium of left superior colliculus',
    side: 'left',
    file: 'FJ1735',
    sha256: '9a480c1559b0089b614b5f86d1e4719ff80d9ae3cc9ea2e0a76e98c37f14bdf3',
    status: 'held',
    reason:
      'Source says left but all source X coordinates are negative (right); laterality requires adjudication.',
  },
  {
    id: 'FMA73461',
    name: 'brachium of right superior colliculus',
    side: 'right',
    file: 'FJ1736',
    sha256: '77d77692b0ff86d405d8b1336474f1a2e5b43bd5303956737ce65dfafbd99fa4',
    status: 'held',
    reason:
      'Source says right but all source X coordinates are positive (left); laterality requires adjudication.',
  },
  {
    id: 'FMA73464',
    name: 'brachium of left inferior colliculus',
    side: 'left',
    file: 'FJ1761',
    sha256: '190f6b408b3967c91cfe4aab21672a5998867b4ea5a145567de66df8111da3aa',
    status: 'candidate',
  },
  {
    id: 'FMA73463',
    name: 'brachium of right inferior colliculus',
    side: 'right',
    file: 'FJ1809',
    sha256: '733feb8590917edc0454661f7027564ae56fe51d4b916f59f82c1e222e0faefc',
    status: 'candidate',
  },
];
