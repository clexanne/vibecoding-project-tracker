// Seed tasks shown on first load (before anything is saved to localStorage).
// The sample project is the one on the hackathon's mission slide: a student
// portfolio site (Hero copy, Fix nav, About page, CV layout, PRD done), so the
// demo board looks like real work, not like the tracker describing itself.
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
        title: 'Write the hero copy',
        description: 'Headline, one-line intro and a "See my work" button for the top of the home page.',
        type: 'feature',
        status: 'todo',
        assignee: 'Sara Patel',
        dueDate: daysFromToday(5), // more than 2 days out: calm
        createdDate: daysFromToday(-1),
        context: `## Background
The home page opens on a placeholder headline. Visitors are recruiters who give it **about 10 seconds**.

## Constraints
- Headline under 8 words.
- Plain English, no "passionate" or "rockstar".
- Button goes to \`#projects\`.

## Tried so far
Asked for 5 headline options. Favourite so far: **"I design apps people find easy."**

## Outcome
Not decided yet.

## Pick up
1. Pick one headline.
2. Write the one-line intro under it.
3. Add the button.
`,
        contextTool: 'ChatGPT',
        contextUpdatedAt: hoursAgo(20),
    },
    {
        id: 'seed-2',
        title: 'Nav menu won\'t close on phones',
        description: 'On phones, tapping a menu link scrolls to the section but the menu stays open over the page.',
        type: 'bug',
        status: 'in-progress',
        assignee: 'Jordan Lee',
        dueDate: daysFromToday(0), // due today: warning
        createdDate: daysFromToday(-2),
        context: `## Background
Mobile menu in \`Navbar.jsx\`. Open it, tap **About**: the page scrolls, but the menu still covers it.

## Constraints
- Keep the menu keyboard friendly: **Escape** closes it, focus goes back to the menu button.
- No new libraries.

## Tried so far
- Closing on \`onClick\` of each link: works, but focus is lost.
- Listening to \`hashchange\`: doesn't fire when the hash is already the same.

## Outcome
Menu closes on link click. Focus still needs fixing.

## Pick up
Move focus back to the menu button after it closes, then test on an iPhone.
`,
        contextTool: 'Claude',
        contextUpdatedAt: hoursAgo(2),
    },
    {
        id: 'seed-3',
        title: 'Build the About page',
        description: 'Short bio, photo and three skills, linked from the nav.',
        type: 'feature',
        status: 'in-progress',
        assignee: 'Alex Morgan',
        dueDate: daysFromToday(3), // more than 2 days out: calm
        createdDate: daysFromToday(-3),
        context: `## Background
New page at \`/about\`. Copy is in the shared doc; the photo is \`me.jpg\` in \`/public\`.

## Constraints
- Photo needs real alt text.
- Same layout grid as the home page.

## Tried so far
Generated the page in Lovable, then moved it into our repo. The photo was **1.8 MB**, so it now loads slowly.

## Outcome
Page and text done. Photo still too big.

## Pick up
Shrink \`me.jpg\` under 200 KB, then add the three skills as a list.
`,
        contextTool: 'Lovable',
        contextUpdatedAt: hoursAgo(5),
    },
    {
        id: 'seed-4',
        title: 'CV layout breaks on phones',
        description: 'The two-column CV page overflows below 400px wide, so you have to scroll sideways.',
        type: 'bug',
        status: 'review',
        assignee: 'Sara Patel',
        dueDate: daysFromToday(-1), // overdue: alarm
        createdDate: daysFromToday(-4),
        context: `## Background
\`/cv\` uses a two-column grid. Below 400px the dates column pushes the page wider than the screen.

## Constraints
Must still print on one A4 page.

## Tried so far
- \`overflow-x: hidden\` on the body: hides the bug, but cuts off text.
- Switched to one column under \`sm\`: fixed it.

## Outcome
Fixed with one column on phones. Print still fits one page.

## Pick up
Review on a real phone and approve, or reopen with a screenshot.
`,
        contextTool: 'Cursor',
        contextUpdatedAt: hoursAgo(26),
    },
    {
        id: 'seed-5',
        title: 'Write the PRD',
        description: 'Goals, pages and who does what for the portfolio site.',
        type: 'feature',
        status: 'done',
        assignee: 'Alex Morgan',
        dueDate: daysFromToday(-3), // done, so neutral even though the date has passed
        createdDate: daysFromToday(-6),
        context: `## Background
One page that says what the site is for and what "done" means.

## Constraints
Four pages only: Home, About, Projects, CV.

## Tried so far
Drafted with Claude from our interview notes, then edited as a team.

## Outcome
PRD agreed and saved as \`PRD.md\` in the repo.

## Pick up
Nothing left. Update it if we add a page.
`,
        contextTool: 'Claude',
        contextUpdatedAt: hoursAgo(70),
    },
    {
        id: 'seed-6',
        title: 'Add project screenshots',
        description: 'One screenshot and a two-line summary for each of the three projects on the Projects page.',
        type: 'feature',
        status: 'todo',
        assignee: 'Maya Chen',
        dueDate: daysFromToday(6),
        createdDate: daysFromToday(0),
        // Just added, so no context yet: shows the card's "No context yet" note.
        context: '',
        contextTool: '',
        contextUpdatedAt: null,
    },
    {
        id: 'seed-7',
        title: 'Contact form sends blank emails',
        description: 'Messages arrive in the inbox, but the name and message fields are empty.',
        type: 'bug',
        status: 'todo',
        assignee: 'Alex Morgan',
        dueDate: daysFromToday(2),
        createdDate: daysFromToday(-1),
        context: `## Background
The form on \`/contact\` posts to Formspree. Emails arrive, but every field is blank.

## Constraints
- Keep Formspree (free plan).
- No page reload after sending.

## Tried so far
Asked Claude to check the form. It says the inputs have no \`name\` attributes, so nothing is sent.

## Outcome
Not fixed yet.

## Pick up
Add \`name\` to each input, send a test message, then check the inbox.
`,
        contextTool: 'Claude',
        contextUpdatedAt: hoursAgo(9),
    },
    {
        id: 'seed-8',
        title: 'Write alt text for all images',
        description: 'Every image on the site needs alt text that says what it shows, or empty alt if it is decoration.',
        type: 'feature',
        status: 'review',
        assignee: 'Maya Chen',
        dueDate: daysFromToday(1),
        createdDate: daysFromToday(-3),
        context: `## Background
An accessibility check flagged 9 images with no alt text.

## Constraints
- Under 125 characters each.
- Decorative images get \`alt=""\`.

## Tried so far
Asked ChatGPT to draft alt text from the file names. Rewrote most of them by hand, because it guessed wrong.

## Outcome
All 9 images done.

## Pick up
Check them with a screen reader, then move to Done.
`,
        contextTool: 'ChatGPT',
        contextUpdatedAt: hoursAgo(4),
    },
    {
        id: 'seed-9',
        title: 'Deploy to Vercel',
        description: 'Put the site online on a free Vercel link that anyone can open.',
        type: 'feature',
        status: 'done',
        assignee: 'Sara Patel',
        dueDate: daysFromToday(-2),
        createdDate: daysFromToday(-5),
        context: `## Background
The site only ran on our laptops.

## Constraints
Free plan, no login needed to view it.

## Tried so far
Connected the GitHub repo to Vercel. The first build failed on a wrong import path.

## Outcome
Fixed the path. Live on the Vercel link.

## Pick up
Nothing left. New pushes deploy automatically.
`,
        contextTool: 'Claude',
        contextUpdatedAt: hoursAgo(50),
    },
    {
        id: 'seed-10',
        title: 'Footer links go to the wrong pages',
        description: 'The About and CV links in the footer both open the home page.',
        type: 'bug',
        status: 'done',
        assignee: 'Jordan Lee',
        dueDate: daysFromToday(-1),
        createdDate: daysFromToday(-3),
        context: `## Background
Footer links in \`Footer.jsx\` all point to \`/\`.

## Constraints
Same paths as the nav menu.

## Tried so far
Cursor suggested sharing one list of links between the nav and the footer.

## Outcome
Both now use one list, so they can't drift apart again.

## Pick up
Nothing left.
`,
        contextTool: 'Cursor',
        contextUpdatedAt: hoursAgo(30),
    },
];

// Deliverable links shown on first load (M11), so the board shows both states: two filled, two still empty. Swap in your real links in the app.
// To see changes here after the first load, clear 'vibetracker.anchors' in localStorage.
export const SEED_ANCHORS = {
    presentation: '',
    demo: 'https://example.com/portfolio-demo',
    report: '',
    documentation: 'https://example.com/portfolio-docs',
};
