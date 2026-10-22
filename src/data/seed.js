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

// ISO date-time `hours` ago, for the M9 "Updated 2 hours ago" hint.
const hoursAgo = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString();

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
        context: `## Background
Edit and create share one modal. It opens from "+ New task" or by clicking a card.

## Constraints
- Escape closes it and focus goes back to the card.
- Every control at least 44px tall.

## Tried so far
Two separate modals drifted apart, so they were merged into one.

## Pick up
Wire the Status select to move the card between columns.
`,
        contextTool: 'Claude',
        contextUpdatedAt: hoursAgo(2),
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
        context: `## Background
Copying a task's context and pasting it into ChatGPT gives one long line.

## Constraints
Must paste cleanly into Claude, ChatGPT and Cursor.

## Tried so far
- \`navigator.clipboard.writeText\` with \`\\n\` joins: line breaks lost in ChatGPT only.
- Suspect the text is built from \`innerText\` of a collapsed element.

## Pick up
Build the string from the task data, not the DOM, and test in all three tools.
`,
        contextTool: 'ChatGPT',
        contextUpdatedAt: hoursAgo(26),
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
