import TypeBadge, { typeStyle } from './TypeBadge.jsx';
import DueLabel, { DUE_STATES, dueState } from './DueLabel.jsx';
import CopyContextButton from './CopyContextButton.jsx';

/** 'Sam Patel' -> 'SP'. Falls back to '?' for unassigned tasks. */
export const initials = (name) =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('') || '?';

/**
 * Initials in a circle (M7). One colour for everyone, so colour keeps meaning
 * type (stripe) and due date (tint) only; the name is always shown beside it.
 */
export function Avatar({ name, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'h-9 w-9 text-sm' : 'h-7 w-7 text-xs';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-accent font-semibold text-brand-primary ring-1 ring-brand-primary/30 ${sizeClass}`}
    >
      {initials(name)}
    </span>
  );
}

/**
 * One task on the board. The card's main button opens the edit modal, where
 * the Owner field does the handoff (M7.1); its ::after layer stretches over
 * the whole card, so the card is still one large click target. "Copy context"
 * (M10) sits above that layer as the card's second Tab stop.
 * Read order follows importance: title, when it's due, then a meta row (type, owner).
 * The left stripe and badge show feature vs. bug (M6); the card's background
 * tint shows the due state (M8), so the two never compete for the same channel.
 */
export default function TaskCard({ task, today, statusLabel, highlighted, onOpen, onCopied }) {
  const state = dueState(task, today);
  const tint = state ? DUE_STATES[state].tint : 'bg-surface-card';
  // Open cards are white and lifted; done cards sit flat in the column's grey,
  // so finished work recedes and the eye goes to what's left.
  const depth = state === 'done' ? '' : 'shadow-sm hover:shadow-md';

  return (
    <li
      className={`relative rounded-lg border border-l-4 border-slate-200 ${typeStyle(task.type).stripe} ${tint} ${depth} p-4 transition-shadow duration-200 motion-reduce:transition-none ${
        highlighted ? 'ring-2 ring-brand-primary' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="block w-full text-left after:absolute after:inset-0 after:rounded-lg focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-primary focus-visible:after:ring-offset-2"
      >
        <span className="block text-[15px] font-medium leading-snug text-text-primary">{task.title}</span>

        {state && (
          <span className="mt-2 block">
            <DueLabel task={task} today={today} />
          </span>
        )}

        <span className="mt-4 flex items-center justify-between gap-3">
          <TypeBadge type={task.type} />
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={task.assignee} />
            <span className="truncate text-xs text-text-muted">
              <span className="sr-only">Owner: </span>
              {task.assignee || 'Unassigned'}
            </span>
          </span>
        </span>
      </button>

      <CopyContextButton
        task={task}
        statusLabel={statusLabel}
        onCopied={onCopied}
        quiet
        className="relative z-[1] -mb-2 -ml-3 mt-2"
      />
    </li>
  );
}
