import { Bug, Lightbulb } from 'lucide-react';

/**
 * Feature / bug styling (M6, DESIGN.md §2). Every place a task's type is shown
 * reads from here, so the card and the modal can't drift apart.
 * Class names are written out in full so Tailwind can find them.
 */
export const TASK_TYPES = {
  feature: { label: 'Feature', Icon: Lightbulb, stripe: 'border-l-type-feature', text: 'text-type-feature', tint: 'bg-type-feature-bg', pill: 'border-type-feature/40 bg-type-feature-bg' },
  bug:     { label: 'Bug',     Icon: Bug,      stripe: 'border-l-type-bug',     text: 'text-type-bug', tint: 'bg-type-bug-bg', pill: 'border-type-bug/40 bg-type-bug-bg' },
};

export const typeStyle = (type) => TASK_TYPES[type] ?? TASK_TYPES.feature;

/**
 * Icon + word in the type colour, so colour is never the only signal (NFR3).
 * A label pill, like the labels on a GitHub issue: a shape developers already
 * know, so it's read as "tag" without thinking. The pill has its own light
 * tint, so the text passes AA (5:1 or more) whatever the card's due tint.
 * `small` (cards) sits beside the title, so it gives the title a little more room.
 */
export default function TypeBadge({ type, small = false }) {
  const { label, Icon, text, pill } = typeStyle(type);
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${small ? 'text-[13px]' : 'text-sm'} ${text} ${pill}`}>
      <Icon className={small ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />
      {label}
    </span>
  );
}
