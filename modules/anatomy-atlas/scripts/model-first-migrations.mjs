// Exact, reviewed departures from the immutable 40e47408 model-first baseline.
// A handler is admitted only by name and canonical TypeScript SHA-256. The
// provenance/evidence fields make each pin auditable; they do not relax checks.
export const modelFirstHandlerMigrations = Object.freeze({
  captureView: Object.freeze({
    sha256: '4b76e9631ae8970728eab86382896ab221be2e6bfb184bbc8a30f2918c87e738',
    commits: Object.freeze(['6cbeafbf85430e02e569a3bdd3a5d7e16b0a1467']),
    evidence: Object.freeze(['node scripts/test-study-view-laterality.mjs']),
  }),
  startExam: Object.freeze({
    sha256: '940df890fe3bc6ac2a4efb305915927f1f79a205ff14f88e876f226c87e31550',
    commits: Object.freeze(['5e3667fe3c9f012cbc21e679ba2e834f527dcc3f']),
    evidence: Object.freeze(['node scripts/test-practice-return-view.mjs']),
  }),
  nextQuestion: Object.freeze({
    sha256: 'f0b100a89306b2ce3414f9a25a383e7b1d33b6e8707894fe3b1f7370da897531',
    commits: Object.freeze(['5e3667fe3c9f012cbc21e679ba2e834f527dcc3f']),
    evidence: Object.freeze(['node scripts/test-practice-return-view.mjs']),
  }),
  restorePracticeView: Object.freeze({
    sha256: '19865fc7e925f86c842af6956daa68d4831b55791fb65f809162d9e9867c4a45',
    commits: Object.freeze(['5e3667fe3c9f012cbc21e679ba2e834f527dcc3f']),
    evidence: Object.freeze(['node scripts/test-practice-return-view.mjs']),
  }),
  exitPractice: Object.freeze({
    sha256: 'fdd5bc7ebb9101591f5a35fd72d175861030482090ed9dcc5aff03d55de38714',
    commits: Object.freeze(['5e3667fe3c9f012cbc21e679ba2e834f527dcc3f']),
    evidence: Object.freeze(['node scripts/test-practice-return-view.mjs']),
  }),
  restoreStructure: Object.freeze({
    sha256: '46840cddce5f8d9c2c22b50f6d41062364b0c2d5d1069a453118819b492e5873',
    commits: Object.freeze(['b0cf1d5855ecd2f44c30c3c3791caf12ac970b98']),
    evidence: Object.freeze(['node scripts/test-restore-visibility.mjs']),
  }),
  restoreStructures: Object.freeze({
    sha256: '84c29c7b1b9119011d3f7921ff302531b314b30dbca1095ebbccc57aefa07648',
    commits: Object.freeze(['b0cf1d5855ecd2f44c30c3c3791caf12ac970b98']),
    evidence: Object.freeze(['node scripts/test-restore-visibility.mjs']),
  }),
  retryAnatomy: Object.freeze({
    sha256: 'f0db9be0deeab6fc58b70c3423022dcf1b0bfcb3f84e905ef97514e9ec69f549',
    commits: Object.freeze([
      '772e3dade17cd61bd1bad3f1c6e5ff86cbc965cb',
      '12bf83e1',
      '2dad4fca',
    ]),
    evidence: Object.freeze([
      'node scripts/validate-anatomy-loading.mjs',
      'node scripts/validate-study-views.mjs',
    ]),
  }),
  resetView: Object.freeze({
    sha256: 'b5194f7b29cc94da04155e6b06bb3bf59b54fe2ae3a96e7a20295d50776e9740',
    commits: Object.freeze(['5c20d43a']),
    evidence: Object.freeze([
      'node scripts/validate-camera-orientation.mjs',
      'node scripts/validate-study-views.mjs',
    ]),
  }),
  restoreView: Object.freeze({
    sha256: '3c346efc820053be6e41f7c4df9e098773108f79144b0eec924e51f49b2c4d71',
    commits: Object.freeze([
      '772e3dade17cd61bd1bad3f1c6e5ff86cbc965cb',
      '5c20d43a',
      '6786ed3c',
    ]),
    evidence: Object.freeze([
      'node scripts/validate-study-views.mjs',
      'node scripts/validate-dissection-workbench.mjs',
    ]),
  }),
  changeVesselVisibility: Object.freeze({
    sha256: '8b2105a9de93cdf92c49e1b8b5bb6640bd7bdb17c1c5cc2c9f41d97371ec94ef',
    commits: Object.freeze(['f271f3f1', '47b60cb4']),
    evidence: Object.freeze(['node scripts/validate-vessel-visibility.mjs']),
  }),
  showMuscleAttachments: Object.freeze({
    sha256: '20a59b8f510ed1807433e432a83b4e63e926573aee5bf529eed1539b52350e3c',
    commits: Object.freeze([
      'b1e37103',
      '90b117d2',
      'b6b1ffe4',
      '0f72c699',
      'e581676c',
      '4a9a5d5a',
      '1bf124a9',
      '4516a19b',
    ]),
    evidence: Object.freeze([
      'node scripts/validate-arm-attachments.mjs',
      'node scripts/validate-thigh-attachments.mjs',
      'node scripts/validate-neck-attachments.mjs',
      'node scripts/validate-forearm-attachments.mjs',
      'node scripts/validate-leg-attachments.mjs',
      'node scripts/validate-acral-attachments.mjs',
      'node scripts/validate-trunk-attachments.mjs',
      'node scripts/validate-hip-attachments.mjs',
    ]),
  }),
});

// Applied after the pre-compact and contextual-dissection snapshots are checked.
export const modelFirstPracticeCallbackMigration = Object.freeze({
  commit: '5e3667fe3c9f012cbc21e679ba2e834f527dcc3f',
  reason: 'Practice exit restores the captured regional presentation before exiting.',
  remove: Object.freeze([
    'onClick/722fbbca8a2f3cf1da1ec8bfdd3c07d835fdc540f01b82c999e9f783d45d22c1',
  ]),
  add: Object.freeze([
    'onClick/01b63583ac8542a679e3de8da8fe2774fd815628dbae121c45c1e904b2961ee1',
  ]),
  evidence: modelFirstHandlerMigrations.exitPractice.evidence,
});

export const modelFirstLateCallbackMigrations = Object.freeze([
  modelFirstPracticeCallbackMigration,
  Object.freeze({
    commit: 'ffe718b7e75778c3c9bd27b9094b0ff9743bb267',
    reason: 'Separation ignores exam and empty-view requests.',
    remove: Object.freeze(['onValueChange/47c85b1c47a0ca99aa3cbfb9b61caa74d53dcf5c945ab3c7a766cac596813974']),
    add: Object.freeze(['onValueChange/0188fa3cebbf579abdfd26894cccaf1bc0b3d1c54af905b8abcc1d0e91ee4846']),
    evidence: Object.freeze(['node scripts/test-viewer-control-state.mjs']),
  }),
  Object.freeze({
    commit: '03e05321688e893463e1a45547373b304cc9896e',
    reason: 'Practice results open study details with fresh framing and focus.',
    remove: Object.freeze(['onClick/c56fd050c8413a03c543f86e5ec4ae82c230bce93a954ef0d7afbc4e051991db']),
    add: Object.freeze(['onSelect/7ca53e50b5d408f8322e227a61dbf1de022948a87e4f8846ff05c96f99decac4']),
    evidence: Object.freeze(['node scripts/test-practice-result-navigation.mjs']),
  }),
]);

export const modelFirstCallbackMigrations = Object.freeze([
  Object.freeze({
    commit: '47b60cb4',
    reason:
      'Canonical formatting of the vessel toggle and three existing guarded specimen launchers.',
    remove: Object.freeze([
      'onEnabled/61561ba3764844c4042219fbae20e9358d4bf57b393d21f3c0176f148a061cec',
      'onClick/432739e4dd819ff700ef87c977cb5bec767312519f872117c90934c48b22c9d8',
      'onClick/1feeb949b3ec5cc16ea341f35cbf19bcbf4df7abade7e832efee2d3abf5bb359',
      'onClick/48aabf4b223b1259418d5aa371a737011f2fe0da3993fe0b87e9c60d2e3f72cd',
    ]),
    add: Object.freeze([
      'onEnabled/4709c809fed7924b625e238440db5cba3e4bb90ff6571c76c33b065a743ce1d2',
      'onClick/1523b2c52d3c034dec6543d7a62a7ac1f170c8e451bfddf25b4a57b8333ba808',
      'onClick/094f85aeefee0e88cc06df2f16b4aa4e62ebf9fde1f31137487fd1c75ea22c0f',
      'onClick/2b1cb9ec60b14e7241a486ebcf4a656dc96883043c3d94a61d95198308d29681',
    ]),
    evidence: Object.freeze([
      'node scripts/validate-vessel-visibility.mjs',
      'node scripts/validate-back-layers.mjs',
      'node scripts/validate-hra-pelvis.mjs',
      'node scripts/validate-hra-renal.mjs',
    ]),
  }),
  Object.freeze({
    commit: 'b1e37103',
    reason: 'Source-bound attachment panel and its existing selection callback.',
    remove: Object.freeze([]),
    add: Object.freeze([
      'onShow/6f788d474b71535c857631d3320235382068e1f27d8bff6d9900ba97529f5a2b',
      'onSelect/610c7aa707c1e7792cda3854a7ec79d0a63ef3319881a1625f5f6eae7a2cf70d',
    ]),
    evidence: modelFirstHandlerMigrations.showMuscleAttachments.evidence,
  }),
  Object.freeze({
    commit: '720e44a1',
    reason: 'Zoom buttons now drive the live fitted camera by signed steps.',
    remove: Object.freeze([
      'onClick/8268078af3e7b9a991833865fe62acc9756c355e56846d7cfaac363595230fc4',
      'onClick/90cacb057d7a743d19ea16a9196927edb2b0646fb39abb6f9d006ac23a44fada',
    ]),
    add: Object.freeze([
      'onClick/0b24a9b78d079d8ad542959f6d10a17714e9d83471d96445f991026ee530de59',
      'onClick/151b68544873be081841a05ab209ea4ff84f0c5d6ee7bed77d89de01ff966235',
    ]),
    evidence: Object.freeze(['node scripts/validate-camera-orientation.mjs']),
  }),
]);
