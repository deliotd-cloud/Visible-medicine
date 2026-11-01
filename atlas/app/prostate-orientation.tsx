'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { projectProstateOrientation, type ProstateOrientationMarker } from '../lib/prostate-orientation';

type Markers = readonly ProstateOrientationMarker[] | null;
export type ProstateOrientationChannel = {
  markers: Markers;
  publish: ((markers: Markers) => void) | null;
};
type Channel = MutableRefObject<ProstateOrientationChannel>;

/** Shares camera orientation with the small overlay without rerendering the study. */
export function ProstateOrientationReporter({ channel }: { channel: Channel }) {
  const last = useRef([NaN, NaN, NaN, NaN]);
  useFrame(({ camera }) => {
    const q = camera.quaternion;
    const next = [q.x, q.y, q.z, q.w];
    if (next.every((value, index) => Math.abs(value - last.current[index]) < 1e-6)) return;
    last.current = next;
    const markers = projectProstateOrientation(q);
    channel.current.markers = markers;
    channel.current.publish?.(markers);
  });
  return null;
}

function direction(marker: ProstateOrientationMarker) {
  const vertical = marker.y < 36 ? 'up' : marker.y > 48 ? 'down' : '';
  const horizontal = marker.x < 36 ? 'left' : marker.x > 48 ? 'right' : '';
  return [vertical, horizontal].filter(Boolean).join(' and ') || 'towards the centre';
}

export function ProstateOrientationCompass({ channel, hidden = false }: {
  channel: Channel;
  hidden?: boolean;
}) {
  const [markers, setMarkers] = useState<Markers>(() => channel.current.markers);
  useEffect(() => {
    // The first camera frame can precede this DOM effect. Read that frame too.
    const receive = (value: Markers) => setMarkers(value);
    channel.current.publish = receive;
    receive(channel.current.markers);
    return () => {
      if (channel.current.publish === receive) channel.current.publish = null;
    };
  }, [channel]);
  if (hidden || !markers?.length) return null;
  const description = 'Schematic anatomical directions. ' + markers
    .map(marker => `${marker.name} points ${direction(marker)}`).join('; ') + '.';
  return <div className="prostate-zones-compass" role="img" aria-label={description}>
    <svg viewBox="0 0 84 84" aria-hidden="true" focusable="false">
      {markers.map(marker => <g key={marker.label} className={marker.depth > 0.2 ? 'is-front' : undefined}>
        <line x1="42" y1="42" x2={marker.x} y2={marker.y} />
        <circle cx={marker.x} cy={marker.y} r="8" />
        <text x={marker.x} y={marker.y} dy=".35em" textAnchor="middle">{marker.label}</text>
      </g>)}
      <circle className="prostate-zones-compass-centre" cx="42" cy="42" r="2" />
    </svg>
  </div>;
}
