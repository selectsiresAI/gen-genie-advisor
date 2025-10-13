import React, { useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type TutorialStep = {
  id: string;
  tutorial_slug: string;
  slug?: string | null;
  step_order: number;
  anchor?: string | null;
  headline?: string | null;
  body?: string | null;
  next_label?: string | null;
  prev_label?: string | null;
  done_label?: string | null;
  enabled?: boolean | null;
  created_at?: string | null;
};

type GroupedSteps = Record<string, TutorialStep[]>;

const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment');
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

type Props = {
  initialTutorial?: string;
};

export default function TutorialSteps({ initialTutorial }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [activeTutorial, setActiveTutorial] = useState<string | null>(initialTutorial ?? null);
  const [indexByTutorial, setIndexByTutorial] = useState<Record<string, number>>({});

  useEffect(() => {
    const client = getSupabaseClient();
    let isMounted = true;

    async function loadSteps() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await client
          .from<TutorialStep>('tutorial_steps')
          .select('*')
          .eq('enabled', true)
          .order('tutorial_slug', { ascending: true })
          .order('step_order', { ascending: true });

        if (fetchError) {
          console.error('Supabase fetch error', fetchError);
          if (isMounted) {
            setError('Erro ao carregar tutorial. Tente novamente.');
          }
          return;
        }

        if (!isMounted) return;

        const safeData = data ?? [];
        setSteps(safeData);

        const tutorials = Array.from(new Set(safeData.map((item) => item.tutorial_slug)));

        setIndexByTutorial((prev) => {
          const next: Record<string, number> = { ...prev };
          let changed = false;
          tutorials.forEach((slug) => {
            if (!(slug in next)) {
              next[slug] = 0;
              changed = true;
            }
          });
          Object.keys(next).forEach((slug) => {
            if (!tutorials.includes(slug)) {
              delete next[slug];
              changed = true;
            }
          });
          return changed ? next : prev;
        });

        if (tutorials.length === 0) {
          setActiveTutorial(null);
          return;
        }

        if (initialTutorial && tutorials.includes(initialTutorial)) {
          setActiveTutorial(initialTutorial);
        } else if (!initialTutorial) {
          setActiveTutorial((current) => (current && tutorials.includes(current) ? current : tutorials[0]));
        } else {
          setActiveTutorial(tutorials[0]);
        }
      } catch (err) {
        console.error('Unexpected error loading tutorial_steps', err);
        if (isMounted) {
          setError('Erro inesperado. Veja o console.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSteps();

    return () => {
      isMounted = false;
    };
  }, [initialTutorial]);

  const groupedSteps = useMemo(() => {
    return steps.reduce<GroupedSteps>((accumulator, step) => {
      const key = step.tutorial_slug;
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(step);
      return accumulator;
    }, {});
  }, [steps]);

  useEffect(() => {
    setIndexByTutorial((prev) => {
      let changed = false;
      const next: Record<string, number> = {};

      Object.entries(groupedSteps).forEach(([slug, tutorialSteps]) => {
        const maxIndex = Math.max(0, tutorialSteps.length - 1);
        const currentIndex = prev[slug] ?? 0;
        const clampedIndex = Math.max(0, Math.min(currentIndex, maxIndex));
        next[slug] = clampedIndex;
        if (clampedIndex !== currentIndex) {
          changed = true;
        }
      });

      if (Object.keys(prev).length !== Object.keys(next).length) {
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [groupedSteps]);

  useEffect(() => {
    if (!activeTutorial) return;
    if (!(activeTutorial in groupedSteps)) {
      const available = Object.keys(groupedSteps);
      setActiveTutorial(available.length ? available[0] : null);
    }
  }, [groupedSteps, activeTutorial]);

  const activeSteps = activeTutorial ? groupedSteps[activeTutorial] ?? [] : [];
  const currentIndex = activeTutorial ? indexByTutorial[activeTutorial] ?? 0 : 0;
  const currentStep = activeSteps[currentIndex];

  const goTo = (tutorial: string, index: number) => {
    setActiveTutorial(tutorial);
    setIndexByTutorial((prev) => {
      const maxIndex = Math.max(0, (groupedSteps[tutorial]?.length ?? 1) - 1);
      const clampedIndex = Math.max(0, Math.min(index, maxIndex));
      if (prev[tutorial] === clampedIndex) {
        return prev;
      }
      return { ...prev, [tutorial]: clampedIndex };
    });
  };

  const onNext = () => {
    if (!activeTutorial) return;
    const maxIndex = Math.max(0, (groupedSteps[activeTutorial]?.length ?? 1) - 1);
    const nextIndex = Math.min(currentIndex + 1, maxIndex);
    goTo(activeTutorial, nextIndex);
  };

  const onPrev = () => {
    if (!activeTutorial) return;
    const prevIndex = Math.max(currentIndex - 1, 0);
    goTo(activeTutorial, prevIndex);
  };

  if (loading) {
    return (
      <div className="tutorial">
        <p>Carregando tutorial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutorial">
        <p>Erro: {error}</p>
      </div>
    );
  }

  if (!activeTutorial) {
    return (
      <div className="tutorial">
        <p>Nenhum tutorial disponível.</p>
      </div>
    );
  }

  return (
    <section className="tutorial" aria-live="polite">
      <header className="tutorial-header">
        <h2>Tutoriais</h2>
        <nav aria-label="Selecionar tutorial" className="tutorial-tabs">
          {Object.keys(groupedSteps).map((slug) => (
            <button
              key={slug}
              type="button"
              className={`tutorial-tab${slug === activeTutorial ? ' active' : ''}`}
              onClick={() => goTo(slug, indexByTutorial[slug] ?? 0)}
              aria-pressed={slug === activeTutorial}
            >
              {slug}
            </button>
          ))}
        </nav>
      </header>

      {currentStep ? (
        <article className="step" aria-labelledby={`tutorial-step-${currentStep.id}`}>
          <header>
            <h3 id={`tutorial-step-${currentStep.id}`}>
              {currentStep.headline ?? currentStep.slug ?? `Passo ${currentIndex + 1}`}
            </h3>
          </header>
          <div className="step-body">
            {currentStep.body ? <p>{currentStep.body}</p> : <p>Sem descrição para este passo.</p>}
          </div>
          <footer className="controls">
            <button type="button" onClick={onPrev} disabled={currentIndex === 0}>
              {currentStep.prev_label ?? 'Voltar'}
            </button>
            {currentIndex < activeSteps.length - 1 ? (
              <button type="button" onClick={onNext}>
                {currentStep.next_label ?? 'Próximo'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  alert(currentStep.done_label ?? 'Concluir');
                }}
              >
                {currentStep.done_label ?? 'Concluir'}
              </button>
            )}
          </footer>
        </article>
      ) : (
        <div className="step empty">
          <p>Nenhum passo encontrado para este tutorial.</p>
        </div>
      )}

      <footer className="tutorial-footer">
        <small>
          Passo {activeSteps.length ? currentIndex + 1 : 0} de {activeSteps.length}
        </small>
      </footer>
    </section>
  );
}
