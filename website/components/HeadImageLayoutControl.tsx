'use client';

export type HeadImageLayout = 'axial' | 'coronal' | 'sagittal' | 'multiplanar' | '3d';

const layouts: ReadonlyArray<{value: HeadImageLayout; label: string}> = [
  {value: 'axial', label: 'Axial'},
  {value: 'coronal', label: 'Coronal'},
  {value: 'sagittal', label: 'Sagittal'},
  {value: 'multiplanar', label: 'Multiplanar'},
  {value: '3d', label: '3D scan view'},
];

/** Scan layouts only; reference-Atlas comparison has its own separate action. */
export function HeadImageLayoutControl({layout, practice, onChange}: {
  layout: HeadImageLayout;
  practice: boolean;
  onChange: (layout: HeadImageLayout) => void;
}) {
  const unavailable = (value: HeadImageLayout) => practice && (value === '3d' || value === 'multiplanar');
  return <div className="head-view-options">
    <label className="head-layout-label">View
      <select className="head-layout-select" aria-label="Image layout" value={layout} onChange={event => {
        const next = layouts.find(item => item.value === event.currentTarget.value);
        if (next && next.value !== layout && !unavailable(next.value)) onChange(next.value);
      }}>
        {layouts.map(item => <option key={item.value} value={item.value} disabled={unavailable(item.value)}>{item.label}</option>)}
      </select>
    </label>
  </div>;
}
