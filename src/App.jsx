import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import AnchorBoard, { DELIVERABLES } from './components/AnchorBoard.jsx';
import Board from './components/Board.jsx';
import BoardToolbar, { sortTasks } from './components/BoardToolbar.jsx';
import TaskModal from './components/TaskModal.jsx';
import { Users } from 'lucide-react';
import TeamModal from './components/TeamModal.jsx';
import Toast from './components/Toast.jsx';
import { SEED_ANCHORS, SEED_TASKS } from './data/seed.js';

/**
 * Vibecoding Project Tracker: a Kanban board for vibecoding projects, where
 * every task keeps the context you need to pick it up again in any AI tool.
 *
 * Where each milestone lives:
 *   - M4  data-model    : the Task shape below, STAGES, and Board.jsx + TaskCard.jsx.
 *   - M5  crud-modal    : TaskModal.jsx (add, edit, delete), saved with useLocalStorage.
 *   - M6  tag-style     : TypeBadge.jsx (feature vs. bug colour + icon, card stripe).
 *   - M7  task-owner    : Avatar on every card; "Hand off to…" in the modal; acknowledgeHandOff.
 *   - M8  due-tint      : DueLabel.jsx (four due states) and useToday().
 *   - M9  task-context  : the Context sidebar in TaskModal.jsx (template, AI tool, "Updated"),
 *                         with a live Markdown preview (MarkdownPreview.jsx, the stretch goal).
 *   - M10 copy-context  : CopyContextButton.jsx (on every card and in the modal) + the
 *                         "Copied to clipboard" toast (the stretch goal).
 *   - M11 project-deliverables : AnchorBoard.jsx, pinned above the board.
 *   - Extras: BoardToolbar.jsx (owner/type filters, sort), TeamModal.jsx, ConfirmDialog.jsx.
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
 * @property {string} [context]        M9: Markdown briefing for whoever picks it up next
 * @property {string} [contextTool]    M9: AI tool the context came from, '' if none
 * @property {string|null} [contextUpdatedAt]  M9: ISO date-time of the last context change
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

export const fullName = (member) => [member.firstName, member.lastName].filter(Boolean).join(' ');

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
    // M9: stamp the context only when it, or its AI tool, actually changed.
    const before = editing === 'new' ? {} : editing;
    const contextChanged =
      fields.context !== (before.context ?? '') || fields.contextTool !== (before.contextTool ?? '');
    const contextUpdatedAt = contextChanged ? new Date().toISOString() : before.contextUpdatedAt ?? null;

    if (editing === 'new') {
      setTasks([...tasks, { ...fields, contextUpdatedAt, id: newId(), createdDate: todayISO() }]);
    } else {
      setTasks(tasks.map((task) => (task.id === editing.id ? { ...task, ...fields, contextUpdatedAt } : task)));
      if (fields.assignee !== editing.assignee) acknowledgeHandOff(editing.id, fields.assignee);
    }
    setEditing(null);
  };

  const deleteTask = (id) => {
    const { title } = tasks.find((task) => task.id === id);
    setTasks(tasks.filter((task) => task.id !== id));
    setEditing(null);
    showToast(`Deleted "${title}".`);
    // The card that opened the modal is gone, so focus goes to the board, not lost on the page.
    requestAnimationFrame(() => document.getElementById('board')?.focus());
  };

  // M7: toast + a brief ring on the card acknowledge a handoff.
  const [toast, setToast] = useState({ message: '', visible: false });
  const [highlightId, setHighlightId] = useState(null);
  const timers = useRef([]);

  function showToast(message) {
    setToast({ message, visible: true });
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => setHighlightId(null), 1500),
      // 5 seconds, so slower readers can finish the longer messages.
      setTimeout(() => setToast((current) => ({ ...current, visible: false })), 5000),
      setTimeout(() => setToast({ message: '', visible: false }), 5200),
    ];
  }

  // Saving with a new Owner is a handoff (M7.1): ring the card and show a toast.
  function acknowledgeHandOff(id, name) {
    setHighlightId(id);
    showToast(`Handed off to ${name}.`);
  }

  // M10: the brief's wording, plus the next step. Says so when there's no context
  // yet, and if the browser blocks the clipboard, says what to do instead.
  const acknowledgeCopy = useCallback((ok, hasContext) => {
    if (!ok) showToast("Couldn't copy. Open the task and copy the Context by hand.");
    else if (!hasContext) showToast('Copied, but this task has no context yet.');
    else showToast('Copied to clipboard. Paste it into any AI tool to carry on.');
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Team (DR2): starts as the mock TEAM, and anyone added is saved like the tasks.
  const [team, setTeam] = useLocalStorage('vibetracker.team', TEAM);
  const members = team.map(fullName);
  const [teamOpen, setTeamOpen] = useState(false);
  const closeTeam = useCallback(() => setTeamOpen(false), []);

  const addMember = (fields) => {
    const member = { ...fields, id: newId() };
    setTeam([...team, member]);
    // No toast here: it would cover the dialog's buttons. The Team dialog says it inline.
  };

  // Picking a teammate shows only their tasks; null ("Everyone") shows all.
  const [focusName, setFocusName] = useState(null);
  const [typeId, setTypeId] = useState(null);
  const [sortId, setSortId] = useState('due');
  const filtered = tasks.filter((task) => (!focusName || task.assignee === focusName) && (!typeId || task.type === typeId));
  const visibleTasks = sortTasks(filtered, sortId);
  const clearFilters = () => {
    setFocusName(null);
    setTypeId(null);
  };

  // M7.1: while the modal is open, the page behind it is inert, so Tab and
  // screen readers stay inside the dialog. A layout effect, so the page is
  // live again before the modal hands focus back to the card that opened it.
  const pageRef = useRef(null);
  useLayoutEffect(() => {
    if (pageRef.current) pageRef.current.inert = editing != null || teamOpen;
  }, [editing, teamOpen]);

  // M11: one link per deliverable, saved like the tasks so it survives a reload.
  const [anchors, setAnchors] = useLocalStorage('vibetracker.anchors', SEED_ANCHORS);

  const saveAnchor = (id, url) => {
    setAnchors((current) => ({ ...current, [id]: url }));
    const { label } = DELIVERABLES.find((deliverable) => deliverable.id === id);
    showToast(url ? `${label} link saved.` : `${label} link removed.`);
  };

  return (
    <div className="min-h-screen bg-surface-page font-sans">
      <div ref={pageRef} className="p-4 sm:p-8">
        <a
          href="#board"
          className="sr-only rounded-md bg-brand-primary px-4 py-3 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        >
          Skip to board
        </a>

        <header className="-mx-4 -mt-4 mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-slate-200 bg-surface-card px-4 py-3 sm:-mx-8 sm:-mt-8 sm:px-8">
          {/* Logo top left, linked home, as people expect. The mark is a mini
              board (columns of cards), so it says what the tool is. It keeps
              its colours in high-contrast mode, or the white mark would vanish. */}
          <a
            href="/"
            className="inline-flex items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary forced-color-adjust-none">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden="true">
                <rect x="3" y="4" width="5" height="4" rx="1" />
                <rect x="3" y="10" width="5" height="4" rx="1" />
                <rect x="3" y="16" width="5" height="4" rx="1" />
                <rect x="9.5" y="4" width="5" height="4" rx="1" />
                <rect x="9.5" y="10" width="5" height="4" rx="1" />
                <rect x="16" y="4" width="5" height="4" rx="1" />
              </svg>
            </span>
            <h1 className="text-xl font-semibold text-brand-primary sm:text-2xl">
              Vibecoding Project Tracker
              <span className="sr-only">, home</span>
            </h1>
          </a>
          {/* The team lives in its own dialog, so the board keeps the prime space. */}
          <button
            type="button"
            onClick={() => setTeamOpen(true)}
            className="ml-auto flex min-h-11 items-center gap-2 rounded-md border border-slate-500 bg-surface-card px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            <Users className="h-4 w-4 text-text-muted" aria-hidden="true" />
            Team
            <span className="text-text-muted">
              {members.length}
              <span className="sr-only"> people</span>
            </span>
          </button>
        </header>

        {/* Everything below the header is the page's main content, so a screen
            reader's "jump to main" lands on Deliverables, not halfway down. */}
        <main>
          <AnchorBoard anchors={anchors} onSave={saveAnchor} />

          <BoardToolbar
            onNewTask={() => setEditing('new')}
            members={members}
            focusName={focusName}
            onFocus={setFocusName}
            typeId={typeId}
            onType={setTypeId}
            onClear={clearFilters}
            sortId={sortId}
            onSort={setSortId}
          />

          <Board
            stages={STAGES}
            tasks={visibleTasks}
            today={today}
            highlightId={highlightId}
            onOpenTask={setEditing}
            onCopied={acknowledgeCopy}
            emptyText={focusName || typeId ? 'No matching tasks here' : undefined}
          />
        </main>
      </div>

      {editing && (
        <TaskModal
          task={editing === 'new' ? null : editing}
          stages={STAGES}
          members={members}
          onSave={saveTask}
          onDelete={deleteTask}
          onClose={closeModal}
          onCopied={acknowledgeCopy}
        />
      )}

      {teamOpen && <TeamModal team={team} onAdd={addMember} onClose={closeTeam} />}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
