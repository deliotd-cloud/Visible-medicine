'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/atlas-review/components/ui/button';
import {
  makeIndependentStudyLink,
  resolveIndependentStudyLink,
  noIndependentStudyLink,
  type IndependentStudyLink,
} from '@/atlas-review/lib/independent-study-links';
import type { SpecimenDefinition } from '@/atlas-review/lib/independent-specimen';
import type { DissectionView } from './dissection-data';
import { CopySpecimenLink } from './specimen-study-link';
import { KneeSpecimenView, type SpecimenSupplement } from './um-knee-study';
import { independentStudyDeliveryUrl } from '@/atlas-review/lib/model-delivery';

export function IndependentStudyView({
  definition,
  supplement,
  link = noIndependentStudyLink,
  assetBase = '',
}: {
  definition: SpecimenDefinition;
  supplement: SpecimenSupplement;
  link?: IndependentStudyLink;
  assetBase?: string;
}) {
  return (
    <ResolvedIndependentStudy
      key={definition.key + JSON.stringify(link)}
      definition={definition}
      supplement={supplement}
      link={link}
      assetBase={assetBase}
    />
  );
}
function ResolvedIndependentStudy({
  definition,
  supplement,
  link,
  assetBase,
}: {
  definition: SpecimenDefinition;
  supplement: SpecimenSupplement;
  link: IndependentStudyLink;
  assetBase: string;
}) {
  const [result, setResult] = useState<{
    definition: SpecimenDefinition;
    link: IndependentStudyLink;
    value: Awaited<ReturnType<typeof resolveIndependentStudyLink>>;
  } | null>(
    link.status === 'none'
      ? { definition, link, value: { status: 'none' } }
      : null,
  );
  const resolved =
    result?.definition === definition && result.link === link
      ? result.value
      : null;
  const [ignore, setIgnore] = useState(false);
  useEffect(() => {
    let current = true;
    resolveIndependentStudyLink(link, definition)
      .then((value) => {
        if (current) setResult({ definition, link, value });
      })
      .catch(() => {
        if (current)
          setResult({
            definition,
            link,
            value: {
              status: 'rejected',
              reason: 'Source verification could not be completed.',
            },
          });
      });
    return () => {
      current = false;
    };
  }, [link, definition]);
  if (!ignore && !resolved)
    return <p role="status">Checking the exact source selection…</p>;
  if (!ignore && resolved?.status === 'rejected')
    return (
      <section className="um-specimen-link-warning" role="alert">
        <h2>This study link cannot be opened</h2>
        <p>{resolved.reason} No alternative structure has been selected.</p>
        <Button variant="outline" onClick={() => setIgnore(true)}>
          Open current source view
        </Button>
      </section>
    );
  return (
    <KneeSpecimenView
      assetBase={assetBase}
      specimen={definition}
      supplement={supplement}
      initialNavigation={
        !ignore && resolved?.status === 'ready' ? resolved : undefined
      }
    />
  );
}
export function IndependentStudyLinkControl({
  definition,
  selectedId,
  studyId,
  view,
  assetBase = '',
}: {
  definition: SpecimenDefinition;
  selectedId: string;
  studyId: string | null;
  view: DissectionView;
  assetBase?: string;
}) {
  const identity = JSON.stringify([definition.key, selectedId, studyId, view, assetBase]);
  const [result, setResult] = useState<{
    identity: string;
    href: string | null;
  } | null>(null);
  useEffect(() => {
    let current = true;
    makeIndependentStudyLink(definition, { selectedId, studyId, view })
      .then((href) => {
        if (current) setResult({ identity, href: href ? independentStudyDeliveryUrl(href, assetBase) : null });
      })
      .catch(() => {
        if (current) setResult({ identity, href: null });
      });
    return () => {
      current = false;
    };
  }, [definition, selectedId, studyId, view, identity, assetBase]);
  return (
    <details className="um-knee-details">
      <summary>{assetBase ? 'Link to this structure' : 'Link & review this structure'}</summary>
      {result?.identity === identity ? (
        result.href ? (
          <CopySpecimenLink key={result.href} href={result.href} />
        ) : (
          <p>This exact source link is unavailable.</p>
        )
      ) : (
        <p role="status">Preparing source-checked link…</p>
      )}
      {!assetBase && <p>
        <a
          href={`/workspace/atlas-review/specimens?specimen=${encodeURIComponent(definition.key)}&structure=${encodeURIComponent(selectedId)}`}
          target="_blank"
          rel="noreferrer"
        >
          Review this structure
        </a>
      </p>}
      <p>
        {studyId
          ? 'Opens this selection with the chosen source study.'
          : 'Custom dissection: opens this selection with others faded.'}{' '}
        Original positions and camera direction are restored; separation and
        hidden-tissue edits are not shared. No scan registration or paid access
        is granted.
      </p>
    </details>
  );
}
