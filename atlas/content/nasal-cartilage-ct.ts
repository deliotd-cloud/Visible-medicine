// Original source-bound educational synthesis; no paper text, figures or data are imported.
export const nasalCartilageCtGroups = {
  septal: ["FMA59503"],
  alar: ["FMA59505", "FMA59506"],
  lateral: ["FMA59512", "FMA59513"],
} as const;

export const nasalCartilageCtTopics = {
  septal: {
    body: "In one excised human nasal specimen, the investigators could distinguish sampled septal cartilage from adjacent tissue on several tested clinical CT acquisitions. This selected-section finding does not establish a complete boundary on an individual patient scan.",
    bullets: [
      "The specimen was examined with ex-vivo micro-CT and several clinical CT acquisitions, then compared with three selected gross-pathology sections. Micro-CT is a different research method, not routine patient CT.",
      "Separation of sampled septal tissue from its boundary does not validate the full extent or edge of this recovered Atlas surface, including its junction with upper lateral cartilage.",
      "The model colour and shape are source display properties, not CT attenuation, an acquired contour or a registered patient image.",
    ],
    citations: ["https://pmc.ncbi.nlm.nih.gov/articles/PMC6537836/"],
  },
  alar: {
    body: "In one excised human nasal specimen, lower lateral (major alar) cartilage could be delineated in selected micro-CT sections. Across the tested clinical CT acquisitions, its measured density overlapped adjacent boundary tissue.",
    bullets: [
      "Micro-CT was performed ex vivo and compared with selected gross-pathology sections; its delineation does not establish routine patient CT visibility.",
      "The source-labelled side identifies this existing Atlas record. The study did not validate independent right or left clinical CT contours or this complete recovered surface.",
      "Do not read the model edge, colour or smoothness as an acquired CT boundary, tissue diagnosis or patient-space registration.",
    ],
    citations: ["https://pmc.ncbi.nlm.nih.gov/articles/PMC6537836/"],
  },
  lateral: {
    body: "In one excised human nasal specimen, upper lateral cartilage could be delineated in selected micro-CT sections. Across the tested clinical CT acquisitions, its measured density overlapped adjacent boundary tissue.",
    bullets: [
      "Micro-CT was performed ex vivo and compared with selected gross-pathology sections; its delineation does not establish routine patient CT visibility.",
      "The source-labelled side identifies this existing Atlas record. The study did not validate independent right or left clinical CT contours or this complete recovered surface.",
      "Do not treat the model edge next to septal cartilage as a CT-resolved interface, an acquired contour or patient-space registration.",
    ],
    citations: ["https://pmc.ncbi.nlm.nih.gov/articles/PMC6537836/"],
  },
} as const;

export const nasalCartilageCtNote = "Original source-bound educational draft; revision-bound radiologist review pending. Recovered CC-BY-4.0 surfaces have unvalidated boundaries. No scan, mask, patient example, tissue diagnosis, acquisition instruction or patient-space registration is supplied or implied. Atlas, imaging-case and paid-lecture access remain independent.";
