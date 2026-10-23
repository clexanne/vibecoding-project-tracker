import { ChevronDown } from 'lucide-react';
import { TASK_TYPES } from './TypeBadge.jsx';

/**
 * The board's toolbar: three look-alike dropdowns (Owner, Type, Sort) on the
 * left, + New task on the right, 12px above the board they act on and 40px
 * below Deliverables, so they group with the board (proximity).
 * They have the same small corners as every other control (Deliverables fields,
 * buttons, the task form), so things you click look alike (similarity); round
 * pills are kept for labels you only read (column counts, Feature/Bug tags).
 * Each is a real <label> + native <select>, so it works with a keyboard and
 * screen readers as people expect.
 * A dropdown that's filtering turns indigo, so you can see why cards are missing.
 */
export const SORTS = [
  { id: 'due', label: 'Due date' },
  { id: 'newest', label: 'Date added' },
  { id: 'manual', label: 'My order' },
];

// Tasks without a due date go last when sorting by due date.
// createdDate has no time, so tasks added the same day tie; for "Date added" (newest first)
// we reverse before sorting so the last one added still comes out on top.
// "My order" is the tasks list as it's saved, which dragging or "Up one" / "Down one" changes.
export function sortTasks(tasks, sortId) {
  if (sortId === 'due') return [...tasks].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
  if (sortId === 'newest') return [...tasks].reverse().sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  return tasks;
}

function Dropdown({ id, label, value, onChange, active, children }) {
  return (
    <div
      className={`relative flex h-11 items-center rounded-md border pl-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-primary has-[:focus-visible]:ring-offset-2 ${
        active ? 'border-brand-primary bg-brand-accent' : 'border-slate-500 bg-surface-card hover:bg-slate-50'
      }`}
    >
      <label htmlFor={id} className="text-sm text-text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-full cursor-pointer appearance-none rounded-md bg-transparent pl-1.5 pr-9 text-sm font-semibold focus:outline-none ${
          active ? 'text-brand-primary' : 'text-text-primary'
        }`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-text-muted" aria-hidden="true" />
    </div>
  );
}

export default function BoardToolbar({ onNewTask, members, focusName, onFocus, typeId, onType, sortId, onSort, onClear }) {
  const filtering = Boolean(focusName || typeId);

  return (
    <section aria-label="Board tools" className="mb-3 flex flex-wrap items-center gap-3">
      <Dropdown id="filter-owner" label="Owner" value={focusName ?? ''} onChange={(v) => onFocus(v || null)} active={Boolean(focusName)}>
        <option value="">Everyone</option>
        {members.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </Dropdown>
      <Dropdown id="filter-type" label="Type" value={typeId ?? ''} onChange={(v) => onType(v || null)} active={Boolean(typeId)}>
        <option value="">All</option>
        {Object.entries(TASK_TYPES).map(([id, { label }]) => (
          <option key={id} value={id}>{`${label}s`}</option>
        ))}
      </Dropdown>
      <Dropdown id="sort-by" label="Sort by" value={sortId} onChange={onSort} active={false}>
        {SORTS.map((sort) => (
          <option key={sort.id} value={sort.id}>{sort.label}</option>
        ))}
      </Dropdown>
      {/* Only there while filtering: the one-step way back. */}
      {filtering && (
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 rounded-md px-2 text-sm font-medium text-brand-primary underline underline-offset-2 hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          Clear filters
        </button>
      )}
      {/* The transparent border keeps the button's outline in Windows
          high-contrast mode, where background colours are removed. */}
      <button
        type="button"
        onClick={onNewTask}
        className="ml-auto min-h-11 rounded-md border border-transparent bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      >
        + New task
      </button>
    </section>
  );
}
