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
 * type (stripe + badge) and due date (tint) only; the name is always shown beside it.
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
 * Chunked into three groups, so the eye reads three units instead of five
 * separate facts (working memory, 7±2):
 *   1. What: type (icon + word, top-left corner, M6) and title.
 *   2. Who and when: owner (M7) and due date (M8), tight together.
 *   3. Do: Copy Context, below a thin line (common region).
 * Space inside a group is small and space between groups is larger
 * (Gestalt proximity), so the groups show without adding boxes.
 * Done cards skip the due words, since the column already says Done; the grey
 * tint still marks them (M8).
 * Two hues, one job each: the type colour (left stripe + icon and word) says
 * feature vs. bug (M6), and the background tint + due text say when it's due (M8).
 */
export default function TaskCard({ task, today, statusLabel, highlighted, onOpen, onCopied }) {
  const state = dueState(task, today);
  const tint = state ? DUE_STATES[state].tint : 'bg-surface-card';
  // Open cards are white and lifted; done cards sit flat in the column's grey,
  // so finished work recedes and the eye goes to what's left.
  const depth = state === 'done' ? '' : 'shadow-sm hover:shadow-md';

  return (
    <li
      className={`relative rounded-lg border border-l-4 border-slate-200 ${typeStyle(task.type).stripe} ${tint} ${depth} px-4 pb-1 pt-3.5 transition-shadow duration-200 motion-reduce:transition-none ${
        highlighted ? 'ring-2 ring-brand-primary' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="block w-full text-left after:absolute after:inset-0 after:rounded-lg focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-primary focus-visible:after:ring-offset-2"
      >
        {/* 1. What */}
        <span className="block">
          <TypeBadge type={task.type} />
          <span className="mt-1 block text-base font-semibold leading-snug text-text-primary">{task.title}</span>
        </span>

        {/* 2. Who and when: one left edge, so the eye runs straight down. */}
        <span className="mt-4 flex flex-col gap-1.5">
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={task.assignee} />
            <span className="truncate text-sm text-text-muted">
              <span className="sr-only">Owner: </span>
              {task.assignee || 'Unassigned'}
            </span>
          </span>
          {state && state !== 'done' && <DueLabel task={task} today={today} />}
        </span>
      </button>

      {/* 3. Do */}
      <div className="mt-3 border-t border-slate-900/10 pt-1.5">
        <CopyContextButton
          task={task}
          statusLabel={statusLabel}
          onCopied={onCopied}
          quiet
          className="z-[1] -ml-3"
        />
      </div>
    </li>
  );
}
