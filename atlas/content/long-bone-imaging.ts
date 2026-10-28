// Original source-backed clinical teaching draft; no scan or publication media imported.
export const longBoneImagingGroups = {
  femur: ['FMA24475', 'FMA24474'],
  tibia: ['FMA24478', 'FMA24477'],
} as const;

export const longBoneImagingTopics = {
  "femur": {
    "ct": {
      "body": "Trace the femoral head and neck past the greater and lesser trochanters, along the shaft to the distal condyles above the tibia; the patella is anterior at the knee.",
      "bullets": [
        "Proximal and shaft route: on an acquired CT that includes these levels, compare the head-neck region, trochanters and shaft in the actual planes. A knee study alone does not display the hip or whole shaft.",
        "Knee task: locate both distal condyles in the assembled atlas, then compare their cross-sectional shape and relationship to the tibia on the acquired knee series after checking patient side and orientation.",
        "CT question: where a distal femoral fracture is present, acquired CT can clarify joint-surface extension and fragments. The atlas cannot demonstrate a fracture, articular step or internal bone structure."
      ],
      "citations": [
        "https://www.orthoinfo.org/diseases--conditions/distal-femur-thighbone-fractures-of-the-knee/",
        "https://www.radiologyinfo.org/en/info/bodyct",
        "https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/proximal-femur/further-reading/intraoperative-imaging-of-the-proximal-femur",
        "https://online.ao-alliance.org/images/PDF/Clinical_Guidelines_Femoral_Shaft_Fractures_2024.pdf"
      ]
    },
    "mri": {
      "body": "Trace the femoral head and neck past the greater and lesser trochanters, along the shaft to the distal condyles above the tibia; the patella is anterior at the knee.",
      "bullets": [
        "Proximal and shaft route: if acquired MR images include these levels, inspect the head-neck region and shaft on their actual series. A knee MRI alone does not establish hip or whole-shaft findings.",
        "Knee task: distinguish the condyles beside the tibia from the anterior patellar surface; follow them through the acquired series, checking its side, plane and sequence.",
        "MRI question: acquired knee MRI can assess bone, cartilage and supporting soft tissues, including some fractures unseen on radiographs. Atlas colour and cutaway supply no marrow signal, cartilage or ligament assessment."
      ],
      "citations": [
        "https://www.orthoinfo.org/diseases--conditions/distal-femur-thighbone-fractures-of-the-knee/",
        "https://www.radiologyinfo.org/en/info/kneemr",
        "https://www.orthoinfo.org/diseases--conditions/hip-fractures/",
        "https://www.radiologyinfo.org/en/info/mri-hip",
        "https://www.radiologyinfo.org/en/info/muscmr"
      ]
    }
  },
  "tibia": {
    "ct": {
      "body": "Trace the tibial plateau beneath the femoral condyles down the shaft to the distal plafond above the talus; the medial malleolus projects at the inner ankle.",
      "bullets": [
        "Distal task: on an acquired ankle CT that includes these levels, locate the plafond and medial malleolus, then inspect any fracture lines and joint-surface involvement. A knee study alone does not show the ankle.",
        "Knee task: compare the plateau and proximal bone in the acquired CT planes after checking patient side and orientation. In a plateau fracture, distinguish split, depression and more complex articular patterns.",
        "Model limit: cutaway and bone separation do not show cancellous bone, a patient fracture, plateau depression or measured ankle congruity."
      ],
      "citations": [
        "https://www.orthoinfo.org/diseases--conditions/fractures-of-the-proximal-tibia-shinbone/",
        "https://www.radiologyinfo.org/en/info/bodyct",
        "https://www.orthoinfo.org/diseases--conditions/pilon-fractures-of-the-ankle/",
        "https://www.orthoinfo.org/diseases--conditions/ankle-fractures-broken-ankle/"
      ]
    },
    "mri": {
      "body": "Trace the tibial plateau beneath the femoral condyles down the shaft to the distal plafond above the talus; the medial malleolus projects at the inner ankle.",
      "bullets": [
        "Distal task: if acquired ankle MR images include these levels, locate the plafond and medial malleolus before examining distal bone and neighbouring soft tissues. A knee MRI alone does not establish ankle findings.",
        "Knee task: locate the plateau beneath the femur on the actual series. MRI may show an occult injury or associated meniscal, cartilage or ligament damage when clinically indicated.",
        "Model limit: the exterior mesh has no marrow signal, separate cartilage or ligament assessment; a normal-looking surface cannot exclude internal injury."
      ],
      "citations": [
        "https://www.orthoinfo.org/diseases--conditions/fractures-of-the-proximal-tibia-shinbone/",
        "https://www.radiologyinfo.org/en/info/kneemr",
        "https://www.orthoinfo.org/diseases--conditions/pilon-fractures-of-the-ankle/",
        "https://www.orthoinfo.org/diseases--conditions/ankle-fractures-broken-ankle/",
        "https://www.radiologyinfo.org/en/info/muscmr"
      ]
    }
  }
} as const;

export const longBoneImagingNote = 'Educational draft; revision-bound radiologist review pending. Structure comparison does not establish registration to patient images.';
