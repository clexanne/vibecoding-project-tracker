import { useState } from 'react';
import { ChevronsLeft, ChevronsRight, Circle, CircleCheck, CircleDot, Eye } from 'lucide-react';
import TaskCard from './TaskCard.jsx';

// Whether Done is collapsed, remembered per browser like a column you folded in Jira or Trello.
// A status icon per column, like GitHub's issue states: the shape says the stage
// (empty, started, being checked, finished), so it doesn't need a colour of its
// own. Colour stays reserved for task type and due date.
const STAGE_ICONS = { todo: Circle, 'in-progress': CircleDot, review: Eye, done: CircleCheck };

const DONE_KEY = 'vibetracker.doneCollapsed';
const readCollapsed = () => {
  try {
    return window.localStorage.getItem(DONE_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * The four-column Kanban board. One <section> per stage so screen readers
 * can jump between columns by heading. `id="board"` is the skip link's target.
 * Columns are a soft tint with no outline: the tint already groups each
 * column, so a border on top would just be one more box for the eye to parse.
 * Columns share one height, so the four stages read as one row. Empty columns
 * stay short, so blank space doesn't read as missing content.
 * On phones the columns would stack a long way down, so one column shows at a
 * time, picked with the buttons above it (each with its count).
 * M12: cards can be dragged to another column. The column under the pointer
 * turns indigo with a dashed outline (where it will land), and the card being
 * dragged fades, so you can see both ends of the move. Dragging needs a mouse
 * and a steady hand, so every card also has a "Move to" menu (WCAG 2.5.7);
 * on phones, where dragging doesn't work, that menu is the way to move.
 * Done can be collapsed: finished work piles up, and folding it gives the three
 * active columns more room on wide screens (on smaller ones it just hides the
 * cards). It still shows its count and still takes dropped cards.
 * My order: dropped on a card, a card lands just above or below it (whichever
 * half the pointer is over), shown by an indigo line in the gap. The column
 * only turns indigo when the card is coming from another column, so a
 * reorder shows one cue, not two. Without a mouse, "Up one" / "Down one" in
 * the card's menu do the same, one place at a time.
 */
export default function Board({ stages, tasks, today, highlightId, onOpenTask, onMove, onPlace, onCopied, emptyText = 'No tasks here yet' }) {
  const [phoneStage, setPhoneStage] = useState(stages[0].id);
  const count = (stageId) => tasks.filter((task) => task.status === stageId).length;
  const [draggingId, setDraggingId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  // Where a dragged card would land among the cards: 'id:before' or 'id:after'.
  const [dropSpot, setDropSpot] = useState(null);
  const draggingFrom = tasks.find((task) => task.id === draggingId)?.status;
  const [doneCollapsed, setDoneCollapsed] = useState(readCollapsed);
  const toggleDone = () => {
    setDoneCollapsed(!doneCollapsed);
    try {
      window.localStorage.setItem(DONE_KEY, String(!doneCollapsed));
    } catch {
      /* private mode: it still works, it just isn't remembered */
    }
  };
  const endDrag = () => {
    setDraggingId(null);
    setOverStage(null);
    setDropSpot(null);
  };

  // The card under the pointer, and which half of it, decides the spot.
  const spotFor = (event) => {
    const card = event.target.closest?.('[data-task-id]');
    if (!card || card.dataset.taskId === draggingId) return null;
    const box = card.getBoundingClientRect();
    return `${card.dataset.taskId}:${event.clientY < box.top + box.height / 2 ? 'before' : 'after'}`;
  };

  return (
    <section id="board" tabIndex={-1} aria-label="Task board" className="focus:outline-none">
      <ul aria-label="Show column" className="mb-3 grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 sm:hidden">
        {stages.map((stage) => {
          const pressed = phoneStage === stage.id;
          return (
            <li key={stage.id}>
              <button
                type="button"
                aria-pressed={pressed}
                onClick={() => setPhoneStage(stage.id)}
                className={`flex min-h-11 w-full flex-col items-center justify-center rounded-md px-1 text-xs font-medium leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  pressed ? 'bg-surface-card text-brand-primary shadow-sm ring-1 ring-brand-primary' : 'text-text-muted'
                }`}
              >
                {stage.label}
                <span className="font-semibold">
                  <span className="sr-only">, number of tasks: </span>
                  {count(stage.id)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${doneCollapsed ? 'xl:grid-cols-[repeat(3,minmax(0,1fr))_11rem]' : 'xl:grid-cols-4'}`}>
        {stages.map((stage) => {
          const columnTasks = tasks.filter((task) => task.status === stage.id);
          const headingId = `column-${stage.id}`;
          const StageIcon = STAGE_ICONS[stage.id];
          const listId = `column-list-${stage.id}`;
          const collapsible = stage.id === 'done';
          const collapsed = collapsible && doneCollapsed;
          const isTarget = overStage === stage.id && draggingFrom !== stage.id;

          return (
            <section
              key={stage.id}
              aria-labelledby={headingId}
              onDragOver={(event) => {
                if (!draggingId) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setOverStage(stage.id);
                setDropSpot(spotFor(event));
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget)) return;
                setOverStage(null);
                setDropSpot(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const [spotId, side] = dropSpot?.split(':') ?? [];
                if (draggingId && spotId) onPlace(draggingId, stage.id, { [side]: spotId });
                else if (draggingId) onMove(draggingId, stage.id);
                endDrag();
              }}
              className={`flex-col rounded-lg border p-4 sm:flex ${phoneStage === stage.id ? 'flex' : 'hidden'} ${
                isTarget ? 'border-transparent bg-brand-accent outline-dashed outline-2 -outline-offset-2 outline-brand-primary' : 'border-slate-300 bg-slate-50'
              }`}
            >
              <div className="mb-4 flex items-center gap-2">
                <h2 id={headingId} className="flex flex-1 items-center justify-between gap-2 text-lg font-semibold text-text-primary">
                  <span className="flex items-center gap-2">
                    <StageIcon className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
                    {stage.label}
                  </span>
                  <span className="min-w-7 rounded-full bg-slate-200/70 px-2.5 py-0.5 text-center text-sm font-medium text-text-muted">
                    <span className="sr-only">, number of tasks: </span>
                    {columnTasks.length}
                  </span>
                </h2>
                {/* Not on phones, where only one column shows anyway. A word, not just ">>",
                    so nobody has to guess what it does; the icon points where the column goes.
                    Negative margins keep the 44px target without making this header taller. */}
                {collapsible && (
                  <button
                    type="button"
                    aria-expanded={!collapsed}
                    aria-controls={listId}
                    onClick={toggleDone}
                    className="-my-2 -mr-2 hidden h-11 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-sm font-medium text-text-muted hover:bg-surface-card hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary sm:inline-flex"
                  >
                    {collapsed ? 'Show' : 'Hide'}
                    <span className="sr-only"> Done tasks</span>
                    {collapsed ? <ChevronsLeft className="h-4 w-4" aria-hidden="true" /> : <ChevronsRight className="h-4 w-4" aria-hidden="true" />}
                  </button>
                )}
              </div>

              {/* Collapsed: says what's folded away, so it doesn't look like Done is empty. */}
              {collapsed && columnTasks.length > 0 && (
                <p className="hidden text-sm text-text-muted sm:block">
                  {columnTasks.length === 1 ? '1 task hidden' : `${columnTasks.length} tasks hidden`}
                </p>
              )}

              {columnTasks.length > 0 ? (
                <ul id={listId} className={`flex flex-col gap-4 ${collapsed ? 'sm:hidden' : ''}`}>
                  {columnTasks.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      today={today}
                      statusLabel={stage.label}
                      stages={stages}
                      highlighted={task.id === highlightId}
                      dragging={task.id === draggingId}
                      dropSide={dropSpot?.startsWith(`${task.id}:`) ? dropSpot.split(':')[1] : null}
                      prevId={columnTasks[i - 1]?.id}
                      nextId={columnTasks[i + 1]?.id}
                      onOpen={onOpenTask}
                      onMove={onMove}
                      onPlace={onPlace}
                      onDragStart={() => setDraggingId(task.id)}
                      onDragEnd={endDrag}
                      onCopied={onCopied}
                    />
                  ))}
                </ul>
              ) : (
                <p
                  id={listId}
                  className={`flex min-h-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-text-muted ${collapsed ? 'sm:hidden' : ''}`}
                >
                  {emptyText}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
