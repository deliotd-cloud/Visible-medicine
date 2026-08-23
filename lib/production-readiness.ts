export type ProductionCapabilities = {
  courseOidcAdapter: boolean;
  realDicomAdapter: boolean;
  realWsiAdapter: boolean;
  independentDeidentificationValidated: boolean;
  runtimeSchemaMutationDisabled: boolean;
  productionDemoCatalogDisabled: boolean;
};

export const CURRENT_PRODUCTION_CAPABILITIES: ProductionCapabilities = {
  courseOidcAdapter: false,
  realDicomAdapter: false,
  realWsiAdapter: false,
  independentDeidentificationValidated: false,
  runtimeSchemaMutationDisabled: false,
  productionDemoCatalogDisabled: false,
};

type ProductionReadinessConfiguration = {
  oidcIssuer?: string;
  oidcAudience?: string;
  oidcClientId?: string;
  oidcJwksUrl?: string;
  dicomAdapterVersion?: string;
  wsiAdapterVersion?: string;
  deidentificationAssuranceId?: string;
  viewerCoreDigest?: string;
};

function isHttpsUrl(value: string | undefined) {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function evidence(value: string | undefined) {
  return Boolean(value?.trim() && !/^(todo|tbc|placeholder)$/i.test(value.trim()));
}

export function evaluateProductionReadiness(
  configuration: ProductionReadinessConfiguration,
  capabilities = CURRENT_PRODUCTION_CAPABILITIES,
) {
  const gates = [
    {
      id: "course-oidc",
      label: "Separate course-site OIDC adapter and registration",
      passed:
        capabilities.courseOidcAdapter &&
        isHttpsUrl(configuration.oidcIssuer) &&
        isHttpsUrl(configuration.oidcJwksUrl) &&
        evidence(configuration.oidcAudience) &&
        evidence(configuration.oidcClientId),
    },
    {
      id: "real-dicom",
      label: "Validated production DICOM adapter",
      passed:
        capabilities.realDicomAdapter &&
        evidence(configuration.dicomAdapterVersion),
    },
    {
      id: "real-wsi",
      label: "Validated production WSI adapter",
      passed:
        capabilities.realWsiAdapter && evidence(configuration.wsiAdapterVersion),
    },
    {
      id: "deidentification",
      label: "Independent de-identification assurance",
      passed:
        capabilities.independentDeidentificationValidated &&
        evidence(configuration.deidentificationAssuranceId),
    },
    {
      id: "viewer-core",
      label: "Pinned Education viewer-core release digest",
      passed: evidence(configuration.viewerCoreDigest),
    },
    {
      id: "runtime-database-change",
      label: "Request-time schema mutation disabled",
      passed: capabilities.runtimeSchemaMutationDisabled,
    },
    {
      id: "production-demo-data",
      label: "Synthetic catalog and demonstration identities disabled",
      passed: capabilities.productionDemoCatalogDisabled,
    },
  ];
  return {
    ready: gates.every((gate) => gate.passed),
    gates,
    blockers: gates.filter((gate) => !gate.passed).map((gate) => gate.id),
  };
}
