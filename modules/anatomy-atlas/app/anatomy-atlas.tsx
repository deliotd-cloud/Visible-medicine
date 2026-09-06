'use client';

import type { CSSProperties } from 'react';
import { structureById, type SystemKey } from './anatomy-data';

export type AtlasView = 'overview' | 'posterior' | 'anterior';

type Hotspot = {
  id: string;
  clipPath: string;
  label: { x: number; y: number; align?: 'left' | 'right' };
};

type Plate = {
  title: string;
  orientation: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  source: string;
  sourceLabel: string;
  embeddedLabels?: boolean;
  hotspots: Hotspot[];
};

const id = {
  scapula: 'vm:anatomy:upper-limb:shoulder:right:bone:scapula',
  humerus: 'vm:anatomy:upper-limb:shoulder:right:bone:humerus',
  clavicle: 'vm:anatomy:upper-limb:shoulder:right:bone:clavicle',
  deltoid: 'vm:anatomy:upper-limb:shoulder:right:muscle:deltoid',
  supraspinatus: 'vm:anatomy:upper-limb:shoulder:right:muscle:supraspinatus',
  infraspinatus: 'vm:anatomy:upper-limb:shoulder:right:muscle:infraspinatus',
  subscapularis: 'vm:anatomy:upper-limb:shoulder:right:muscle:subscapularis',
  biceps: 'vm:anatomy:upper-limb:shoulder:right:tendon:biceps-long-head',
} as const;

export const preferredAtlasView: Record<string, AtlasView> = {
  [id.scapula]: 'overview',
  [id.humerus]: 'overview',
  [id.clavicle]: 'anterior',
  [id.deltoid]: 'anterior',
  [id.supraspinatus]: 'posterior',
  [id.infraspinatus]: 'posterior',
  [id.subscapularis]: 'overview',
  [id.biceps]: 'overview',
};

export const atlasPlates: Record<AtlasView, Plate> = {
  overview: {
    title: 'Shoulder joint',
    orientation: 'Anterior cutaway',
    image: '/anatomy/niams-shoulder-joint.svg',
    width: 391,
    height: 353,
    alt: 'Medical line drawing of the shoulder joint showing the rotator cuff, clavicle, scapula, humerus and biceps tendon.',
    source: 'https://commons.wikimedia.org/wiki/File:Shoulder_joint.svg',
    sourceLabel: 'NIAMS / Angelito7 · public domain',
    embeddedLabels: true,
    hotspots: [
      { id: id.scapula, clipPath: 'polygon(54% 28%, 96% 28%, 88% 88%, 66% 94%, 56% 71%)', label: { x: 87, y: 78, align: 'right' } },
      { id: id.humerus, clipPath: 'polygon(29% 34%, 50% 31%, 55% 51%, 49% 100%, 26% 100%)', label: { x: 31, y: 78 } },
      { id: id.clavicle, clipPath: 'polygon(52% 17%, 68% 13%, 98% 20%, 99% 29%, 72% 22%, 55% 28%)', label: { x: 80, y: 15, align: 'right' } },
      { id: id.subscapularis, clipPath: 'polygon(39% 36%, 75% 37%, 67% 55%, 55% 65%, 42% 56%)', label: { x: 73, y: 47, align: 'right' } },
      { id: id.supraspinatus, clipPath: 'polygon(27% 30%, 66% 24%, 67% 36%, 32% 47%, 26% 43%)', label: { x: 30, y: 34 } },
      { id: id.biceps, clipPath: 'polygon(48% 39%, 60% 42%, 55% 100%, 44% 100%)', label: { x: 52, y: 69 } },
    ],
  },
  posterior: {
    title: 'Scapular muscles',
    orientation: 'Posterior view',
    image: '/anatomy/gray-shoulder-posterior.png',
    width: 550,
    height: 523,
    alt: 'Detailed anatomical plate of the posterior shoulder and upper arm musculature.',
    source: 'https://commons.wikimedia.org/wiki/File:Arm_shoulder_gray.png',
    sourceLabel: "Gray's Anatomy · public domain",
    hotspots: [
      { id: id.scapula, clipPath: 'polygon(54% 4%, 98% 1%, 100% 46%, 89% 58%, 57% 43%, 48% 19%)', label: { x: 90, y: 43, align: 'right' } },
      { id: id.humerus, clipPath: 'polygon(39% 5%, 57% 9%, 54% 45%, 38% 96%, 11% 100%, 28% 62%)', label: { x: 27, y: 55 } },
      { id: id.deltoid, clipPath: 'polygon(42% 3%, 67% 8%, 61% 30%, 49% 52%, 36% 32%)', label: { x: 43, y: 22 } },
      { id: id.infraspinatus, clipPath: 'polygon(50% 13%, 99% 12%, 99% 47%, 86% 56%, 58% 42%)', label: { x: 86, y: 29, align: 'right' } },
      { id: id.supraspinatus, clipPath: 'polygon(52% 1%, 99% 0%, 97% 14%, 61% 14%)', label: { x: 83, y: 6, align: 'right' } },
    ],
  },
  anterior: {
    title: 'Superficial shoulder',
    orientation: 'Anterior view',
    image: '/anatomy/gray-shoulder-anterior.png',
    width: 531,
    height: 650,
    alt: 'Detailed anatomical plate of the superficial anterior shoulder, chest and upper arm muscles.',
    source: 'https://commons.wikimedia.org/wiki/File:Arm_muscles_front_superficial.png',
    sourceLabel: "Gray's Anatomy · public domain",
    hotspots: [
      { id: id.clavicle, clipPath: 'polygon(16% 7%, 55% 7%, 68% 16%, 60% 22%, 22% 18%)', label: { x: 36, y: 12 } },
      { id: id.humerus, clipPath: 'polygon(59% 34%, 87% 30%, 100% 100%, 69% 100%, 62% 62%)', label: { x: 83, y: 74, align: 'right' } },
      { id: id.deltoid, clipPath: 'polygon(49% 10%, 77% 9%, 85% 39%, 70% 51%, 56% 36%)', label: { x: 72, y: 27, align: 'right' } },
      { id: id.biceps, clipPath: 'polygon(61% 37%, 79% 39%, 90% 100%, 69% 100%)', label: { x: 73, y: 65, align: 'right' } },
    ],
  },
};

type AnatomyAtlasProps = {
  view: AtlasView;
  selectedId: string;
  visibleSystems: Record<SystemKey, boolean>;
  isolated: boolean;
  showLabels: boolean;
  onSelect: (id: string) => void;
};

export function AnatomyAtlas({ view, selectedId, visibleSystems, isolated, showLabels, onSelect }: AnatomyAtlasProps) {
  const plate = atlasPlates[view];
  const visibleHotspots = plate.hotspots.filter((hotspot) => {
    const structure = structureById.get(hotspot.id);
    return structure ? visibleSystems[structure.system] : false;
  });
  const selectedHotspot = visibleHotspots.find((hotspot) => hotspot.id === selectedId);
  const focusActive = isolated && Boolean(selectedHotspot);

  return (
    <div className="anatomy-atlas">
      <div className="atlas-frame">
        <div className="atlas-plate-heading">
          <div><strong>{plate.title}</strong><span>{plate.orientation}</span></div>
          <span>{visibleHotspots.length} mapped structures</span>
        </div>
        <div className="atlas-stage" style={{ aspectRatio: `${plate.width} / ${plate.height}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={`atlas-image ${focusActive ? 'dimmed' : ''}`} src={plate.image} alt={plate.alt} draggable={false} />
          {focusActive && selectedHotspot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="atlas-focus-image" src={plate.image} alt="" aria-hidden="true" draggable={false} style={{ clipPath: selectedHotspot.clipPath }} />
          )}
          <div className="atlas-hotspots">
            {visibleHotspots.map((hotspot) => {
              const structure = structureById.get(hotspot.id);
              if (!structure) return null;
              const selected = selectedId === hotspot.id;
              return (
                <button
                  key={hotspot.id}
                  type="button"
                  className={`atlas-hotspot ${selected ? 'selected' : ''}`}
                  style={{ clipPath: hotspot.clipPath, '--hotspot-color': structure.color } as CSSProperties}
                  aria-label={`Select ${structure.name}`}
                  aria-pressed={selected}
                  onClick={() => onSelect(hotspot.id)}
                >
                  <span className="sr-only">{structure.name}</span>
                </button>
              );
            })}
          </div>
          {showLabels && (
            <div className="atlas-labels" aria-hidden="true">
              {visibleHotspots.filter((hotspot) => !plate.embeddedLabels || hotspot.id === selectedId).map((hotspot) => {
                const structure = structureById.get(hotspot.id);
                if (!structure) return null;
                return (
                  <span
                    key={hotspot.id}
                    className={`atlas-label ${selectedId === hotspot.id ? 'selected' : ''} ${hotspot.label.align === 'right' ? 'align-right' : ''}`}
                    style={{ left: `${hotspot.label.x}%`, top: `${hotspot.label.y}%` }}
                  >
                    {structure.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <a className="atlas-provenance" href={plate.source} target="_blank" rel="noreferrer">Illustration: {plate.sourceLabel}</a>
      </div>
    </div>
  );
}
