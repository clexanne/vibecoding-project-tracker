import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import Board from './components/Board.jsx';
import TaskModal from './components/TaskModal.jsx';
import TeamStrip from './components/TeamStrip.jsx';
import Toast from './components/Toast.jsx';
import { SEED_TASKS } from './data/seed.js';

/**
 * Vibecoding Project Tracker — starter scaffold.
 *
 * This file is intentionally almost empty. The boilerplate (Vite, React,
 * Tailwind) is configured for you, plus a few shared constants and a
 * localStorage helper. Everything visible on screen, you build.
 *
 * Where to start (build sequence in Phase 3):
 *   - M4  data-model    : render the four columns and the task cards below.
 *   - M5  crud-modal    : add the "+" button modal and the edit-on-click modal.
 *   - M6  tag-style     : feature vs. bug color coding (uses DESIGN.md §2 colors).
 *   - M7  task-owner    : assignee badge + "Hand off to..." (the Owner field in the modal since M7.1).
 *   - M8  due-tint      : color cards by due date (uses DESIGN.md §2 due-state colors).
 *   - M9  context       : a curated Context briefing field on the modal.
 *   - M10 copy-prompt   : a "Copy as Prompt Context" button that serializes the task + context.
 *   - M11 anchors       : the Anchor Board above the Kanban.
 *   - M12 secret-sauce  : the one open-ended thing that makes your tracker yours.
 *
 * Search the file for `TODO M<n>` to find the right hook for each milestone.
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {'feature'|'bug'} type
 * @property {'todo'|'in-progress'|'review'|'done'} status
 * @property {string} assignee
 * @property {string|null} dueDate     ISO 'YYYY-MM-DD'
 * @property {string} createdDate      ISO 'YYYY-MM-DD'
 */

// The four columns of the board, in render order.
// Use these IDs everywhere — do not invent new ones.
export const STAGES = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review',      label: 'Review' },
  { id: 'done',        label: 'Done' },
];

// Mock team members (PRD §8 / DR2). `Task.assignee` stores a member's full name,
// so fullName(member) gives the only valid values for `Task.assignee`.
export const TEAM = [
  { id: 'u1', firstName: 'Alex',   lastName: 'Morgan', email: 'alex.morgan@example.com' },
  { id: 'u2', firstName: 'Sam',    lastName: 'Patel',  email: 'sam.patel@example.com' },
  { id: 'u3', firstName: 'Jordan', lastName: 'Lee',    email: 'jordan.lee@example.com' },
];

export const fullName = (member) => `${member.firstName} ${member.lastName}`;

// Today as 'YYYY-MM-DD' in local time (toISOString would give the UTC date).
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Today's date that keeps itself current (M8): rechecks every minute and when
 * the tab comes back into view, so due tints change at midnight on their own.
 */
function useToday() {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const refresh = () => setToday(todayISO());
    const timer = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return today;
}

// Unique string id; falls back to a timestamp where crypto.randomUUID is unavailable.
const newId = () => globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}`;

/**
 * A tiny localStorage hook — survives reloads, no library needed.
 *
 * Usage:
 *   const [tasks, setTasks] = useLocalStorage('vibetracker.tasks', []);
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private-mode error — silently ignore for hackathon */
    }
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  const [tasks, setTasks] = useLocalStorage('vibetracker.tasks', SEED_TASKS);
  const today = useToday();

  // null = modal closed, 'new' = creating, otherwise the task being edited.
  const [editing, setEditing] = useState(null);
  const closeModal = useCallback(() => setEditing(null), []);

  const saveTask = (fields) => {
    if (editing === 'new') {
      setTasks([...tasks, { ...fields, id: newId(), createdDate: todayISO() }]);
    } else {
      setTasks(tasks.map((task) => (task.id === editing.id ? { ...task, ...fields } : task)));
      if (fields.assignee !== editing.assignee) acknowledgeHandOff(editing.id, fields.assignee);
    }
    setEditing(null);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
    setEditing(null);
  };

  // M7: toast + a brief ring on the card acknowledge a handoff.
  const [toast, setToast] = useState({ message: '', visible: false });
  const [highlightId, setHighlightId] = useState(null);
  const timers = useRef([]);

  // Saving with a new Owner is a handoff (M7.1): ring the card and show a toast.
  function acknowledgeHandOff(id, name) {
    setHighlightId(id);
    setToast({ message: `Handed off to ${name}. Their context is ready.`, visible: true });
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => setHighlightId(null), 1500),
      setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3000),
      setTimeout(() => setToast({ message: '', visible: false }), 3200),
    ];
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const members = TEAM.map(fullName);

  // M7.1: while the modal is open, the page behind it is inert, so Tab and
  // screen readers stay inside the dialog. A layout effect, so the page is
  // live again before the modal hands focus back to the card that opened it.
  const pageRef = useRef(null);
  useLayoutEffect(() => {
    if (pageRef.current) pageRef.current.inert = editing != null;
  }, [editing]);

  // TODO M11 anchors:
  //   const [anchors, setAnchors] = useLocalStorage('vibetracker.anchors', [...]);

  return (
    <div className="min-h-screen bg-surface-page font-sans">
      <div ref={pageRef} className="p-4 sm:p-8">
        <a
          href="#board"
          className="sr-only rounded-md bg-brand-primary px-4 py-3 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        >
          Skip to board
        </a>

        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-brand-primary">
              Vibecoding Project Tracker
            </h1>
            <p className="text-sm text-text-muted">
              Every task, and the prompt behind it, in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="min-h-11 rounded-md bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            + New task
          </button>
        </header>

        {/* TODO M11 anchors: render the Anchor Board (Presentation / Demo / Report / Documentation) above the board. */}

        <TeamStrip members={members} tasks={tasks} />

        <Board
          stages={STAGES}
          tasks={tasks}
          today={today}
          highlightId={highlightId}
          onOpenTask={setEditing}
        />
      </div>

      {editing && (
        <TaskModal
          task={editing === 'new' ? null : editing}
          stages={STAGES}
          members={members}
          onSave={saveTask}
          onDelete={deleteTask}
          onClose={closeModal}
        />
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
