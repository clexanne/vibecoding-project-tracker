import TaskCard from './TaskCard.jsx';

/**
 * The four-column Kanban board. One <section> per stage so screen readers
 * can jump between columns by heading.
 */
export default function Board({stages, tasks, onOpenTask}) {
    return (
        <main className="grid grid-cols-4 gap-4">
            {stages.map((stage) => {
                const columnTasks = tasks.filter((task) => task.status === stage.id);
                const headingId = `column-${stage.id}`;

                return (
                    <section
                        key={stage.id}
                        aria-labelledby={headingId}
                        className="flex flex-col rounded-lg bg-slate-100 p-3"
                    >
                        <h2
                            id={headingId}
                            className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-text-primary"
                        >
                            {stage.label}
                            <span
                                className="rounded-full bg-surface-card px-2 py-0.5 text-xs font-medium text-text-muted">
                <span className="sr-only">, number of tasks: </span>
                                {columnTasks.length}
              </span>
                        </h2>

                        {columnTasks.length > 0 ? (
                            <ul className="flex flex-col gap-2">
                                {columnTasks.map((task) => (
                                    <TaskCard key={task.id} task={task} onOpen={onOpenTask}/>
                                ))}
                            </ul>
                        ) : (
                            <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-xs text-text-muted">
                                Nothing here yet. Your next win goes here.
                            </p>
                        )}
                    </section>
                );
            })}
        </main>
    );
}
