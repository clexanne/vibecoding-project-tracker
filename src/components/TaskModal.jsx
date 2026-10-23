import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
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

// The Preview toggle is remembered per browser, so people who like it keep it.
const PREVIEW_KEY = 'vibetracker.contextPreview';
const readPreview = () => {
  try {
    return window.localStorage.getItem(PREVIEW_KEY) === 'true';
  } catch {
    return false;
  }
};

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
 * Both questions (discard changes, delete) use ConfirmDialog, not the browser's confirm().
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
 * The buttons sit in a footer that never scrolls away.
 * Preview (M9 stretch) is off by default, so the form stays calm. Turned on, it
 * shows the formatted Context live, next to the text box on wide screens and
 * under it on smaller ones. Nothing else on the form moves when it turns on, and
 * the preview scrolls with the text box, so both show the same part (no hunting
 * for your place in two boxes, which splits attention).
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
  // Which question is showing over the form: null, 'discard' or 'delete'.
  const [confirming, setConfirming] = useState(null);
  const cancelConfirm = useCallback(() => setConfirming(null), []);
  const [preview, setPreview] = useState(readPreview);
  const contextRef = useRef(null);
  const previewRef = useRef(null);
  // Keep the preview at the same point as the text box: same share scrolled.
  const syncPreview = () => {
    const from = contextRef.current;
    const to = previewRef.current;
    if (!from || !to || !preview) return;
    const share = from.scrollTop / Math.max(1, from.scrollHeight - from.clientHeight);
    to.scrollTop = share * (to.scrollHeight - to.clientHeight);
  };
  const togglePreview = () => {
    setPreview(!preview);
    try {
      window.localStorage.setItem(PREVIEW_KEY, String(!preview));
    } catch {
      /* private mode: the toggle still works, it just isn't remembered */
    }
  };

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

  const handleDelete = () => {
    setConfirming('delete');
  };

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
        className={`flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-y-auto rounded-lg border-l-4 ${typeStyle(form.type).stripe} bg-surface-card shadow-xl`}
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-4">
          {/* Type shows as the stripe (same as the card, M6) and the Type buttons, so no badge here too. */}
          <h2 id="task-modal-title" className="text-lg font-semibold text-text-primary">
            {isEditing ? 'Edit task' : 'New task'}
            {/* Screen readers hear which task the dialog is for, not just "Edit task". */}
            {isEditing && <span className="sr-only">: {initialForm.title}</span>}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-md text-xl leading-none text-text-muted hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
          <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-6 px-6 [@media(min-height:480px)]:min-h-0 [@media(min-height:480px)]:overflow-y-auto pb-4 pt-2 lg:grid-cols-2">
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
                    className={inputClass}
                  />
                </div>
              </div>

              {/* 2. Who and when: a separate chunk below a thin line, like the card.
                  The owner field is wider (a full row on small laptops, where
                  the left half is narrow), so "Name (current)" fits. */}
              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-200 pt-6 sm:grid-cols-[3fr_2fr_2fr] lg:grid-cols-2 xl:grid-cols-[3fr_2fr_2fr]">
                <div className="lg:col-span-2 xl:col-span-1">
                  <label htmlFor="task-assignee" className={labelClass}>{isEditing ? 'Hand off to…' : 'Owner'}</label>
                  <select id="task-assignee" value={form.assignee} onChange={update('assignee')} className={inputClass}>
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

            <div className="flex flex-col border-t border-slate-200 pt-6 lg:-mb-4 lg:-mr-6 lg:-mt-2 lg:border-l lg:border-t-0 lg:bg-surface-page lg:pb-4 lg:pl-8 lg:pr-6 lg:pt-2">
              {/* No help sentence: the template headings say what to write, and
                  Copy Context plus its toast say what it's for, at the moment it matters. */}
              <div className="flex items-end justify-between gap-3">
                <label htmlFor="task-context" className={labelClass}>Context</label>
                {/* Pressed looks like the other picked things in the app (indigo), and
                    the word stays the same, so screen readers hear "Preview, pressed". */}
                <button
                  type="button"
                  aria-pressed={preview}
                  aria-controls="task-context-preview"
                  onClick={togglePreview}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                    preview ? 'border-brand-primary bg-brand-accent text-brand-primary' : 'border-slate-500 bg-surface-card text-text-primary hover:bg-brand-accent'
                  }`}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Preview
                </button>
              </div>
              <div className={`mt-1.5 grid flex-1 gap-3 ${preview ? 'xl:grid-cols-2' : ''}`}>
                <textarea
                  id="task-context"
                  ref={contextRef}
                  rows={10}
                  value={form.context}
                  onChange={update('context')}
                  onScroll={syncPreview}
                  aria-describedby={task?.contextUpdatedAt ? 'task-context-updated' : undefined}
                  className={`${inputClass} !mt-0 h-full resize-y font-mono leading-relaxed`}
                />
                {/* Updates as you type. Beside the text box it's exactly as tall as
                    it, so the form doesn't grow. It can also scroll on its own, so it
                    can be reached with Tab (tabIndex 0) and scrolled with the arrow keys.
                    The small title says what the box is, since it looks like text, not a field. */}
                <div hidden={!preview} className="relative">
                  <section
                    id="task-context-preview"
                    ref={previewRef}
                    aria-labelledby="task-context-preview-title"
                    tabIndex={0}
                    className="max-h-80 overflow-y-auto rounded-md border border-slate-200 bg-surface-card px-4 pb-3 focus:outline-none focus:ring-2 focus:ring-brand-primary xl:absolute xl:inset-0 xl:max-h-none"
                  >
                    <h3
                      id="task-context-preview-title"
                      className="sticky top-0 -mx-4 mb-1 border-b border-slate-200 bg-surface-card px-4 py-1.5 text-xs font-medium text-text-muted"
                    >
                      Preview
                    </h3>
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-due-overdue hover:bg-due-overdue-bg focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
                className="min-h-11 whitespace-nowrap rounded-md border border-slate-500 px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 whitespace-nowrap rounded-md border border-transparent bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
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
      {confirming === 'delete' && (
        <ConfirmDialog
          title="Delete this task?"
          message={<><strong className="font-semibold text-text-primary">{task.title}</strong> will be deleted. You can't undo this.</>}
          confirmLabel="Delete task"
          onCancel={cancelConfirm}
          onConfirm={() => onDelete(task.id)}
        />
      )}
    </div>
  );
}
