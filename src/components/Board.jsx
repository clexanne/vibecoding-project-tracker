import { useState } from 'react';
import TaskCard from './TaskCard.jsx';

/**
 * The four-column Kanban board. One <section> per stage so screen readers
 * can jump between columns by heading. `id="board"` is the skip link's target.
 * Columns are a soft tint with no outline: the tint already groups each
 * column, so a border on top would just be one more box for the eye to parse.
 * Columns share one height, so the four stages read as one row. Empty columns
 * stay short, so blank space doesn't read as missing content.
 * On phones the columns would stack a long way down, so one column shows at a
 * time, picked with the buttons above it (each with its count).
 */
export default function Board({ stages, tasks, today, highlightId, onOpenTask, onCopied, emptyText = 'No tasks here yet' }) {
  const [phoneStage, setPhoneStage] = useState(stages[0].id);
  const count = (stageId) => tasks.filter((task) => task.status === stageId).length;

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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => {
          const columnTasks = tasks.filter((task) => task.status === stage.id);
          const headingId = `column-${stage.id}`;

          return (
            <section
              key={stage.id}
              aria-labelledby={headingId}
              className={`flex-col rounded-xl bg-slate-100 p-4 sm:flex ${phoneStage === stage.id ? 'flex' : 'hidden'}`}
            >
              <h2
                id={headingId}
                className="mb-4 flex items-center justify-between text-lg font-semibold text-text-primary"
              >
                {stage.label}
                <span className="min-w-7 rounded-full bg-surface-card px-2.5 py-0.5 text-center text-sm font-medium text-text-muted">
                  <span className="sr-only">, number of tasks: </span>
                  {columnTasks.length}
                </span>
              </h2>

              {columnTasks.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      today={today}
                      statusLabel={stage.label}
                      highlighted={task.id === highlightId}
                      onOpen={onOpenTask}
                      onCopied={onCopied}
                    />
                  ))}
                </ul>
              ) : (
                <p className="flex min-h-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-text-muted">
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
