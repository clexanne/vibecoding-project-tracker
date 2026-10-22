import {Bug, Lightbulb} from 'lucide-react';

/**
 * Feature / bug styling (M6, DESIGN.md §2). Every place a task's type is shown
 * reads from here, so the card and the modal can't drift apart.
 * Class names are written out in full so Tailwind can find them.
 */
export const TASK_TYPES = {
    feature: {
        label: 'Feature',
        Icon: Lightbulb,
        stripe: 'border-l-type-feature',
        text: 'text-type-feature',
        pill: 'border-type-feature bg-type-feature-bg'
    },
    bug: {
        label: 'Bug',
        Icon: Bug,
        stripe: 'border-l-type-bug',
        text: 'text-type-bug',
        pill: 'border-type-bug bg-type-bug-bg'
    },
};

export const typeStyle = (type) => TASK_TYPES[type] ?? TASK_TYPES.feature;

/**
 * Icon + word in a pill, so colour is never the only signal (NFR3).
 * The 1px border in the type colour keeps the pill's edge visible on any card tint.
 */
export default function TypeBadge({type}) {
    const {label, Icon, text, pill} = typeStyle(type);
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${text} ${pill}`}>
      <Icon className="h-4 w-4" aria-hidden="true"/>
            {label}
    </span>
    );
}
