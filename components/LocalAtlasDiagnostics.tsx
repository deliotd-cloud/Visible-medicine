"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { installLocalAtlasDiagnostics } from "../lib/local-atlas-diagnostics";

export function LocalAtlasDiagnostics({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  useEffect(() => installLocalAtlasDiagnostics(window, enabled), [enabled, pathname]);
  return null;
}
