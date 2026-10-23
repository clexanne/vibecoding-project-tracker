# Vibecoding Project Tracker — Design

**Status:** Filled in, and kept in step with the built app (last updated 23 Oct 2026, brand and GitHub-style pass).

**Why this file exists.** This tracker is your tool. It should look like *your* tool — not a generic Kanban with default Tailwind blue. Twenty minutes of design decisions here will be visible on every screen for the next six weeks of Module 5.

**Who owns this.** Person B, during the same window the rest of the team is reviewing the PRD. By the time the team converges to start M4 (`data-model`), this file should be filled in and the colors should already be in `tailwind.config.js`.

---

## 1. Mood / vibe

One sentence that captures the feeling the tracker should leave you with.

Calm and focused, like a tidy desk at 11pm: quiet neutrals, one confident deep blue, crisp outlines, and colour used only where it means something. It should feel at home next to the GitHub issues a developer already works in.

Two or three references that capture the vibe (links to dribbble shots, screenshots of apps you admire, Pinterest boards — anything visual):

- Linear's board view: restrained neutrals, strong type hierarchy.
- GitHub Issues and Projects: status icons, label pills and crisp 1px borders. The main reference (chosen 23 Oct).
- Things 3: generous whitespace, nothing shouts.

Anti-references — what we are explicitly **not** trying to look like:

- Trello-style saturated rainbow cards where every colour fights for attention.

## 2. Color palette

These are the colors the build milestones will reference. Once chosen, paste the hex values into `tailwind.config.js` so the rest of the team can use Tailwind utility classes (e.g. `bg-brand-primary`, `border-due-warning`).

### Brand

| Token | Hex | Where it shows up |
|---|---|---|
| `brand-primary` | `#1F49B8` deep blue (white text on it 7.8:1). Blue reads as calm and trustworthy, stays clear with red-green colour blindness, sits far from Bug violet, and isn't Tailwind's default indigo | Wordmark, "+" button, column status icons, focus rings |
| `brand-accent` | `#EEF4FF` (text-primary on it 16:1) | Highlights, hover states, links |
| `surface-page` | `#F8FAFC` | Page background |
| `surface-card` | `#FFFFFF` | Card background |
| `text-primary` | `#0F172A` (17:1 on page) | Body text |
| `text-muted` | `#475569` (7.2:1 on page, 6.9:1 on every due tint) | Captions, dates, counts |

### Task type (M6 `tag-style`)

| Token | Hex | When used |
|---|---|---|
| `type-feature` | `#0F766E` (5.5:1 on white; always with icon + "Feature" word; tint `type-feature-bg` `#F0FDFA`, 5.3:1, used behind the selected Type button) | Cards tagged `feature` (left stripe + icon and word in this colour; modal stripe + selected Type button) |
| `type-bug` | `#7E22CE` violet (7.0:1 on white; always with icon + "Bug" word; tint `type-bug-bg` `#FAF5FF`, 6.5:1, used behind the selected Type button). Violet, not magenta, so it can't be mistaken for overdue red | Cards tagged `bug` (left stripe + icon and word in this colour; modal stripe + selected Type button) |

### Due-date states (M8 `due-tint`)

| Token | Hex | When used |
|---|---|---|
| `due-safe` | `#475569` slate, no tint (`due-safe-bg` `#FFFFFF`, 7.6:1); upcoming is the normal case so it stays quiet, and blue sat too close to the brand colour. Due dates have no time, so in the app this covers every day after today ("Due tomorrow", "Due in 3 days") | More than 2 days out |
| `due-warning` | `#B45309` amber, card tint `due-warning-bg` `#FFFBEB` (4.8:1; pure yellow fails contrast). Due dates have no time, so "less than 24 hours" shows as "Due today" | Less than 24 hours |
| `due-overdue` | `#B91C1C` red, card tint `due-overdue-bg` `#FEF2F2` (5.9:1) | Past due |
| `due-neutral` | `#475569` grey, card tint `due-neutral-bg` `#F1F5F9` (6.9:1), flat grey with a fainter border, so done cards sit back | Done (overrides date) |

## 3. Typography

| Role | Font | Why |
|---|---|---|
| Heading (app name, Deliverables, column and dialog titles: `h1`, `h2`) | Space Grotesk (500 / 600) | Gives the app its own voice; its distinct shapes make headings easy to tell from body text at a glance. |
| Body | Inter (400 / 500 / 600) | Its tall x-height stays readable at 14px, and it is easier than Space Grotesk to read in long runs. |
| Monospace (tags, badges, code) | JetBrains Mono | Easy to tell 0/O and 1/l apart in pasted prompts and logs. |

Suggested sizes (override only if the design demands it):

- Page title: 24 px / semibold, brand-primary
- Section and column headings (Deliverables, To Do…): 18 px / semibold, sentence case
- Card title: 16 px / semibold
- Body and form text: 14 px / regular
- Due label: 13 px / semibold; type word and captions: 12–13 px

## 4. Component principles

One short sentence per element. These set the tone for the build phase — Person A's modal and Person B's anchor board should both feel like they came from this doc.

- **Cards:** White, rounded-md, with a crisp 1px slate-300 border and no shadow (it darkens to slate-500 on hover; done cards keep a fainter slate-200 one), a 4px left stripe in the type colour, the type as a label pill (icon + word in the type colour, on its light tint with a thin border, like a GitHub label), and the due tint behind. Two hues, one job each: type colour = feature/bug (M6), tint + due text = when it's due (M8). Chunked into three groups so the eye reads three units, not five facts (working memory): **What** (type icon + word in the top-left corner, then the title), **Who and when** (owner, then due date, 6px apart), **Do** (Copy Context below a thin line). Small gaps inside a group, bigger gaps between groups (proximity). Copy Context is icon + words in brand blue, like a link, with no outline until hover or focus (grey looked disabled). The whole card is a focusable button.
- **Calm rule:** lines divide, fills show state. A tinted fill means "selected" (the chosen Type, an active filter), so areas are grouped with space, a thin slate-200 line or a plain card instead. Columns are slate-50 with a 1px slate-300 border and rounded-lg, each title led by a status icon in brand blue (To Do empty circle, In Progress dot, Review eye, Done tick), so the shape, not a colour, says the stage; each deliverable is a white card with a slate-200 border and no shadow, so it can't be mistaken for a task card; the task modal's Context half is a page-grey sidebar, edge to edge, with a thin line.
- **Spacing:** 12 px inside a section, 40 px between sections, so proximity shows what belongs together (the toolbar sits 12 px above the board it filters, 40 px below Deliverables).
- **Controls:** every field, dropdown and button is 44 px tall, rounded-md, with a slate-500 border (WCAG 1.4.11). Round pills are only for labels you read, never click: column counts, the Team count and the Feature/Bug labels. The toolbar's Owner / Type / Sort dropdowns keep their label inside ("Owner Everyone") and turn blue while filtering.
- **Team button:** in the header, top right, built like the toolbar controls (44 px, rounded-md, slate-500 border): a people icon in brand blue, the word "Team", and a count pill. Screen readers hear "Team, 3 people".
- **Buttons:** Primary = solid brand-primary with white text (one per area: + New task, Save changes, Add member). Secondary = white with a slate-500 border. Destructive = red text, and a solid red button only inside the confirm dialog. All rounded-md, 44 px tall, with a visible 2px focus ring.
- **Modal:** Centered, max-width-6xl with the task on the left and its Context on the right so it fits one screen, the left half in the card's two chunks, ordered for filling in (Title, the required field where focus starts; Type; Description; then a thin line; then Owner, Due date, Status), the owner field labelled "Hand off to…" when editing (M7) with the current owner marked "(current)", "Owner" for a new task; the Context half in work order (write it, pick the AI tool, Copy Context right beside the AI tool), buttons in a footer that never scrolls away, slate-900 backdrop at 50%, role="dialog" with labelled fields, Escape closes it and focus returns to the card.
- **Empty states:** Dashed slate-300 border, muted text, never sad.
- **Drag affordance (if used):** Added in M12: a grab cursor on cards, the dragged card fades, the target column gets a dashed blue outline and a blue line shows where the card will land. Every card also has a "Move to" menu, so nothing needs dragging (keyboard, touch, WCAG 2.5.7).

## 5. Voice / microcopy

Three lines of microcopy that capture the tone of the product. Keep it short — these are the words a stressed user reads at 11pm.

**One rule for hints, everywhere:** labels carry the meaning. No sentence-long hints under headings or above fields. The only extras are a muted `(required)` / `(optional)` after a label, a short placeholder in an empty field ("Paste a link"), and errors. A feature's purpose is said once, at the moment it matters: in the toast after the action, not in a help line.

| Where | Text |
|---|---|
| "+" button label | + New task |
| Empty column placeholder | No tasks here yet |
| Toast after "Copy as Prompt Context" | Copied to clipboard. Paste it into any AI tool to carry on. |
| Delete (M12: no confirm dialog) | Delete task deletes straight away; the toast offers Undo instead |
| Unsaved-changes dialog | Discard changes? / Keep editing · Discard |
| Toast after delete | Deleted "{title}". · Undo |
| Toast after a move (M12) | Moved "{title}" to {column}. · Undo |
| Handoff toast (M7 `task-owner`) | Handed off to {name}. |

## 6. Logo / wordmark

The tracker probably doesn't need a logo, but it does need a name and a wordmark style.

- **Product name:** Vibecoding Project Tracker
- **Wordmark style:** "Vibecoding Project Tracker" in Space Grotesk 600 at 24px in brand-primary, after a small mark: a brand-blue square holding a mini board (columns of 3, 2 and 1 cards). Top left, linked home; the same mark is the favicon.

## 7. Out of scope (this hackathon)

To keep design tight, the following are explicitly not part of `design-done`:

- A dark mode toggle. Pick one mode and ship it.
- Multiple themes. One brand, applied consistently.
- Animations beyond a 200 ms fade on toast notifications.
- A custom icon set. Use [Lucide icons](https://lucide.dev) via Tailwind classes if you need any.

---

*DESIGN.md version: hackathon-starter v1*
