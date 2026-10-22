/**
 * One task on the board. Clicking (or Enter / Space) opens it in the edit modal.
 * Type colours (M6), owner badge (M7) and due tint (M8) come later.
 */
export default function TaskCard({task, onOpen}) {
    return (
        <li>
            <button
                type="button"
                onClick={() => onOpen(task)}
                className="w-full rounded-md border border-slate-200 bg-surface-card p-3 text-left hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
                <span className="block text-sm font-medium text-text-primary">{task.title}</span>
                <span className="mt-1 block text-xs text-text-muted">
          <span className="sr-only">Assignee: </span>
                    {task.assignee || 'Unassigned'}
        </span>
            </button>
        </li>
    );
}
