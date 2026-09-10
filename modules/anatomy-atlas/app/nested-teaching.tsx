'use client';
import type { BodyStructure } from './body-types';
import type { NestedStudy } from '@/lib/nested-anatomy';
import {
  nestedTeachingFor,
  nestedTopicLesson,
  nestedTeachingReferences,
} from '@/lib/nested-teaching';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import './nested-teaching.css';

// Match the main atlas's three information groups without importing its whole
// workspace/search/practice graph into these lazy-loaded child viewers.
const groups = [
  {
    id: 'anatomy',
    label: 'Anatomy',
    sections: [
      ['anatomy', 'Overview'],
      ['function', 'Function'],
    ],
  },
  {
    id: 'clinical',
    label: 'Clinical',
    sections: [
      ['clinical', 'Context'],
      ['pathology', 'Pathology'],
    ],
  },
  {
    id: 'imaging',
    label: 'Imaging',
    sections: [
      ['ct', 'CT'],
      ['mri', 'MRI'],
      ['ultrasound', 'Ultrasound'],
    ],
  },
] as const;

function References({ ids }: { ids: string[] }) {
  return ids.length > 0 ? (
    <ul className="nested-teaching-references" aria-label="Teaching references">
      {ids.map((id) => (
        <li key={id}>
          <a
            href={nestedTeachingReferences[id].url}
            target="_blank"
            rel="noreferrer"
          >
            {nestedTeachingReferences[id].title}
          </a>
        </li>
      ))}
    </ul>
  ) : null;
}

export function NestedTeaching({
  parent,
  study,
  selected,
}: {
  parent: BodyStructure;
  study: NestedStudy;
  selected: BodyStructure;
}) {
  const concept = nestedTeachingFor(parent, study, selected);
  if (!concept)
    return (
      <p className="nested-teaching-unavailable">
        Teaching is unavailable for this source binding. No alternative
        structure has been substituted.
      </p>
    );
  return (
    <details className="nested-teaching">
      <summary>Learn more · anatomy, clinical &amp; quiz</summary>
      <p className="nested-teaching-status">
        Teaching draft · specialist review pending. Educational use, not
        diagnosis or treatment.
      </p>
      <Tabs defaultValue="anatomy" className="nested-teaching-tabs">
        <TabsList aria-label="Nested structure information" variant="line">
          {groups.map((group) => (
            <TabsTrigger key={group.id} value={group.id}>
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {groups.map((group) => (
          <TabsContent key={group.id} value={group.id}>
            <Tabs defaultValue={group.sections[0][0]}>
              <TabsList aria-label={`${group.label} topics`}>
                {group.sections.map(([tab, label]) => (
                  <TabsTrigger key={tab} value={tab}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {group.sections.map(([tab]) => {
                const lesson = nestedTopicLesson(concept, tab);
                const refs =
                  tab === 'anatomy' ||
                  tab === 'function' ||
                  tab === 'clinical' ||
                  tab === 'pathology'
                    ? concept.sections[tab].references
                    : (concept.imaging?.[tab]?.references ?? []);
                return (
                  <TabsContent key={tab} value={tab}>
                    <section
                      className="nested-teaching-section"
                      aria-label={lesson.title}
                    >
                      <h4>{lesson.title}</h4>
                      <p>{lesson.body}</p>
                      {lesson.note && (
                        <p className="nested-teaching-status">{lesson.note}</p>
                      )}
                      {lesson.readiness === 'pending' && (
                        <span className="nested-teaching-status">
                          Content pending
                        </span>
                      )}
                      <References ids={refs} />
                    </section>
                  </TabsContent>
                );
              })}
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
      <p className="nested-teaching-limit">
        <strong>Model scope:</strong> {concept.modelLimit}
      </p>
      <section className="nested-teaching-quiz" aria-label="Anatomy self-check">
        <h4>Self-check</h4>
        <p>{concept.quiz.question}</p>
        <details
          key={`${study}:${selected.id}`}
          className="nested-teaching-answer"
        >
          <summary>Reveal answer</summary>
          <p>{concept.quiz.answer}</p>
          {concept.quiz.basis === 'model-scope' && (
            <p className="nested-teaching-status">
              Answer basis: current source-model scope.
            </p>
          )}
          <References ids={concept.quiz.references} />
        </details>
        <p className="nested-teaching-status">
          Unscored recall practice, not an accredited exam.
        </p>
      </section>
    </details>
  );
}
