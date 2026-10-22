import TypeBadge, { typeStyle } from './TypeBadge.jsx';

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
 * One task on the board. The whole card is one button that opens the edit
 * modal, where the Owner field does the handoff (M7.1), so each card is a single Tab stop
 * and a large click target.
 * Read order follows importance: title first, then a meta row (type, owner).
 * The left stripe and badge show feature vs. bug (M6). Due tint (M8) comes later.
 */
export default function TaskCard({ task, highlighted, onOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(task)}
        className={`block w-full rounded-lg border border-l-4 border-slate-200 ${typeStyle(task.type).stripe} bg-surface-card p-4 text-left transition-shadow duration-200 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 motion-reduce:transition-none ${
          highlighted ? 'ring-2 ring-brand-primary' : ''
        }`}
      >
        <span className="block text-[15px] font-medium leading-snug text-text-primary">{task.title}</span>

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
    </li>
  );
}
