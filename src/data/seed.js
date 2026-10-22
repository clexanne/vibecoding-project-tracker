
// Seed tasks shown on first load (before anything is saved to localStorage).
// Assignee values are full names from TEAM in App.jsx.
// To see changes here after the first load, clear the 'vibetracker.tasks' key in localStorage.
// Dates are relative to the day the board is first opened (M8), so a fresh
// board always shows every due state: done, due today, overdue and upcoming.

// 'YYYY-MM-DD' for today plus `offset` days, in local time.
const daysFromToday = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** @type {import('../App.jsx').Task[]} */
export const SEED_TASKS = [
    {
        id: 'seed-1',
        title: 'Set up the four-column board',
        description: 'Render To Do, In Progress, Review and Done from STAGES.',
        type: 'feature',
        status: 'done',
        assignee: 'Alex Morgan',
        dueDate: daysFromToday(-1), // done, so neutral even though the date has passed
        createdDate: daysFromToday(-3),
    },
    {
        id: 'seed-2',
        title: 'Add / edit task modal',
        description: 'One modal for creating and editing tasks, with a status dropdown.',
        type: 'feature',
        status: 'in-progress',
        assignee: 'Sam Patel',
        dueDate: daysFromToday(0), // due today: warning
        createdDate: daysFromToday(-2),
    },
    {
        id: 'seed-3',
        title: 'Copy button loses line breaks',
        description: 'Pasted context arrives as one long line in ChatGPT.',
        type: 'bug',
        status: 'review',
        assignee: 'Jordan Lee',
        dueDate: daysFromToday(-2), // overdue: alarm
        createdDate: daysFromToday(-5),
    },
    {
        id: 'seed-4',
        title: 'Deliverable Anchor Board',
        description: 'Four pinned cards for Presentation, Demo, Report and Documentation.',
        type: 'feature',
        status: 'todo',
        assignee: 'Alex Morgan',
        dueDate: daysFromToday(6), // more than 2 days out: calm
        createdDate: daysFromToday(0),
    },
];