import {AtlasWorkspaceNavigation} from './AtlasWorkspaceNavigation';
import {relatedJointStudies} from '../lib/atlas-related-joint-studies';
import styles from './atlas-regional-navigation.module.css';

/** Server-rendered discovery; no extra model or client bundle is loaded here. */
export function AtlasRegionalNavigation({regionId}:{regionId:string}){
  const studies=relatedJointStudies(regionId);
  return <div className={styles.navigation}>
    <AtlasWorkspaceNavigation modality="3d" regionId={regionId}/>
    {studies.length>0&&<details className={styles.studies}>
      <summary>Joint detail <span>· {studies.length} {studies.length===1?'study':'studies'}</span></summary>
      <div className={styles.content}>
        <p>Independent right-limb specimens · clinical review pending. These open in a new tab, keeping this view in place. They are not aligned to this body or a patient scan.</p>
        <ul>{studies.map(study=><li key={study.id}>
          <a href={study.href} target="_blank" rel="noopener noreferrer">{study.title} <span className={styles.newTab}>(new tab)</span></a>
          <p>{study.note}</p>
        </li>)}</ul>
      </div>
    </details>}
  </div>;
}
