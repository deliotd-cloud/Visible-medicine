import type { NestedImagingTopic, NestedSection } from './nested-teaching';

export const hepaticTeachingReferences = {
  hepaticBiliaryCT: {
    title: 'ACR / RSNA · Gallstones: imaging evaluation',
    url: 'https://www.radiologyinfo.org/en/info/gallstones',
  },
  hepaticArterialComplications: {
    title:
      'Iida et al. · Arterial complications after living-donor liver transplantation (2014)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/24974916/',
  },
  hepaticPortalPressure: {
    title: 'NIDDK · Cirrhosis: definition and complications',
    url: 'https://www.niddk.nih.gov/health-information/liver-disease/cirrhosis/definition-facts',
  },
  hepaticPSC: {
    title:
      'NIDDK · Primary sclerosing cholangitis: definition and complications',
    url: 'https://www.niddk.nih.gov/health-information/liver-disease/primary-sclerosing-cholangitis/definition-facts',
  },
  hepaticMRCP: {
    title: 'NIDDK · Diagnosing primary sclerosing cholangitis',
    url: 'https://www.niddk.nih.gov/health-information/liver-disease/primary-sclerosing-cholangitis/diagnosis',
  },
  hepaticOutflow: {
    title:
      'Northup et al. / AASLD · Vascular liver disorders, 2020 practice guidance',
    url: 'https://aasldpubs.onlinelibrary.wiley.com/doi/10.1002/hep.31646',
  },
  hepaticDoppler: {
    title:
      'AIUM / ACR / SPR / SRU · Abdominal ultrasound practice parameter (2017), pp. 5–6',
    url: 'https://www.aium.org/docs/default-source/resources/guidelines/abdominal.pdf?sfvrsn=2cdd07d_1',
  },
};

type BranchTeaching = {
  clinical: NestedSection;
  pathology: NestedSection;
  imaging: Partial<Record<NestedImagingTopic, NestedSection>>;
};
const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
  readiness: 'draft',
});

// These concepts apply to their explicit source groups, not to a validated
// Couinaud territory, transplant anastomosis, or patient-specific vascular map.
export const hepaticTeaching = {
  arterial: {
    clinical: draft(
      'Arterial anatomy matters in liver transplantation, where reconstruction of the hepatic artery is technically demanding. A living-donor series documented clinically important arterial complications. Use this branch group for orientation, not to plan an anastomosis: no transplanted anatomy or individual perfusion territory is represented.',
      'hepaticArterialComplications',
    ),
    pathology: draft(
      'After living-donor liver transplantation, reported arterial complications include thrombosis, narrowing at an anastomosis, bleeding and aneurysm rupture. Biliary complications may coexist. These are examples from a specific clinical setting, not findings in this model or risk estimates for an individual learner or patient.',
      'hepaticArterialComplications',
    ),
    imaging: {
      ultrasound: draft(
        'A liver vascular ultrasound can examine intrahepatic arteries with Doppler to document flow characteristics and direction. Identify this arterial branch group separately from portal veins and ducts. Atlas colours identify structures; they are not Doppler signals, waveforms or proof of patency.',
        'hepaticDoppler',
      ),
    },
  },
  portal: {
    clinical: draft(
      'Portal hypertension concerns pressure in the venous system bringing blood into the liver. In cirrhosis, scarring impedes passage through liver tissue. Relate these portal branches to that inflow route, while remembering that the displayed branch shape cannot measure pressure or establish its cause.',
      'hepaticPortalPressure',
    ),
    pathology: draft(
      'Cirrhosis can lead to portal hypertension with ascites and enlarged collateral veins called varices, which may bleed. The problem is not simply a visibly enlarged intrahepatic branch. This model contains no cirrhotic tissue, pressure measurement or complete collateral circulation from which to diagnose those complications.',
      'hepaticPortalPressure',
    ),
    imaging: {
      ultrasound: draft(
        'Ultrasound assessment follows the main portal vein and, where visible, its right and left branches. Doppler documents flow direction as well as flow characteristics. Compare branch identity here; the static surfaces cannot demonstrate a flow reversal, thrombosis or portal-pressure measurement.',
        'hepaticDoppler',
      ),
    },
  },
  biliary: {
    clinical: draft(
      'Bile-duct narrowing can obstruct drainage and allow bile to accumulate within the liver. Primary sclerosing cholangitis is one clinical example involving ducts both inside and outside the liver. The separate right and left groups help explain drainage anatomy, but do not establish an obstruction level.',
      'hepaticPSC',
    ),
    pathology: draft(
      'In primary sclerosing cholangitis, inflammation and scarring can narrow or block bile ducts and progressively damage the liver. Bile-duct infection and cancer are recognised complications. A visible source duct is not evidence for or against this disease; no strictures, infection or tumour are modelled.',
      'hepaticPSC',
    ),
    imaging: {
      ct: draft(
        'CT can assess the gallbladder and bile ducts for signs of inflammation or obstructed bile flow. These right and left intrahepatic source groups provide orientation, not a complete examination of that drainage route. They contain no stone, tumour, measured duct dilatation or validated connection to the extrahepatic ducts; apparent gaps are not CT evidence of obstruction.',
        'hepaticBiliaryCT',
      ),
      mri: draft(
        'MRCP uses MRI to depict bile ducts and is commonly used when investigating primary sclerosing cholangitis. Compare right and left ductal branching as an orientation exercise. MRCP is distinct from ERCP, which combines endoscopy and X-rays and can also treat a narrowed duct. No cholangiogram is supplied here.',
        'hepaticMRCP',
      ),
      ultrasound: draft(
        'Views containing the portal branches help orient assessment of intrahepatic ducts. Doppler helps distinguish blood vessels from ducts; the examination also assesses duct dilatation, walls and intraluminal findings. The coloured source branches do not supply those ultrasound appearances or a measured duct calibre.',
        'hepaticDoppler',
      ),
    },
  },
  'venous-tributary': {
    clinical: draft(
      'Suspected hepatic venous outflow obstruction calls for assessment beyond a single tributary, including the hepatic veins and caval junction. Clinical presentations vary. This selected source group is only part of middle-hepatic drainage, not a complete outflow examination.',
      'hepaticOutflow',
    ),
    pathology: draft(
      'Budd–Chiari syndrome involves blocked hepatic venous drainage, excluding obstruction caused within the heart or pericardium. Primary disease may involve a thrombus or venous web. It is distinct from portal inflow obstruction; this tributary has no pathological overlay.',
      'hepaticOutflow',
    ),
    imaging: {
      ct: draft(
        'Contrast-enhanced CT can help confirm hepatic venous outflow obstruction and assess the wider liver. Identify the draining veins and cava, not just portal inflow. This isolated tributary is not a contrast phase, enhancement pattern or complete venous map.',
        'hepaticOutflow',
      ),
      mri: draft(
        'MRI can help confirm suspected hepatic venous outflow obstruction and evaluate associated liver changes. Follow drainage beyond the selected tributary when studying an approved examination. The atlas provides neither contrast-enhancement data nor a registered MRI volume.',
        'hepaticOutflow',
      ),
      ultrasound: draft(
        'Hepatic veins and the intrahepatic cava form part of a liver vascular ultrasound examination. Doppler adds flow information to structural views. This small named tributary helps orient drainage anatomy but cannot stand in for assessment of all hepatic veins and their flow.',
        'hepaticDoppler',
      ),
    },
  },
} satisfies Record<string, BranchTeaching>;
