// Original source-backed clinical teaching draft; no scan or publication media imported.
export const longBoneImagingGroups = {
  femur: ['FMA24475', 'FMA24474'],
  tibia: ['FMA24478', 'FMA24477'],
  humerus: ['FMA23130', 'FMA23131'],
  radius: ['FMA23464', 'FMA23465'],
  ulna: ['FMA23467', 'FMA23468'],
  fibula: ['FMA24480', 'FMA24481'],
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
  },
  "humerus": {
    "ct": {
      "body": "Trace the selected humerus from its head and tubercles at the shoulder, along the shaft, to the capitulum and trochlea at the elbow. In an acquired CT, establish the patient side, field of view and section plane before comparing a region with the atlas.",
      "bullets": [
        "Proximal task: when a shoulder CT includes the region, distinguish the head, neck and tubercles and inspect any visible fracture relationship to the joint on the acquired images. Do not infer that this study includes the entire shaft or elbow.",
        "Shaft task: follow the acquired bone segment and use the posterior radial groove as an anatomical landmark when it is identifiable. The groove does not display the radial nerve, vascular course or injury.",
        "Distal task: on an elbow CT that includes these levels, orient the lateral capitulum toward the radial head and the medial trochlea toward the ulna; use the posterior olecranon fossa to check surface orientation. A shoulder CT cannot establish a distal elbow finding.",
        "Model limit: this is an unvalidated whole-bone surface. It cannot show patient fracture lines, joint-surface steps, internal trabeculae, CT attenuation or a measured alignment."
      ],
      "citations": [
        "https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html",
        "https://www.radiologyinfo.org/en/info/bodyct",
        "https://acsearch.acr.org/docs/69433/Narrative",
        "https://acsearch.acr.org/docs/3195154/Narrative/"
      ]
    },
    "mri": {
      "body": "Use the atlas humerus to locate proximal, shaft and distal regions, then read only the regions actually covered by the acquired MR series. Confirm side, plane, sequence and field of view before making any comparison.",
      "bullets": [
        "Proximal task: on a shoulder MRI that includes the humeral head and tubercles, locate the cuff insertion region and assess any tissue question on the acquired images. A shoulder field of view does not establish a shaft or elbow finding.",
        "Shaft task: if an arm MRI includes the diaphysis, follow the imaged segment and inspect marrow and adjacent soft tissues on their actual sequences. The radial groove is a bony orientation cue, not a rendered nerve or MR signal.",
        "Distal task: if an elbow MRI includes the distal humerus, relate capitulum to radial head and trochlea to ulna, then use the acquired series for a specific marrow, tendon or ligament question. An elbow field of view does not establish proximal findings.",
        "Model limit: atlas colour, cutaway and smooth surface do not represent marrow signal, occult injury, cartilage, tendon or ligament integrity."
      ],
      "citations": [
        "https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html",
        "https://www.radiologyinfo.org/en/info/muscmr",
        "https://acsearch.acr.org/docs/69433/Narrative",
        "https://acsearch.acr.org/docs/3195154/Narrative/"
      ]
    }
  },
  "radius": {
    "ct": {
      "body": "Trace the selected radius from its head and neck at the elbow, along the interosseous border of the shaft, to the broad distal end and lateral radial styloid at the wrist. Compare only levels present in the acquired CT after confirming patient side, plane and field of view.",
      "bullets": [
        "Proximal elbow task: if the CT includes the radial head, follow it beside the capitulum and the radial notch of the ulna; inspect any suspected fracture morphology on source sections and reformations. A wrist CT does not establish an elbow finding.",
        "Shaft task: on a forearm CT that actually covers the diaphysis, follow the radius beside the ulna and assess the visible cortex and alignment on the acquired images. The interosseous border is an orientation cue; the atlas cannot establish membrane injury.",
        "Distal wrist task: identify the radial styloid and the ulnar notch beside the distal ulnar head, then inspect any articular extension or distal radioulnar relationship on the acquired CT. An elbow CT does not establish wrist congruence.",
        "Model limit: a whole-bone surface cannot show a patient fracture, articular step, radial height or tilt; do not use separation or a 3D reconstruction alone as a measurement."
      ],
      "citations": [
        "https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html",
        "https://acsearch.acr.org/docs/3195154/Narrative/",
        "https://acsearch.acr.org/docs/69418/Narrative/",
        "https://acsearch.acr.org/docs/69427/Narrative/",
        "https://www.radiologyinfo.org/en/info/bodyct",
        "https://www.orthoinfo.org/diseases--conditions/distal-radius-fractures-broken-wrist/"
      ]
    },
    "mri": {
      "body": "Use the selected whole radius to orient the acquired MR field, from proximal radial head to shaft and distal radius. Confirm patient side, sequence, plane and covered levels; a wrist, elbow or forearm study answers only questions within its actual field.",
      "bullets": [
        "Proximal elbow task: if an elbow MRI includes the radial head and proximal radioulnar joint, use the acquired sequences to assess the stated marrow, cartilage or supporting soft-tissue question. The atlas head supplies location, not MR signal.",
        "Shaft task: if a dedicated forearm MRI includes the radial diaphysis, follow the imaged segment beside the ulna and inspect marrow and neighbouring soft tissues on the acquired sequences; do not infer that either joint was imaged.",
        "Distal wrist task: if the wrist MRI includes the distal radius, locate its styloid and ulnar notch beside the ulnar head, then inspect the clinically relevant marrow, ligament or tendon question in the acquired series. A wrist MRI does not establish the radial head.",
        "Model limit: highlight colour and separation cannot depict marrow oedema, fracture, cartilage, tendon, ligament or interosseous membrane integrity."
      ],
      "citations": [
        "https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html",
        "https://acsearch.acr.org/docs/3195154/Narrative/",
        "https://acsearch.acr.org/docs/69418/Narrative/",
        "https://acsearch.acr.org/docs/69427/Narrative/",
        "https://www.radiologyinfo.org/en/info/muscmr"
      ]
    }
  },
  "ulna": {
    "ct": {
      "body": "Trace the selected ulna from the olecranon and coronoid around the proximal trochlear notch, along its shaft, to the small distal head and styloid. Establish patient side, plane and field of view before comparing the atlas with acquired CT.",
      "bullets": [
        "Proximal elbow task: when included, orient the olecranon posteriorly and coronoid anteriorly around the humeral trochlea; inspect any suspected fracture fragments and ulnohumeral relationship on source sections and reformations. Wrist CT cannot establish the elbow.",
        "Shaft task: on CT that includes the forearm diaphysis, trace the ulna beside the radius and inspect the visible cortex and alignment in the acquired planes. A joint-only study cannot establish the whole shaft.",
        "Distal wrist task: when included, locate the ulnar head against the radial ulnar notch and the ulnar styloid; inspect the acquired distal radioulnar relationship, not the spacing between separated atlas meshes. Elbow CT cannot establish wrist alignment.",
        "Model limit: atlas cutaway shows no internal bone data, patient fracture fragments, measured gap or implant trajectory."
      ],
      "citations": [
        "https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html",
        "https://acsearch.acr.org/docs/3195154/Narrative/",
        "https://acsearch.acr.org/docs/69427/Narrative/",
        "https://www.radiologyinfo.org/en/info/bodyct"
      ]
    },
    "mri": {
      "body": "Use the ulna to orient the actual elbow, forearm or wrist MR field, then inspect only the anatomy that the acquired sequences include. Confirm side, plane and sequence before using its proximal notch, shaft or distal head as landmarks.",
      "bullets": [
        "Proximal elbow task: if included, distinguish posterior olecranon from anterior coronoid around the trochlear notch, then examine the specified marrow, tendon or ligament question on the acquired MRI. A wrist MRI does not cover that elbow question.",
        "Shaft task: if a forearm MRI includes the ulnar diaphysis, follow its imaged length beside the radius and inspect marrow and adjacent soft tissues on the actual series. Do not extend a short field of view to an unseen joint.",
        "Distal wrist task: if included, relate the ulnar head and styloid to the distal radius and use the acquired wrist MRI for a clinically specified triangular fibrocartilage or ligament question. An elbow MRI cannot establish that distal tissue finding.",
        "Model limit: the whole-bone surface has no MR marrow signal or validated triangular fibrocartilage, tendon or ligament segmentation."
      ],
      "citations": [
        "https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html",
        "https://acsearch.acr.org/docs/3195154/Narrative/",
        "https://acsearch.acr.org/docs/69418/Narrative/",
        "https://acsearch.acr.org/docs/69427/Narrative/",
        "https://www.radiologyinfo.org/en/info/muscmr"
      ]
    }
  },
  "fibula": {
    "ct": {
      "body": "Trace the selected fibula from its head beside the proximal tibia, down the slender lateral shaft, to the lateral malleolus beside the talus. Check side, plane and actual CT field before moving between knee, leg and ankle.",
      "bullets": [
        "Proximal task: if a knee CT includes the fibular head and proximal tibiofibular region, locate them beside the lateral tibial condyle and inspect any visible bone injury on acquired sections. An ankle CT does not establish this region.",
        "Shaft task: on an acquired leg CT that covers it, follow the fibular cortex beside the tibia through the imaged diaphysis and localise any visible fracture level. A short knee or ankle study does not establish the whole shaft.",
        "Distal task: on ankle CT, distinguish the fibular lateral malleolus from the tibial medial and posterior malleoli; inspect acquired sections for fracture extent and the distal tibiofibular and talar relationships. A 3D reconstruction is an adjunct to the source images.",
        "Model limit: the unvalidated intact surface provides no patient fragments, displacement, syndesmotic measurement or joint congruence; set separation to zero for anatomical comparison."
      ],
      "citations": [
        "https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html",
        "https://anatomy.ttuhscep.edu/schemes/leg_tables.html",
        "https://acsearch.acr.org/docs/69436/Narrative/",
        "https://acsearch.acr.org/docs/69419/Narrative/",
        "https://www.radiologyinfo.org/en/info/bodyct",
        "https://www.orthoinfo.org/diseases--conditions/ankle-fractures-broken-ankle/"
      ]
    },
    "mri": {
      "body": "Use the fibula as a bony route from proximal head and neck, along the shaft, to the lateral malleolus. Read the actual knee, leg or ankle MR series only at covered levels and confirm side, plane and sequence.",
      "bullets": [
        "Proximal task: if knee MRI covers the fibular head and adjacent lateral knee, locate the proximal tibiofibular region and inspect the specified marrow or neighbouring soft-tissue question on the acquired images. An ankle MRI cannot establish it.",
        "Shaft task: if a leg MRI includes the fibular diaphysis, follow the imaged segment and assess marrow and neighbouring soft tissues on acquired sequences. Do not infer an unscanned proximal or distal end.",
        "Distal task: on ankle MRI that includes the malleolus, distinguish the fibular lateral side from the tibial medial and posterior malleoli, then inspect the acquired sequences for a specified syndesmotic or lateral-ligament question. The whole-bone highlight cannot establish ligament integrity.",
        "Model limit: no marrow signal, ligament segmentation, patient fracture or measured syndesmotic spacing is encoded by the surface; set separation to zero for anatomical comparison."
      ],
      "citations": [
        "https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html",
        "https://anatomy.ttuhscep.edu/schemes/leg_tables.html",
        "https://acsearch.acr.org/docs/69436/Narrative/",
        "https://acsearch.acr.org/docs/69419/Narrative/",
        "https://www.radiologyinfo.org/en/info/muscmr",
        "https://www.orthoinfo.org/diseases--conditions/ankle-fractures-broken-ankle/"
      ]
    }
  }
} as const;

export const longBoneImagingNote = 'Educational draft; revision-bound radiologist review pending. Structure comparison does not establish registration to patient images.';
