export const coronaryArterialUsReference = 'https://link.springer.com/article/10.1186/1476-7120-7-58';
export const coronaryArterialUsGroups = {
  'left-main': ['FMA3855'],
  lad: ['FMA3862'],
  circumflex: ['FMA3895'],
  'right-coronary': ['FMA3802'],
} as const;
export type CoronaryArterialUsGroup = keyof typeof coronaryArterialUsGroups;

// Original concise, attributed summaries; no figures or patient media imported.
export const coronaryArterialUsTopics = {
  'left-main': { body: 'On transthoracic echocardiography, the left main may be followed near the left aortic sinus towards the LAD–circumflex division. Its visibility does not establish that both daughter vessels have been completely examined.' },
  lad: { body: 'Coronary Doppler can depict LAD segments along the anterior interventricular groove. Confirm continuity across views rather than assuming that a nearby parallel branch is the same vessel.' },
  circumflex: { body: 'The proximal circumflex may be seen leaving the left main towards the left atrioventricular groove. Distal visibility was markedly poorer in the cited study; a proximal view is not an examination of the entire artery.' },
  'right-coronary': { body: 'The proximal RCA may be seen near the right aortic sinus and anterior tricuspid-ring region. Complete proximal-segment depiction was less reliable than left-main depiction in the cited study; retain uncertainty when its course is interrupted.' },
} as const;
export const coronaryArterialUsEvidenceLimit = 'Evidence: one 2009 feasibility study of 111 angiography-referred adults using experienced operators. Selected acoustic windows and possible segment misidentification limit generalisation; this is not a universal visibility guarantee.';
