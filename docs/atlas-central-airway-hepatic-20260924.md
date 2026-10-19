# Central airway and hepatic inflow — shared Atlas source integration

The generated regional/whole-body viewer is bound to committed Atlas source
`c9000cf68cf91f899ff48e930306dfc02f371b19`. The Thorax Dissect study has
an exact-source central-airway focus: both sides retains the trachea and both
main bronchi; Left or Right retains the trachea plus that side's main bronchus.
These are exterior/proximal source surfaces, not a carina, complete lobar tree,
lumen, or patient-registered airway. The four existing hepatic arterial and
portal branch concepts now carry eight sided CT/MRI orientation draft placements.
They use original paraphrases of [ACR LI-RADS CT/MRI phase definitions](https://edge.sitecorecloud.io/americancoldf5f-acrorgf92a-productioncb02-3650/media/ACR/Files/RADS/LI-RADS/LI-RADS-CT-MRI-2018-Core.pdf),
without importing images, text passages, scan data, protocol instructions or
diagnostic conclusions. The private native-MRI import checker was not exported.

The offline upgrade plan compared the complete existing and candidate manifests,
every companion hash, all regional identities and every original model byte.
It retained 12 scopes, 135 models and 142 registered paths, with zero new model
bytes, no changed geometry and no patient data. Candidate manifest SHA-256:
`edb5264f4bba4725f8694302305a6a7819c28ac1cefe5be7c8aff25fc9c135c2`;
inventory SHA-256:
`85167c7ff6ee2742392caa4e6ea13aa620c9184d39f316f28e6bfd60ff9e2bd0`.
The previous v116 module was retained in the main coordination workspace.

The website's 175 tests (including a focused source-bound test), inventory check,
TypeScript, lint and production build passed against this candidate. Protected-delivery
verification and actual owner-private publication remain separate checks; source
integration alone does not establish either publication or clinical acceptance. The
existing `administrator-review` policy, independent Atlas/case/lecture rights,
source holds, CC BY 4.0 attribution and clinical/revision-bound sign-off gates
remain unchanged. No public learner release is authorized by this integration.
