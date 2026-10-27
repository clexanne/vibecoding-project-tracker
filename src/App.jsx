import { LogOut, Users } from 'lucide-react';
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import AnchorBoard, { DELIVERABLES } from './components/AnchorBoard.jsx';
import Board from './components/Board.jsx';
import SignIn from './components/SignIn.jsx';
import { Avatar } from './components/TaskCard.jsx';
import BoardToolbar, { sortTasks } from './components/BoardToolbar.jsx';
import TaskModal from './components/TaskModal.jsx';
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
 *   - M12 secret-sauce  : drag a card to another column, or use its "Move to" menu
 *                         (Board.jsx, TaskCard.jsx), or drag it up or down for "Custom order";
 *                         moves and deletes can be undone
 *                         from the toast; the Done column can be collapsed.
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
  { id: 'u2', firstName: 'Sara',   lastName: 'Patel',  email: 'sara.patel@example.com' },
  { id: 'u3', firstName: 'Jordan', lastName: 'Lee',    email: 'jordan.lee@example.com' },
  { id: 'u4', firstName: 'Maya',   lastName: 'Chen',   email: 'maya.chen@example.com' },
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

  // Focus a card's main button after the board re-renders (it may have changed column),
  // or the board itself if that card isn't on screen (filtered out, or another phone column).
  const focusCard = (id) =>
    requestAnimationFrame(() => {
      const card = document.getElementById(`open-${id}`);
      (card?.offsetParent ? card : document.getElementById('board'))?.focus();
    });

  // Deleting doesn't ask first: it happens, and the toast offers Undo instead.
  // Focus goes to Undo, since the card that opened the modal is gone.
  const deleteTask = (id) => {
    const index = tasks.findIndex((task) => task.id === id);
    const removed = tasks[index];
    setTasks(tasks.filter((task) => task.id !== id));
    setEditing(null);
    showToast(`Deleted "${removed.title}".`, {
      label: 'Undo',
      onClick: () => {
        setTasks((current) => [...current.slice(0, index), removed, ...current.slice(index)]);
        setHighlightId(id);
        showToast(`"${removed.title}" is back.`);
        focusCard(id);
      },
    });
    requestAnimationFrame(() => (toastActionRef.current ?? document.getElementById('board'))?.focus());
  };

  // M12: a card dragged to another column, or moved with its "Move to" menu.
  // In Custom order it goes to the bottom of its new column, like a new card would.
  const moveTask = (id, status) => {
    const index = tasks.findIndex((task) => task.id === id);
    const moved = tasks[index];
    if (!moved || moved.status === status) return;
    const from = moved.status;
    // Moved with the keyboard from its menu: keep focus on that menu in the card's new column.
    const fromMenu = document.activeElement?.id === `move-${id}`;
    setTasks(
      sortId === 'manual'
        ? [...tasks.filter((task) => task.id !== id), { ...moved, status }]
        : tasks.map((task) => (task.id === id ? { ...task, status } : task)),
    );
    setHighlightId(id);
    if (fromMenu) focusMenu(id);
    showToast(`Moved "${moved.title}" to ${STAGES.find((stage) => stage.id === status).label}.`, {
      label: 'Undo',
      onClick: () => {
        setTasks((current) => {
          const rest = current.filter((task) => task.id !== id);
          return [...rest.slice(0, index), { ...moved, status: from }, ...rest.slice(index)];
        });
        setHighlightId(id);
        showToast(`"${moved.title}" is back in ${STAGES.find((stage) => stage.id === from).label}.`);
        focusCard(id);
      },
    });
  };

  // Custom order: a card dropped at a spot between cards, or nudged with "Up one" /
  // "Down one". The board shows the tasks list in its saved order, so placing a
  // card moves it in that list, just before or after another card. If a sort was
  // on, the list takes that sort's order first, so no other card jumps.
  const placeTask = (id, status, { before, after } = {}) => {
    const moved = tasks.find((task) => task.id === id);
    if (!moved || id === before || id === after) return;
    const shown = sortTasks(tasks, sortId);
    const rest = shown.filter((task) => task.id !== id);
    const target = rest.findIndex((task) => task.id === (before ?? after));
    const index = target < 0 ? rest.length : before ? target : target + 1;
    const next = [...rest.slice(0, index), { ...moved, status }, ...rest.slice(index)];
    const ids = (list) => list.map((task) => task.id).join();
    if (moved.status === status && ids(next) === ids(shown)) return;

    const from = moved.status;
    const order = new Map(tasks.map((task, i) => [task.id, i]));
    const sortBefore = sortId;
    const fromMenu = document.activeElement?.id === `move-${id}`;
    setTasks(next);
    setSortId('manual');
    setHighlightId(id);
    if (fromMenu) focusMenu(id);
    const where = from === status ? 'Moved' : `Moved to ${STAGES.find((stage) => stage.id === status).label}:`;
    const switched = sortBefore === 'manual' ? '' : ' Sorted by Custom order.';
    showToast(`${where} "${moved.title}".${switched}`, {
      label: 'Undo',
      onClick: () => {
        setTasks((current) =>
          current
            .map((task) => (task.id === id ? { ...task, status: from } : task))
            .sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity)),
        );
        setSortId(sortBefore);
        setHighlightId(id);
        showToast(`"${moved.title}" is back where it was.`);
        focusCard(id);
      },
    });
  };

  // Keep focus on a card's menu after it moved, so the next key press acts on the same card.
  const focusMenu = (id) =>
    requestAnimationFrame(() => {
      const menu = document.getElementById(`move-${id}`);
      (menu?.offsetParent ? menu : document.getElementById('board'))?.focus();
    });

  // M7: toast + a brief ring on the card acknowledge a handoff (and moves).
  const [toast, setToast] = useState({ message: '', visible: false, action: null });
  const [highlightId, setHighlightId] = useState(null);
  const timers = useRef([]);
  const toastActionRef = useRef(null);

  // 5 seconds, so slower readers can finish the longer messages; 10 when there's
  // an Undo to reach.
  function hideToastIn(ms) {
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => setHighlightId(null), 1500),
      setTimeout(() => setToast((current) => ({ ...current, visible: false })), ms),
      setTimeout(() => setToast({ message: '', visible: false, action: null }), ms + 200),
    ];
  }

  function showToast(message, action = null) {
    setToast({ message, visible: true, action });
    hideToastIn(action ? 10_000 : 5000);
  }

  // While the pointer or focus is on the toast's Undo, it stays; leaving restarts the clock.
  const holdToast = () => timers.current.slice(1).forEach(clearTimeout);
  const releaseToast = () => hideToastIn(5000);

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

  // Mock sign-in: only the member's id is saved, so a renamed member stays
  // signed in under their new name. If they're removed, the lookup finds
  // nobody and the sign-in screen comes back.
  const [sessionId, setSessionId] = useLocalStorage('vibetracker.session', null);
  const currentUser = team.find((member) => member.id === sessionId) ?? null;
  const signOut = () => {
    setTeamOpen(false);
    setEditing(null);
    setSessionId(null);
  };
  // Also closes any dialog left open, e.g. after you remove yourself from the
  // team, so the next person starts on the board and not inside a dialog.
  const signIn = (id) => {
    setTeamOpen(false);
    setEditing(null);
    setSessionId(id);
  };

  const addMember = (fields) => {
    const member = { ...fields, id: newId() };
    setTeam([...team, member]);
    // No toast here: it would cover the dialog's buttons. The Team dialog says it inline.
  };

  // Tasks store the owner's name, so a new name is carried over to their tasks.
  const updateMember = (id, fields) => {
    const before = fullName(team.find((member) => member.id === id));
    const after = fullName(fields);
    setTeam(team.map((member) => (member.id === id ? { ...member, ...fields } : member)));
    if (after !== before) {
      setTasks(tasks.map((task) => (task.assignee === before ? { ...task, assignee: after } : task)));
      if (focusName === before) setFocusName(after);
    }
  };

  // Their tasks stay on the board, unassigned, so no work disappears with them.
  const removeMember = (id) => {
    const name = fullName(team.find((member) => member.id === id));
    setTeam(team.filter((member) => member.id !== id));
    setTasks(tasks.map((task) => (task.assignee === name ? { ...task, assignee: '' } : task)));
    if (focusName === name) setFocusName(null);
  };

  // Picking a teammate shows only their tasks; null ("Everyone") shows all.
  const [focusName, setFocusName] = useState(null);
  const [typeId, setTypeId] = useState(null);
  // Remembered, so an order you arranged is still showing after a reload.
  const [sortId, setSortId] = useLocalStorage('vibetracker.sort', 'due');
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

  // Nobody signed in: the sign-in screen replaces the whole board.
  if (!currentUser) return <SignIn team={team} onSignIn={signIn} />;

  return (
    <div className="min-h-screen bg-surface-page font-sans">
      <div ref={pageRef} className="p-4 sm:p-8">
        <a
          href="#board"
          className="sr-only rounded-md bg-brand-primary px-4 py-3 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        >
          Skip to board
        </a>

        <header className="-mx-4 -mt-4 mb-6 flex flex-wrap items-center gap-x-3 gap-y-3 sm:gap-x-8 border-b border-slate-200 bg-surface-card px-4 py-3 sm:-mx-8 sm:-mt-8 sm:px-8">
          {/* Logo top left, linked home, as people expect. The mark is a mini
              board (columns of cards), so it says what the tool is. It keeps
              its colours in high-contrast mode, or the white mark would vanish. */}
          <a
            href="/"
            className="inline-flex min-w-min flex-1 items-center gap-3 rounded-md sm:flex-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary forced-color-adjust-none">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden="true">
                <rect x="3" y="4" width="5" height="4" rx="1" />
                <rect x="3" y="10" width="5" height="4" rx="1" />
                <rect x="3" y="16" width="5" height="4" rx="1" />
                <rect x="9.5" y="4" width="5" height="4" rx="1" />
                <rect x="9.5" y="10" width="5" height="4" rx="1" />
                <rect x="16" y="4" width="5" height="4" rx="1" />
              </svg>
            </span>
            <h1 className="text-lg font-bold leading-tight text-brand-primary sm:text-2xl">
              Vibecoding Project Tracker
              <span className="sr-only">, home</span>
            </h1>
          </a>
          {/* The team lives in its own dialog, so the board keeps the prime space.
              Built like the toolbar controls (same height, corners and border), so it
              reads as a button at a glance (similarity). A people icon plus the word
              "Team" says what it opens, and the count says how many, like the column
              counts. No initials here: three circles in a box looked like decoration. */}
          {/* Who is signed in, with the same avatar as the cards so people recognise
              it. The name hides on narrow screens to keep the header on two rows;
              screen readers still hear it. */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Avatar name={fullName(currentUser)} />
            <span className="sr-only sm:not-sr-only text-sm font-medium text-text-primary">
              <span className="sr-only">Signed in as </span>
              {fullName(currentUser)}
            </span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-slate-500 bg-surface-card px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <LogOut className="h-5 w-5 text-brand-primary" aria-hidden="true" />
            Sign out
          </button>
          <button
            type="button"
            onClick={() => setTeamOpen(true)}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-slate-500 bg-surface-card px-4 text-sm font-semibold text-text-primary hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <Users className="h-5 w-5 text-brand-primary" aria-hidden="true" />
            Team
            <span className="min-w-7 rounded-full bg-slate-100 px-2 py-0.5 text-center text-sm font-medium text-text-muted">
              <span className="sr-only">, </span>
              {members.length}
              <span className="sr-only">{members.length === 1 ? ' person' : ' people'}</span>
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
            onMove={moveTask}
            onPlace={placeTask}
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

      {teamOpen && (
        <TeamModal
          team={team}
          tasks={tasks}
          onAdd={addMember}
          onUpdate={updateMember}
          onRemove={removeMember}
          onClose={closeTeam}
        />
      )}

      <Toast
        ref={toastActionRef}
        message={toast.message}
        visible={toast.visible}
        action={toast.action}
        onHold={holdToast}
        onRelease={releaseToast}
      />
    </div>
  );
}
