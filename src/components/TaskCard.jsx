/**
 * One task on the board. M4 shows title + assignee only;
 * type colours (M6), owner badge (M7) and due tint (M8) come later.
 */
export default function TaskCard({ task }) {
  return (
    <li className="rounded-md border border-slate-200 bg-surface-card p-3">
      <h3 className="text-sm font-medium text-text-primary">{task.title}</h3>
      <p className="mt-1 text-xs text-text-muted">
        <span className="sr-only">Assignee: </span>
        {task.assignee || 'Unassigned'}
      </p>
    </li>
  );
}
