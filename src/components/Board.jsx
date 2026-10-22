import TaskCard from './TaskCard.jsx';

/**
 * The four-column Kanban board. One <section> per stage so screen readers
 * can jump between columns by heading. `id="board"` is the skip link's target.
 * Columns share one height and a minimum body height, so the four stages
 * read as one row even when some are empty.
 */
export default function Board({ stages, tasks, today, highlightId, onOpenTask }) {
  return (
    <main id="board" tabIndex={-1} aria-label="Task board" className="grid grid-cols-1 gap-6 focus:outline-none sm:grid-cols-2 xl:grid-cols-4">
      {stages.map((stage) => {
        const columnTasks = tasks.filter((task) => task.status === stage.id);
        const headingId = `column-${stage.id}`;

        return (
          <section
            key={stage.id}
            aria-labelledby={headingId}
            className="flex flex-col rounded-xl border border-slate-200 bg-slate-100 p-4"
          >
            <h2
              id={headingId}
              className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 text-base font-semibold text-text-primary"
            >
              {stage.label}
              <span className="min-w-7 rounded-full border border-slate-200 bg-surface-card px-2.5 py-0.5 text-center text-sm font-medium text-text-muted">
                <span className="sr-only">, number of tasks: </span>
                {columnTasks.length}
              </span>
            </h2>

            {columnTasks.length > 0 ? (
              <ul className="flex min-h-48 flex-col gap-3">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    today={today}
                    highlighted={task.id === highlightId}
                    onOpen={onOpenTask}
                  />
                ))}
              </ul>
            ) : (
              <p className="flex min-h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-text-muted">
                No tasks here yet
              </p>
            )}
          </section>
        );
      })}
    </main>
  );
}
