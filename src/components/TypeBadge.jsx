import { Bug, Lightbulb } from 'lucide-react';

/**
 * Feature / bug styling (M6, DESIGN.md §2). Every place a task's type is shown
 * reads from here, so the card and the modal can't drift apart.
 * Class names are written out in full so Tailwind can find them.
 */
export const TASK_TYPES = {
  feature: { label: 'Feature', Icon: Lightbulb, stripe: 'border-l-type-feature', text: 'text-type-feature', tint: 'bg-type-feature-bg' },
  bug:     { label: 'Bug',     Icon: Bug,      stripe: 'border-l-type-bug',     text: 'text-type-bug', tint: 'bg-type-bug-bg' },
};

export const typeStyle = (type) => TASK_TYPES[type] ?? TASK_TYPES.feature;

/**
 * Icon + word in the type colour, so colour is never the only signal (NFR3).
 * No pill box: the card's stripe already carries the colour, and a box here
 * would be one more shape competing with the title. Both colours pass AA
 * (5:1 or more) on every due tint.
 */
export default function TypeBadge({ type }) {
  const { label, Icon, text } = typeStyle(type);
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 text-sm font-medium ${text}`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}
