import { useEffect, useRef, useState } from 'react';
import { Avatar } from './TaskCard.jsx';

const inputClass =
  'mt-1.5 min-h-11 w-full rounded-md border border-slate-500 bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary';
const labelClass = 'block text-sm font-medium text-text-primary';

/**
 * The team (DR2, M7): who's on it and how to reach them. What each person
 * is working on is already on the board (owner on every card), so it isn't repeated here.
 * One job at a time: the window opens as the list, and the add form only
 * appears after "+ Add a member", with its own buttons right under its fields.
 * × is the only way to close, so no button means two things.
 * Only the name is needed to assign tasks, so it's the one required field.
 * Names must be unique because `Task.assignee` stores the name.
 * Same dialog behaviour as the task modal: focus moves in, Escape closes,
 * focus goes back to the button that opened it.
 */
export default function TeamModal({ team, onAdd, onClose }) {
  const members = team.map((member) => [member.firstName, member.lastName].filter(Boolean).join(' '));
  const [form, setForm] = useState({ name: '', email: '', github: '' });
  const [error, setError] = useState('');
  const [added, setAdded] = useState('');
  const [adding, setAdding] = useState(false);
  const nameRef = useRef(null);
  const addButtonRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    headingRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !event.isComposing) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Focus follows the switch between list and form, so keyboard and screen
  // reader users land where the change happened.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    (adding ? nameRef : addButtonRef).current?.focus();
  }, [adding]);

  const closeForm = () => {
    setForm({ name: '', email: '', github: '' });
    setError('');
    setAdding(false);
  };

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim().replace(/\s+/g, ' ');
    if (members.some((member) => member.toLowerCase() === name.toLowerCase())) {
      setError('Someone on the team already has this name. Add a surname or initial.');
      nameRef.current?.focus();
      return;
    }
    const [firstName, ...rest] = name.split(' ');
    onAdd({
      firstName,
      lastName: rest.join(' '),
      email: form.email.trim(),
      github: form.github.trim().replace(/^@/, ''),
    });
    setAdded(name);
    closeForm();
  };

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-modal-title"
        className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-surface-card shadow-xl"
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-4">
          <h2 id="member-modal-title" ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-text-primary focus:outline-none">Team</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-md text-xl leading-none text-text-muted hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            ×
          </button>
        </div>

        <ul className="divide-y divide-slate-200 px-6">
          {team.map((member, index) => {
            const name = members[index];
            const contact = [member.email, member.github && `@${member.github}`].filter(Boolean).join(' · ');
            return (
              <li key={member.id} className="flex items-start gap-3 py-3">
                <Avatar name={name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-text-primary">{name}</p>
                  {contact && <p className="truncate text-sm text-text-muted">{contact}</p>}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-slate-200 px-6 pb-6 pt-4">
          {/* Inline, not a toast, so nothing covers the dialog.
              Always rendered, so screen readers announce the change. */}
          <p role="status" className={`text-sm text-text-muted ${added ? 'mb-3' : ''}`}>
            {added && `${added} added to the team.`}
          </p>

          {adding ? (
            <form onSubmit={handleSubmit} aria-labelledby="add-member-title" className="space-y-4">
              <h3 id="add-member-title" className="text-base font-semibold text-text-primary">Add a member</h3>
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
                  className="min-h-11 whitespace-nowrap rounded-md border border-transparent bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                >
                  Add member
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="min-h-11 whitespace-nowrap rounded-md border border-slate-500 px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              ref={addButtonRef}
              onClick={() => {
                setAdded('');
                setAdding(true);
              }}
              className="min-h-11 whitespace-nowrap rounded-md border border-slate-500 px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <span aria-hidden="true">+ </span>Add a member
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
