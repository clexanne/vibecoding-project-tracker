import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import TypeBadge, { TASK_TYPES, typeStyle } from './TypeBadge.jsx';
import CopyContextButton, { formatContext } from './CopyContextButton.jsx';

const inputClass =
  'mt-1.5 min-h-11 w-full rounded-md border border-slate-500 bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary';
const labelClass = 'block text-sm font-medium text-text-primary';

// M9 task context: the AI tools a task's context can be tagged with.
export const AI_TOOLS = ['Claude', 'ChatGPT', 'Cursor', 'Lovable', 'Replit', 'Other'];

// Real text, not a placeholder, so the headings stay visible while you write.
// Saved untouched, it counts as no context.
const CONTEXT_TEMPLATE = '## Background\n\n\n## Constraints\n\n\n## Tried so far\n\n\n## Pick up\n';

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
 * Changing the Owner and saving is the handoff (M7.1); App acknowledges it.
 * Context (M9) is its own section: a Markdown briefing for whoever picks the
 * task up next, the AI tool it came from, and when it was last updated.
 * Closing with unsaved changes asks first, so a pasted log is never lost to Escape.
 * Layout: "what" fields, then "tracking" fields, then actions, each group
 * separated by space and a rule so related fields read as one chunk.
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

  // Move focus into the dialog on open and back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement;
    titleRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  const requestClose = () => {
    if (!isDirty || window.confirm('Close without saving? Your changes will be lost.')) onClose();
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

  // "See what gets copied": shows the exact text, and opens by itself if the
  // clipboard is blocked so it can be copied by hand.
  const statusLabel = stages.find((stage) => stage.id === form.status)?.label ?? '';
  const [showCopyText, setShowCopyText] = useState(false);
  const handleCopied = (ok, hasContext) => {
    if (!ok) setShowCopyText(true);
    onCopied(ok, hasContext);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formTask);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${task.title}"? This can't be undone.`)) onDelete(task.id);
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
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border-l-4 ${typeStyle(form.type).stripe} bg-surface-card p-6 shadow-xl sm:p-8`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 id="task-modal-title" className="text-lg font-semibold text-text-primary">
              {isEditing ? 'Edit task' : 'New task'}
              {/* Screen readers hear which task the dialog is for, not just "Edit task". */}
              {isEditing && <span className="sr-only">: {initialForm.title}</span>}
            </h2>
            <TypeBadge type={form.type} />
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-md text-xl leading-none text-text-muted hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
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

            <fieldset>
              <legend className={labelClass}>Type</legend>
              <div className="mt-1.5 flex gap-2">
                {Object.entries(TASK_TYPES).map(([id, { label, Icon, text }]) => (
                  <label
                    key={id}
                    className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium focus-within:ring-2 focus-within:ring-brand-primary ${
                      form.type === id ? `border-current bg-brand-accent ${text}` : 'border-slate-500 text-text-muted'
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
          </div>

          <div className="mt-6 space-y-5 border-t border-slate-200 pt-6">
            <div>
              <label htmlFor="task-context" className={labelClass}>Context</label>
              <p id="task-context-help" className="mt-1 text-pretty text-xs text-text-muted">
                Paste your prompt, AI chat summary or error log here, so anyone can copy it into an AI tool and carry on.
              </p>
              <textarea
                id="task-context"
                rows={10}
                value={form.context}
                onChange={update('context')}
                aria-describedby="task-context-help task-context-updated"
                className={`${inputClass} resize-y font-mono leading-relaxed`}
              />
              <p id="task-context-updated" className="mt-1.5 text-right text-xs text-text-muted">
                {task?.contextUpdatedAt ? (
                  <>
                    Updated{' '}
                    <time
                      dateTime={task.contextUpdatedAt}
                      title={new Date(task.contextUpdatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    >
                      {timeAgo(task.contextUpdatedAt)}
                    </time>
                  </>
                ) : (
                  'Not written yet'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="w-full sm:w-1/3">
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
                onCopied={handleCopied}
                className="border border-slate-300"
              />
            </div>

            <details className="group" open={showCopyText} onToggle={(event) => setShowCopyText(event.currentTarget.open)}>
              <summary className="-ml-1 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-md pr-2 text-sm font-medium text-brand-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
                See what gets copied
              </summary>
              <p id="task-copy-help" className="text-xs text-text-muted">
                If the button doesn't work, select this text and copy it.
              </p>
              <textarea
                readOnly
                rows={10}
                value={formatContext(formTask, statusLabel)}
                aria-label="Text that gets copied"
                aria-describedby="task-copy-help"
                className={`${inputClass} resize-y bg-surface-page font-mono text-xs leading-relaxed`}
              />
            </details>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-200 pt-6 sm:grid-cols-3">
            <div>
              <label htmlFor="task-status" className={labelClass}>Status</label>
              <select id="task-status" value={form.status} onChange={update('status')} className={inputClass}>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>{stage.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-assignee" className={labelClass}>Owner</label>
              <select id="task-assignee" value={form.assignee} onChange={update('assignee')} className={inputClass}>
                {members.map((name) => (
                  <option key={name} value={name}>{name}</option>
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
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
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
            <div className="flex items-center gap-3">
              {/* Says why closing will ask first, so the prompt is never a surprise. */}
              {isDirty && <span className="hidden text-xs text-text-muted sm:inline">Unsaved changes</span>}
              <button
                type="button"
                onClick={requestClose}
                className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 rounded-md bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
              >
                {isEditing ? 'Save changes' : 'Add task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
