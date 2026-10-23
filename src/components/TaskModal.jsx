import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, PenLine, Trash2 } from 'lucide-react';
import { TASK_TYPES, typeStyle } from './TypeBadge.jsx';
import CopyContextButton from './CopyContextButton.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import MarkdownPreview from './MarkdownPreview.jsx';

const inputClass =
  'mt-1.5 min-h-11 w-full rounded-md border border-slate-500 bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary';
const labelClass = 'block text-sm font-medium text-text-primary';

// M9 task context: the AI tools a task's context can be tagged with.
export const AI_TOOLS = ['Claude', 'ChatGPT', 'Cursor', 'Lovable', 'Replit', 'Other'];

// Real text, not a placeholder, so the headings stay visible while you write.
// Saved untouched, it counts as no context.
// One blank line per heading, so all five headings fit in the box without scrolling.
const CONTEXT_TEMPLATE = '## Background\n\n## Constraints\n\n## Tried so far\n\n## Outcome\n\n## Pick up\n';

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** '2026-10-22T15:04:00Z' -> 'just now', '2 hours ago', 'yesterday'. */
function timeAgo(iso) {
  const seconds = (new Date(iso) - Date.now()) / 1000;
  if (seconds > -60) return 'just now';
  const units = [['day', 86_400], ['hour', 3_600], ['minute', 60]];
  const [unit, size] = units.find(([, size]) => -seconds >= size);
  return relativeTime.format(Math.round(seconds / size), unit);
}

/**
 * Add / edit modal for one task (M5).
 * `task` is null when creating; otherwise the task being edited.
 * Escape and the × button close it; focus returns to whatever opened it.
 * Editing a task, the owner field is labelled "Hand off to…" (M7) with the
 * current owner marked; picking someone else and saving is the handoff, which
 * App acknowledges. A new task has no one to hand off from, so it says "Owner".
 * Context (M9) is its own section: a Markdown briefing for whoever picks the
 * task up next, the AI tool it came from, and when it was last updated.
 * Closing with unsaved changes asks first, so a pasted log is never lost to Escape.
 * Discard changes asks with ConfirmDialog, not the browser's confirm(). Delete
 * doesn't ask: it happens at once and the toast offers Undo (App), which is
 * faster and safer than a question people learn to click through.
 * Layout: the task on the left and its Context on the right, as a sidebar:
 * the page's own grey, edge to edge between header and footer, with a thin line.
 * It groups the Context as its own area (common region) but reads as part of the
 * layout, not as a picked item: no rounded floating box and no blue tint, which
 * this app uses for "selected" (Feature/Bug, an active filter). The line keeps
 * the split visible where faint fills disappear (high-contrast mode, dim screens).
 * On phones it's just the line, below the task.
 * The left half uses the card's two chunks: What (title, type, description),
 * then Who and when (owner, due date, status) below a thin line. Inside each
 * chunk the order follows how you fill a form: the required field first,
 * where focus starts, so what you read and where Tab goes match (WCAG 2.4.3);
 * then the quick choice (type) before the long text (description).
 * Owner and due date come before status, as on the card. The right half reads top to bottom in
 * the order you work: write the context, say which AI tool, copy it.
 * Copy Context sits right next to the AI tool, not at the far edge, so the eye
 * and pointer travel less. Everything shares one left edge (no zigzag).
 * The buttons sit in a footer that never scrolls away, and the header has a
 * line under it too, so the Context side starts cleanly below it.
 * The dialog is max-w-5xl (about 1024px), not full width: the Context text
 * stays near 60 characters a line (long lines are hard to track back), and
 * some board stays visible around it. It never changes size. On two-column
 * screens it is a fixed 44rem tall (or the screen, if shorter), so tall
 * screens give the Context more lines. Only the Context grows: an empty
 * Description box that size would suggest you should write an essay there.
 * Preview is a quiet text button on the Context label's line, not an outlined
 * box in the corner, so it doesn't compete with the × or pull the label down:
 * "Context" lines up with "Title". It keeps its 44px target (negative margins).
 * On wide screens the Context side gets 3/5 of the width (the task fields are
 * short, the Context is long), so the text box and its preview each keep a
 * readable line length (about 40 to 50 characters) side by side.
 * Preview (M9 stretch) is off by default, so the form stays calm. Turned on, it
 * shows the formatted Context in place of the text box, in exactly the same
 * box, so nothing on the page moves (like GitHub's Write / Preview). One view
 * at a time also means one thing to look at, not two boxes competing.
 */
export default function TaskModal({ task, stages, members, onSave, onDelete, onClose, onCopied }) {
  const isEditing = task != null;
  const [initialForm] = useState(() => ({
    title: task?.title ?? '',
    description: task?.description ?? '',
    type: task?.type ?? 'feature',
    status: task?.status ?? 'todo',
    assignee: task?.assignee ?? members[0] ?? '',
    dueDate: task?.dueDate ?? '',
    context: task?.context || CONTEXT_TEMPLATE,
    contextTool: task?.contextTool ?? '',
  }));
  const [form, setForm] = useState(initialForm);
  const isDirty = Object.keys(form).some((field) => form[field] !== initialForm[field]);
  const titleRef = useRef(null);
  // Which question is showing over the form: null or 'discard'.
  const [confirming, setConfirming] = useState(null);
  const cancelConfirm = useCallback(() => setConfirming(null), []);
  // Every task opens in Write, so the box is always ready to type in and never
  // surprises you by showing the last task's view.
  const [preview, setPreview] = useState(false);

  // Move focus into the dialog on open and back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement;
    titleRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  const requestClose = () => {
    if (isDirty) setConfirming('discard');
    else onClose();
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      // isComposing: Escape that cancels an IME word (e.g. Japanese input) isn't a close.
      if (event.key === 'Escape' && !event.isComposing) requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  // The task as it stands in the form, unsaved edits included: what you copy is what you see.
  const formTask = {
    ...form,
    title: form.title.trim(),
    dueDate: form.dueDate || null,
    context: form.context.trim() === CONTEXT_TEMPLATE.trim() ? '' : form.context,
  };

  const statusLabel = stages.find((stage) => stage.id === form.status)?.label ?? '';

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formTask);
  };

  const handleDelete = () => onDelete(task.id);

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && requestClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        inert={confirming ? '' : undefined}
        className={`flex max-h-[calc(100vh-2rem)] w-full lg:h-[44rem] max-w-5xl flex-col overflow-y-auto rounded-lg border-l-4 ${typeStyle(form.type).stripe} bg-surface-card shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-2">
          {/* Type shows as the stripe (same as the card, M6) and the Type buttons, so no badge here too. */}
          <h2 id="task-modal-title" className="text-lg font-semibold text-text-primary">
            {isEditing ? 'Edit task' : 'New task'}
            {/* Screen readers hear which task the dialog is for, not just "Edit task". */}
            {isEditing && <span className="sr-only">: {initialForm.title}</span>}
            {/* The created date (FR2) is stored on every task, so show it where the task's details are. */}
            {isEditing && task.createdDate && (
              <span className="ml-3 text-sm font-normal text-text-muted">
                Added {new Date(`${task.createdDate}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-md text-xl leading-none text-text-muted hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col [@media(min-height:480px)]:min-h-0">
          {/* Two columns on wide screens: the task on the left, its context on the
              right, so everything fits on one laptop screen. Narrow screens get one
              column that scrolls here, while the header and buttons stay put.
              On very short screens (e.g. 400% zoom) the whole dialog scrolls
              instead, so the buttons can never be cut off. */}
          <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-6 px-6 [@media(min-height:480px)]:min-h-0 [@media(min-height:480px)]:overflow-y-auto pb-4 pt-4 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] xl:grid-cols-[2fr_3fr]">
            <div>
              {/* 1. What: title first (it's required and where focus starts, so reading
                  order = Tab order), then type, which shapes how you describe it. */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="task-title" className={labelClass}>
                    Title <span className="font-normal text-text-muted">(required)</span>
                  </label>
                  <input
                    id="task-title"
                    ref={titleRef}
                    required
                    value={form.title}
                    onChange={update('title')}
                    className={inputClass}
                  />
                </div>

                <fieldset>
                  <legend className={labelClass}>Type</legend>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {Object.entries(TASK_TYPES).map(([id, { label, Icon, text, tint }]) => (
                      <label
                        key={id}
                        className={`flex min-h-11 min-w-32 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium focus-within:ring-2 focus-within:ring-brand-primary ${
                          form.type === id ? `border-current ${tint} ${text}` : 'border-slate-500 text-text-muted'
                        }`}
                      >
                        <input
                          type="radio"
                          name="task-type"
                          value={id}
                          checked={form.type === id}
                          onChange={update('type')}
                          className="sr-only"
                        />
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="task-description" className={labelClass}>Description</label>
                  <textarea
                    id="task-description"
                    rows={3}
                    value={form.description}
                    onChange={update('description')}
                    // Two lines on short laptop screens (e.g. 1366x650), so the whole form fits without scrolling.
                    className={`${inputClass} [@media(max-height:700px)]:h-[3.75rem]`}
                  />
                </div>
              </div>

              {/* 2. Who and when: a separate chunk below a thin line, like the card.
                  The owner field gets a full row on laptops and up, where the
                  left half is narrow, so "Name (current)" fits. */}
              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-[3fr_2fr_2fr] lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label htmlFor="task-assignee" className={labelClass}>{isEditing ? 'Hand off to…' : 'Owner'}</label>
                  <select id="task-assignee" value={form.assignee} onChange={update('assignee')} className={inputClass}>
                    {/* A task whose owner was removed from the team says so, instead of
                        quietly showing the first name in the list. */}
                    {!members.includes(initialForm.assignee) && <option value={initialForm.assignee}>Unassigned</option>}
                    {members.map((name) => (
                      <option key={name} value={name}>
                        {isEditing && name === task.assignee ? `${name} (current)` : name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="task-due" className={labelClass}>Due date</label>
                  <input
                    id="task-due"
                    type="date"
                    value={form.dueDate}
                    onChange={update('dueDate')}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="task-status" className={labelClass}>Status</label>
                  <select id="task-status" value={form.status} onChange={update('status')} className={inputClass}>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>{stage.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col border-t border-slate-200 pt-6 lg:-mb-4 lg:-mr-6 lg:-mt-4 lg:border-l lg:border-t-0 lg:bg-surface-page lg:pb-4 lg:pl-8 lg:pr-6 lg:pt-4">
              {/* No help sentence: the template headings say what to write, and
                  Copy Context plus its toast say what it's for, at the moment it matters. */}
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="task-context" className={labelClass}>Context</label>
                {/* Write / Preview, both always shown, so you can see which one you're in
                    and how to get back (recognition, not recall). The one you're in is
                    indigo with a line under it, like a tab; colour is never the only sign.
                    The focus ring shows for the keyboard only (a click already shows the
                    underline) and sits inside the tab, so it never covers the box edge.
                    The tabs sit right on the box's top edge, so they read as part of it
                    (connectedness), and their text lines up with "Context". */}
                <div role="group" aria-label="Context view" className="-mb-2.5 -mt-3.5 flex">
                  {[
                    [false, 'Write', PenLine],
                    [true, 'Preview', Eye],
                  ].map(([on, label, Icon]) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={preview === on}
                      onClick={() => setPreview(on)}
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-t-md border-b-2 px-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary ${
                        preview === on ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative mt-2.5 flex min-h-0 flex-1 flex-col">
                {/* Turned invisible, not removed, while previewing: it keeps its size,
                    so the preview drops into exactly the same space. */}
                <textarea
                  id="task-context"
                  rows={10}
                  value={form.context}
                  onChange={update('context')}
                  aria-describedby={task?.contextUpdatedAt ? 'task-context-updated' : undefined}
                  className={`${inputClass} !mt-0 min-h-40 flex-1 resize-y font-mono leading-relaxed ${preview ? 'invisible' : ''}`}
                />
                {/* Laid over the text box. It scrolls on its own, so it can be reached
                    with Tab (tabIndex 0) and scrolled with the arrow keys. No title inside:
                    the pressed Preview button already says what this is. */}
                <div hidden={!preview}>
                  <section
                    aria-label="Context preview"
                    tabIndex={0}
                    className="absolute inset-0 overflow-y-auto rounded-md border border-slate-500 bg-surface-card px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <MarkdownPreview markdown={form.context} />
                  </section>
                </div>
              </div>
              {/* Only once there's something to date: an empty box already says "not written". */}
              {task?.contextUpdatedAt && (
                <p id="task-context-updated" className="mt-1.5 text-sm text-text-muted">
                  Updated{' '}
                  <time
                    dateTime={task.contextUpdatedAt}
                    title={new Date(task.contextUpdatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  >
                    {timeAgo(task.contextUpdatedAt)}
                  </time>
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-full sm:w-56">
                  <label htmlFor="task-context-tool" className={labelClass}>
                    AI tool <span className="font-normal text-text-muted">(optional)</span>
                  </label>
                  <select id="task-context-tool" value={form.contextTool} onChange={update('contextTool')} className={inputClass}>
                    <option value="">None</option>
                    {AI_TOOLS.map((tool) => (
                      <option key={tool} value={tool}>{tool}</option>
                    ))}
                  </select>
                </div>
                <CopyContextButton
                  task={formTask}
                  statusLabel={statusLabel}
                  onCopied={onCopied}
                  className="border border-brand-primary/40 bg-surface-card"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-3">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-due-overdue hover:bg-due-overdue-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete task
              </button>
            ) : (
              <span />
            )}
            <div className="ml-auto flex items-center gap-3">
              {/* Says why closing will ask first, so the prompt is never a surprise. */}
              {isDirty && <span className="hidden text-xs text-text-muted sm:inline">Unsaved changes</span>}
              <button
                type="button"
                onClick={requestClose}
                className="min-h-11 whitespace-nowrap rounded-md border border-slate-500 px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 whitespace-nowrap rounded-md border border-transparent bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                {isEditing ? 'Save changes' : 'Add task'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {confirming === 'discard' && (
        <ConfirmDialog
          title="Discard changes?"
          message="Your changes to this task won't be saved."
          cancelLabel="Keep editing"
          confirmLabel="Discard"
          onCancel={cancelConfirm}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}
