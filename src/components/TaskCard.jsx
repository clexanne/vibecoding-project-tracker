import TypeBadge, {typeStyle} from './TypeBadge.jsx';

/**
 * One task on the board. Clicking (or Enter / Space) opens it in the edit modal.
 * The left stripe and corner badge show feature vs. bug (M6).
 * Owner badge (M7) and due tint (M8) come later.
 */
export default function TaskCard({task, onOpen}) {
    return (
        <li>
            <button
                type="button"
                onClick={() => onOpen(task)}
                className={`w-full rounded-md border border-l-4 border-slate-200 ${typeStyle(task.type).stripe} bg-surface-card p-3 text-left hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary`}
            >
        <span className="flex items-start justify-between gap-2">
          <span className="block text-sm font-medium text-text-primary">{task.title}</span>
          <TypeBadge type={task.type}/>
        </span>
                <span className="mt-1 block text-xs text-text-muted">
          <span className="sr-only">Assignee: </span>
                    {task.assignee || 'Unassigned'}
        </span>
            </button>
        </li>
    );
}
