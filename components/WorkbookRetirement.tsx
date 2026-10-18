"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  WORKBOOK_RETIREMENT_ACTION,
  parseWorkbookRetirementReceipt,
  parseWorkbookRetirementRequest,
  workbookRetirementId,
  type WorkbookRetirementDisposition,
  type WorkbookRetirementReceipt,
} from "../lib/workbook-retirement-contract.ts";
import "./workbook-retirement.css";

type Props = {
  id: string;
  title: string;
  version: number;
  disabled?: boolean;
  onRetired?: (receipt: WorkbookRetirementReceipt) => void;
};

type FormState = {
  identity: string;
  disposition: WorkbookRetirementDisposition;
  reason: string;
  confirmed: boolean;
  busy: boolean;
  error: string;
  success: string;
};

function initial(identity: string): FormState {
  return { identity, disposition: "archived", reason: "", confirmed: false, busy: false, error: "", success: "" };
}

export function WorkbookRetirement({ id, title, version, disabled = false, onRetired }: Props) {
  const router = useRouter();
  const identity = JSON.stringify([id, title, version, disabled]);
  const epoch = useRef(0);
  const context = useRef(identity);
  const live = useRef(true);
  const flight = useRef(false);
  if (context.current !== identity) {
    context.current = identity;
    epoch.current++;
    flight.current = false;
  }
  const stateKey = `${identity}:${epoch.current}`;
  const [stored, setStored] = useState<FormState>(() => initial(stateKey));
  const form = stored.identity === stateKey ? stored : initial(stateKey);
  const validProps = workbookRetirementId(id) && typeof title === "string" && !!title.trim() &&
    Number.isSafeInteger(version) && version > 0;
  const unavailable = disabled || !validProps || form.busy || !!form.success;

  useEffect(() => {
    live.current = true;
    return () => { live.current = false; epoch.current++; flight.current = false; };
  }, []);

  function current(ticket: number) {
    return live.current && epoch.current === ticket && context.current === identity;
  }
  function change(update: Partial<FormState>) {
    if (context.current !== identity || !live.current || flight.current) return;
    setStored(previous => ({ ...(previous.identity === stateKey ? previous : initial(stateKey)), ...update,
      error: "", success: "" }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!live.current || context.current !== identity || flight.current || unavailable) return;
    const request = parseWorkbookRetirementRequest({
      action: WORKBOOK_RETIREMENT_ACTION, id, expectedVersion: version,
      expectedStatus: "published", disposition: form.disposition,
      reason: form.reason, confirmed: form.confirmed,
    }, id);
    if (!request) {
      setStored({ ...form, error: "Enter a reason of 1–1000 characters and confirm this action." });
      return;
    }
    const ticket = epoch.current;
    flight.current = true;
    setStored({ ...form, busy: true, error: "", success: "" });
    try {
      const response = await fetch(`/api/studio/workbooks/${encodeURIComponent(id)}/retirement`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
      });
      let body: unknown;
      try { body = await response.json(); } catch { body = null; }
      if (!current(ticket)) return;
      const receipt = response.ok ? parseWorkbookRetirementReceipt(body, request) : null;
      if (!receipt) {
        const message = !response.ok && body && typeof body === "object" &&
          "error" in body && typeof body.error === "string" && body.error.length <= 500 ? body.error : "Retirement was not confirmed.";
        setStored({ ...form, busy: false, error: `${message} Check the current workbook status before trying again.` });
        return;
      }
      setStored({ ...form, busy: false, success: `Workbook ${receipt.disposition === "archived" ? "archived" : "withdrawn"}.` });
      try { onRetired?.(receipt); } catch { /* The server acknowledgement remains authoritative. */ }
      router.refresh();
    } catch {
      if (current(ticket)) setStored({ ...form, busy: false,
        error: "Retirement was not confirmed. Check the current workbook status before trying again." });
    } finally {
      if (current(ticket)) flight.current = false;
    }
  }

  return <details className="workbook-retirement">
    <summary>Archive or withdraw</summary>
    <p>Retire this published workbook version. This requires a recorded reason and an exact server acknowledgement.</p>
    <form onSubmit={submit} noValidate>
      <fieldset disabled={unavailable}>
        <legend>Retire {title}</legend>
        <label htmlFor={`retirement-disposition-${id}`}>Disposition</label>
        <select id={`retirement-disposition-${id}`} value={form.disposition}
          onChange={event => change({ disposition: event.currentTarget.value as WorkbookRetirementDisposition, confirmed: false })}>
          <option value="archived">Archive</option>
          <option value="withdrawn">Withdraw</option>
        </select>
        <p className="workbook-retirement-impact">{form.disposition === "withdrawn"
          ? "Withdrawal stops active access and live sessions, voids unsubmitted open attempts, and preserves submitted work, marks, and published manifests."
          : "Archiving revokes active allocations and closes polls while preserving submitted work, marks, and published manifests. End live teaching and open attempts first."}</p>
        <p className="workbook-retirement-impact">Remove this workbook from active prerequisite rules before either action.</p>
        <label htmlFor={`retirement-reason-${id}`}>Reason</label>
        <textarea id={`retirement-reason-${id}`} value={form.reason} maxLength={1000} required rows={3}
          aria-describedby={`retirement-reason-help-${id}`}
          onChange={event => change({ reason: event.currentTarget.value })} />
        <small id={`retirement-reason-help-${id}`}>Required, up to 1000 characters. Do not include patient or other personal identifiers.</small>
        <label className="workbook-retirement-confirm">
          <input type="checkbox" checked={form.confirmed} required
            onChange={event => change({ confirmed: event.currentTarget.checked })} />
          I confirm this {form.disposition === "withdrawn" ? "withdrawal and its effect on active access and open attempts" : "archive"}.
        </label>
        <button type="submit">{form.busy ? "Recording…" : form.disposition === "withdrawn" ? "Withdraw workbook" : "Archive workbook"}</button>
      </fieldset>
      {form.error && <p role="alert" className="workbook-retirement-error">{form.error}</p>}
      {form.success && <p role="status" className="workbook-retirement-success">{form.success}</p>}
    </form>
  </details>;
}
