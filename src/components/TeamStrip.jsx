import { Avatar } from './TaskCard.jsx';

/**
 * "Who's driving what" strip (M7 optional): each team member, the tasks they
 * have in progress, and how many of their tasks aren't done yet.
 */
// "Open" was unclear (M7.1), so say what's left in plain words.
const toFinishLabel = (owned, open) => {
  if (owned === 0) return 'No tasks yet';
  if (open === 0) return 'All tasks finished';
  return `${open} ${open === 1 ? 'task' : 'tasks'} left to finish`;
};

export default function TeamStrip({ members, tasks }) {
  return (
    <section aria-labelledby="team-heading" className="mb-10">
      <h2 id="team-heading" className="mb-3 text-base font-semibold text-text-primary">
        Team
      </h2>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {members.map((name) => {
          const owned = tasks.filter((task) => task.assignee === name);
          const open = owned.filter((task) => task.status !== 'done').length;
          const driving = owned.filter((task) => task.status === 'in-progress');

          return (
            <li key={name} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-surface-card p-4">
              <Avatar name={name} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{name}</p>
                <p className="text-xs text-text-muted">{toFinishLabel(owned.length, open)}</p>
                <p className="mt-1 text-xs text-text-primary">
                  {driving.length > 0 ? `Working on now: ${driving.map((task) => task.title).join(', ')}` : 'Nothing in progress right now'}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
