import { AlertTriangle, CalendarDays, CheckCircle2, Clock } from 'lucide-react';

/**
 * Due-date states (M8 due-tint, DESIGN.md §2). Nothing is stored: the state is
 * worked out from `dueDate`, `status` and today's date every time a card renders.
 * Class names are written out in full so Tailwind can find them.
 */
export const DUE_STATES = {
  overdue:  { Icon: AlertTriangle, tint: 'bg-due-overdue-bg', text: 'text-due-overdue' },
  today:    { Icon: Clock,         tint: 'bg-due-warning-bg', text: 'text-due-warning' },
  upcoming: { Icon: CalendarDays,  tint: 'bg-due-safe-bg',    text: 'text-due-safe' },
  done:     { Icon: CheckCircle2,  tint: 'bg-due-neutral-bg', text: 'text-due-neutral' },
};

// Whole days from `today` to `dueDate`, both 'YYYY-MM-DD'. Negative = past due.
// Parsed as UTC so daylight-saving changes can't shift the count.
const daysUntil = (dueDate, today) => {
  const toUTC = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUTC(dueDate) - toUTC(today)) / 86_400_000);
};

/**
 * 'overdue' | 'today' | 'upcoming' | 'done', or null when there is no due date.
 * Done always wins, so a finished task looks neutral even if it was late.
 * Due dates have no time, so "less than 24 hours" means due today.
 */
export function dueState(task, today) {
  if (task.status === 'done') return 'done';
  if (!task.dueDate) return null;
  const days = daysUntil(task.dueDate, today);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  return 'upcoming';
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const shortDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** The words that go with each state, so colour is never the only signal (NFR3). */
export function dueText(task, today) {
  const state = dueState(task, today);
  if (state === 'done') return 'Done';
  if (state === null) return null;
  const days = daysUntil(task.dueDate, today);
  if (state === 'overdue') return `Overdue by ${plural(-days, 'day')}`;
  if (state === 'today') return 'Due today';
  return days === 1 ? 'Due tomorrow' : `Due in ${plural(days, 'day')}`;
}

/**
 * Icon + words + the real date, in the state's colour. Each state has its own
 * icon shape, so it still reads in greyscale and for colour-blind users.
 */
export default function DueLabel({ task, today }) {
  const state = dueState(task, today);
  if (state === null) return null;
  const { Icon, text } = DUE_STATES[state];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${text}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {dueText(task, today)}
      {state !== 'done' && (
        <span className="font-normal text-text-muted">· {shortDate(task.dueDate)}</span>
      )}
    </span>
  );
}
