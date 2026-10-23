import { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Avatar } from './TaskCard.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

const inputClass =
  'mt-1.5 min-h-11 w-full rounded-md border border-slate-500 bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary';
const labelClass = 'block text-sm font-medium text-text-primary';
const secondaryButton =
  'min-h-11 whitespace-nowrap rounded-md border border-slate-500 px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary';
// Buttons show the focus ring for the keyboard only (focus-visible): after a
// click it would just be a second outline saying nothing new.
const rowButton =
  'inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary';

const fullName = (member) => [member.firstName, member.lastName].filter(Boolean).join(' ');
const EMPTY_FORM = { name: '', email: '', github: '' };

/**
 * Name, email and GitHub fields, used both to add someone and to edit them.
 * Same fields, same order, same buttons in both, so there's one form to learn.
 * Editing adds "Remove from team" (onRemove), at the far end from Save so the
 * two are hard to mix up, and the person's avatar beside the heading, so you
 * can see who you're changing. The form sits in its own grey box (common
 * region), so it reads as one thing, separate from the list around it.
 */
function MemberForm({ heading, submitLabel, initial, takenNames, onSubmit, onCancel, onRemove, avatarName, onDirtyChange }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const nameRef = useRef(null);
  const headingId = `${heading.replace(/\W+/g, '-').toLowerCase()}-title`;

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Tells the window whether closing now would lose something typed.
  const isDirty = Object.keys(initial).some((field) => form[field].trim() !== initial[field].trim());
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim().replace(/\s+/g, ' ');
    if (takenNames.some((taken) => taken.toLowerCase() === name.toLowerCase())) {
      setError('Someone on the team already has this name. Add a surname or initial.');
      nameRef.current?.focus();
      return;
    }
    const [firstName, ...rest] = name.split(' ');
    onSubmit({
      firstName,
      lastName: rest.join(' '),
      email: form.email.trim(),
      github: form.github.trim().replace(/^@/, ''),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby={headingId}
      className="space-y-4 rounded-lg border border-slate-300 bg-surface-page p-4"
    >
      <div className="flex items-center gap-3">
        {avatarName && <Avatar name={avatarName} size="lg" />}
        <h3 id={headingId} className="text-base font-semibold text-text-primary">{heading}</h3>
      </div>
      <div>
        <label htmlFor="member-name" className={labelClass}>
          Name <span className="font-normal text-text-muted">(required)</span>
        </label>
        <input
          id="member-name"
          ref={nameRef}
          required
          autoComplete="off"
          value={form.name}
          onChange={(event) => {
            setError('');
            update('name')(event);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'member-name-error' : undefined}
          className={`${inputClass} ${error ? 'border-due-overdue' : ''}`}
        />
        {error && (
          <p id="member-name-error" className="mt-1 text-sm text-due-overdue">{error}</p>
        )}
      </div>

      <div>
        <label htmlFor="member-email" className={labelClass}>
          Email <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <input
          id="member-email"
          type="email"
          autoComplete="off"
          value={form.email}
          onChange={update('email')}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="member-github" className={labelClass}>
          GitHub username <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <input
          id="member-github"
          autoComplete="off"
          spellCheck={false}
          value={form.github}
          onChange={update('github')}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          className="min-h-11 whitespace-nowrap rounded-md border border-transparent bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancel
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={`${rowButton} -mr-3 ml-auto text-due-overdue hover:bg-due-overdue-bg`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remove from team
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * The team (DR2, M7): who's on it and how to reach them. What each person
 * is working on is already on the board (owner on every card), so it isn't repeated here.
 * One job at a time: the window opens as the list; "+ Add a member" opens the
 * form at the bottom, and Edit swaps that person's row for the same form, right
 * where they are (proximity), so you never lose track of who you're changing.
 * Remove is inside Edit and asks first (ConfirmDialog) and says what happens to their tasks: they
 * stay on the board as Unassigned, so no work disappears. The last person
 * can't be removed, because every task needs someone to hand off to.
 * × is the only way to close, so no button means two things.
 * Only the name is needed to assign tasks, so it's the one required field.
 * Names must be unique because `Task.assignee` stores the name; App renames
 * the tasks too when a name changes.
 * Same dialog behaviour as the task modal: focus moves in, Escape closes,
 * focus goes back to the button that opened it. Also the same rule for unsaved
 * changes: if a form has something typed, Cancel, ×, Escape and clicking outside
 * ask "Discard changes?" first; with nothing typed they just close. Asking only
 * when something would be lost keeps the question meaningful, so it isn't
 * clicked past out of habit.
 */
export default function TeamModal({ team, tasks, onAdd, onUpdate, onRemove, onClose }) {
  const members = team.map(fullName);
  const [status, setStatus] = useState('');
  // What the window is doing: null (the list), 'add', or the id of the person being edited.
  const [mode, setMode] = useState(null);
  const [removing, setRemoving] = useState(null);
  const cancelRemove = useCallback(() => setRemoving(null), []);
  const [formDirty, setFormDirty] = useState(false);
  // What a "Discard changes?" answer would close: null, 'form' or 'window'.
  const [discarding, setDiscarding] = useState(null);
  const cancelDiscard = useCallback(() => setDiscarding(null), []);
  const addButtonRef = useRef(null);
  const headingRef = useRef(null);
  // Whose Edit button gets focus back when a form closes (null: "+ Add a member").
  const returnFocus = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    headingRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !event.isComposing) requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Focus follows the switch back to the list, so keyboard and screen reader
  // users land where the change happened.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (mode !== null) return;
    const editButton = returnFocus.current && document.getElementById(`edit-member-${returnFocus.current}`);
    (editButton ?? addButtonRef.current ?? headingRef.current)?.focus();
  }, [mode]);

  const openForm = (nextMode) => {
    returnFocus.current = nextMode === 'add' ? null : nextMode;
    setStatus('');
    setMode(nextMode);
  };

  const closeForm = () => {
    setFormDirty(false);
    setMode(null);
  };
  const requestClose = () => (mode !== null && formDirty ? setDiscarding('window') : onClose());
  const requestCancel = () => (formDirty ? setDiscarding('form') : closeForm());

  const taskCount = (name) => tasks.filter((task) => task.assignee === name).length;

  const confirmRemove = () => {
    const name = fullName(removing);
    const count = taskCount(name);
    onRemove(removing.id);
    setRemoving(null);
    returnFocus.current = null;
    setMode(null);
    setStatus(count ? `${name} removed. Their tasks are now unassigned.` : `${name} removed.`);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && requestClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-modal-title"
        inert={removing || discarding ? '' : undefined}
        className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-surface-card shadow-xl"
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-4">
          <h2 id="member-modal-title" ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-text-primary focus:outline-none">Team</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-md text-xl leading-none text-text-muted hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            ×
          </button>
        </div>

        <ul className={`divide-y divide-slate-200 px-6 ${mode !== null && mode !== 'add' ? 'pb-3' : ''}`}>
          {team.map((member, index) => {
            const name = members[index];
            if (mode === member.id) {
              return (
                <li key={member.id} className="py-3">
                  <MemberForm
                    avatarName={name}
                    heading={`Edit ${name}`}
                    submitLabel="Save changes"
                    initial={{ name, email: member.email ?? '', github: member.github ?? '' }}
                    takenNames={members.filter((other) => other !== name)}
                    onSubmit={(fields) => {
                      onUpdate(member.id, fields);
                      setStatus('Changes saved.');
                      closeForm();
                    }}
                    onCancel={requestCancel}
              onDirtyChange={setFormDirty}
                    onRemove={team.length > 1 ? () => setRemoving(member) : undefined}
                  />
                </li>
              );
            }
            const contact = [member.email, member.github && `@${member.github}`].filter(Boolean).join(' · ');
            return (
              <li key={member.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <Avatar name={name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-text-primary">{name}</p>
                  {contact && <p className="truncate text-sm text-text-muted">{contact}</p>}
                </div>
                {/* One quiet Edit per person, like Copy Context on the cards. Remove
                    lives inside Edit (as Delete task does in the task window), so the
                    list isn't a column of red buttons pulling the eye away from the names.
                    On phones it drops under the name, so names and emails aren't cut off. */}
                {/* While a form is open the other Edits are hidden, not greyed out:
                    faded buttons look broken and still pull the eye. One job at a time. */}
                {mode === null && (
                  <div className="-ml-3 flex basis-full pl-12 sm:-mr-3 sm:ml-0 sm:basis-auto sm:pl-0">
                    <button
                      type="button"
                      id={`edit-member-${member.id}`}
                      onClick={() => openForm(member.id)}
                      className={`${rowButton} text-brand-primary`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit<span className="sr-only"> {name}</span>
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Hidden while someone is being edited (only the status line stays, for
            screen readers), so "+ Add a member" doesn't compete with the open form. */}
        <div className={mode !== null && mode !== 'add' ? 'sr-only' : 'border-t border-slate-200 px-6 pb-6 pt-4'}>
          {/* Inline, not a toast, so nothing covers the dialog.
              Always rendered, so screen readers announce the change. */}
          <p role="status" className={`text-sm text-text-muted ${status ? 'mb-3' : ''}`}>
            {status}
          </p>

          {mode === 'add' ? (
            <MemberForm
              heading="Add a member"
              submitLabel="Add member"
              initial={EMPTY_FORM}
              takenNames={members}
              onSubmit={(fields) => {
                onAdd(fields);
                setStatus(`${[fields.firstName, fields.lastName].filter(Boolean).join(' ')} added to the team.`);
                closeForm();
              }}
              onCancel={requestCancel}
              onDirtyChange={setFormDirty}
            />
          ) : mode === null && (
            <button
              type="button"
              ref={addButtonRef}
              onClick={() => openForm('add')}
              className={secondaryButton}
            >
              <span aria-hidden="true">+ </span>Add a member
            </button>
          )}
        </div>
      </div>

      {discarding && (
        <ConfirmDialog
          title="Discard changes?"
          message="What you've typed won't be saved."
          cancelLabel="Keep editing"
          confirmLabel="Discard"
          onCancel={cancelDiscard}
          onConfirm={() => {
            setDiscarding(null);
            if (discarding === 'window') onClose();
            else closeForm();
          }}
        />
      )}
      {removing && (
        <ConfirmDialog
          title={`Remove ${fullName(removing)}?`}
          message={
            taskCount(fullName(removing))
              ? `They'll be taken off the team. Their tasks stay on the board as Unassigned.`
              : `They'll be taken off the team.`
          }
          confirmLabel="Remove"
          onCancel={cancelRemove}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
