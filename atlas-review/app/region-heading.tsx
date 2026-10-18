/** Compact panel metadata leaves the drawing area to the anatomy, not repeated copy. */
export function RegionHeading({title,description,count,compact=false}:{title:string;description:string;count:number;compact?:boolean}) {
  if(!compact)return <div className="body-heading"><div>
    <div className="eyebrow">REFERENCE ANATOMY · REVIEW PENDING</div>
    <h1>{title}</h1><p>{description}</p>
  </div><span className="body-count">{count}<small>structures</small></span></div>;
  return <div className="body-heading region-heading-compact">
    <h1>{title}</h1>
    <span className="body-count">{count}<small>structures</small></span>
    <details className="region-heading-context">
      <summary>Reference anatomy · review pending</summary>
      <p>{description}</p>
    </details>
  </div>;
}
