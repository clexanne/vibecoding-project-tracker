
/** @type {import('../App.jsx').Task[]} */
export const SEED_TASKS = [
    {
        id: 'seed-1',
        title: 'Set up the four-column board',
        description: 'Render To Do, In Progress, Review and Done from STAGES.',
        type: 'feature',
        status: 'done',
        assignee: 'Alex Morgan',
        dueDate: '2026-10-22',
        createdDate: '2026-10-22',
    },
    {
        id: 'seed-2',
        title: 'Add / edit task modal',
        description: 'One modal for creating and editing tasks, with a status dropdown.',
        type: 'feature',
        status: 'in-progress',
        assignee: 'Sam Patel',
        dueDate: '2026-10-23',
        createdDate: '2026-10-22',
    },
    {
        id: 'seed-3',
        title: 'Copy button loses line breaks',
        description: 'Pasted context arrives as one long line in ChatGPT.',
        type: 'bug',
        status: 'review',
        assignee: 'Jordan Lee',
        dueDate: '2026-10-21',
        createdDate: '2026-10-20',
    },
    {
        id: 'seed-4',
        title: 'Deliverable Anchor Board',
        description: 'Four pinned cards for Presentation, Demo, Report and Documentation.',
        type: 'feature',
        status: 'todo',
        assignee: 'Alex Morgan',
        dueDate: '2026-10-28',
        createdDate: '2026-10-22',
    },
];
