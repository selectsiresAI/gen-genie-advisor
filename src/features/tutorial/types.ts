export type TutorialDef = {
  slug: string;
  title: string;
  is_enabled: boolean;
};

export type TutorialStep = {
  id: string;
  tutorial_slug: string;
  step_order: number;
  anchor: string;
  headline: string;
  body: string;
  next_label?: string;
  prev_label?: string;
  done_label?: string;
};
