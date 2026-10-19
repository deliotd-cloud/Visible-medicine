import type { AxialStudy } from '../lib/axial-anatomy';

export const deferentDuctStudy: AxialStudy = {
  id: 'pelvis-deferent-ducts', title: 'Male pelvis: deferent ducts',
  regions: ['pelvis', 'whole-body'], targetFmaIds: ['FMA19236', 'FMA19235'],
  context: [{fmaIds:['FMA15900','FMA9600','FMA19387','FMA19388','FMA7211','FMA7212','FMA15571','FMA15572']}],
  view: 'posterior',
  description: 'Follow the two source-labelled deferent ducts with the testes, seminal vesicles, prostate, bladder and ureters. Choose a side to reduce the context.',
  inspect: 'Select a duct or remove a covering structure; Undo restores it. Extract selected sets one structure aside. Return separation to 0% to compare original source positions. The source surfaces are retained whole: proximity does not prove a joined lumen or exact duct junction. Epididymides, ejaculatory ducts, spermatic-cord coverings and nerves are not included. This is an anatomical reference view, not an operative approach or registered scan. Clinical review is pending.',
  landmarks: ['deferent duct$', 'seminal vesicle$', 'prostate$', 'urinary bladder$'],
};
export const deferentDuctReferences = ['https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html'];
