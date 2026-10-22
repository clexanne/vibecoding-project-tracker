# Vibecoding Project Tracker — Design

**Status:** Hackathon starter design doc · fill in the **`<TODO>`** sections before you tag `design-done`.

**Why this file exists.** This tracker is your tool. It should look like *your* tool — not a generic Kanban with default Tailwind blue. Twenty minutes of design decisions here will be visible on every screen for the next six weeks of Module 5.

**Who owns this.** Person B, during the same window the rest of the team is reviewing the PRD. By the time the team converges to start M4 (`data-model`), this file should be filled in and the colors should already be in `tailwind.config.js`.

---

## 1. Mood / vibe

One sentence that captures the feeling the tracker should leave you with.

Calm and focused, like a tidy desk at 11pm: quiet neutrals, one confident indigo, and colour used only where it means something.

Two or three references that capture the vibe (links to dribbble shots, screenshots of apps you admire, Pinterest boards — anything visual):

- Linear's board view: restrained neutrals, strong type hierarchy.
- GitHub Projects: dense but readable cards with small status labels.
- Things 3: generous whitespace, nothing shouts.

Anti-references — what we are explicitly **not** trying to look like:

- Trello-style saturated rainbow cards where every colour fights for attention.

## 2. Color palette

These are the colors the build milestones will reference. Once chosen, paste the hex values into `tailwind.config.js` so the rest of the team can use Tailwind utility classes (e.g. `bg-brand-primary`, `border-due-warning`).

### Brand

| Token | Hex | Where it shows up |
|---|---|---|
| `brand-primary` | `#4338CA` (white text on it 7.9:1) | Header, "+" button, focus rings |
| `brand-accent` | `#EEF2FF` (text-primary on it 16:1) | Highlights, hover states, links |
| `surface-page` | `#F8FAFC` | Page background |
| `surface-card` | `#FFFFFF` | Card background |
| `text-primary` | `#0F172A` (17:1 on page) | Body text |
| `text-muted` | `#475569` (7.2:1 on page, 6.9:1 on every due tint) | Captions, dates, counts |

### Task type (M6 `tag-style`)

| Token | Hex | When used |
|---|---|---|
| `type-feature` | `#0F766E` (5.5:1 on white; always with icon + "Feature" label in a pill, tint `type-feature-bg` `#F0FDFA`, 5.3:1) | Cards tagged `feature` (accent stripe + icon) |
| `type-bug` | `#A21CAF` (6.3:1 on white; always with icon + "Bug" label in a pill, tint `type-bug-bg` `#FDF4FF`, 5.9:1) | Cards tagged `bug` (accent stripe + icon) |

### Due-date states (M8 `due-tint`)

| Token | Hex | When used |
|---|---|---|
| `due-safe` | `#475569` slate, no tint (`due-safe-bg` `#FFFFFF`, 7.6:1); upcoming is the normal case so it stays quiet, and blue sat too close to the indigo brand | More than 2 days out |
| `due-warning` | `#B45309` amber, card tint `due-warning-bg` `#FFFBEB` (4.8:1; pure yellow fails contrast) | Less than 24 hours |
| `due-overdue` | `#B91C1C` red, card tint `due-overdue-bg` `#FEF2F2` (5.9:1) | Past due |
| `due-neutral` | `#475569` grey, card tint `due-neutral-bg` `#F1F5F9` (6.9:1), the same grey as the column with no shadow, so done cards sit back | Done (overrides date) |

## 3. Typography

| Role | Font | Why |
|---|---|---|
| Heading | Inter (600) | Clear letterforms at small sizes and a calm, neutral voice. |
| Body | Inter (400 / 500) | One family keeps the page quiet, and its tall x-height stays readable at 14px. |
| Monospace (tags, badges, code) | JetBrains Mono | Easy to tell 0/O and 1/l apart in pasted prompts and logs. |

Suggested sizes (override only if the design demands it):

- Page title: 24 px / semibold
- Section header: 16 px / semibold uppercase
- Card title: 14 px / medium
- Body: 14 px / regular
- Caption: 12 px / regular muted

## 4. Component principles

One short sentence per element. These set the tone for the build phase — Person A's modal and Person B's anchor board should both feel like they came from this doc.

- **Cards:** White with a 1px slate-200 border, a 4px left stripe in the type colour plus an icon and word, and the due tint behind; the whole card is a focusable button.
- **Buttons:** Solid brand-primary with white text, rounded-md, at least 40px tall, with a visible 2px brand-primary focus ring.
- **Modal:** Centered, max-width-lg, slate-900 backdrop at 50%, role="dialog" with labelled fields, Escape closes it and focus returns to the card.
- **Empty states:** Dashed slate-300 border, muted text, never sad.
- **Drag affordance (if used):** None for now; we use a status dropdown, which stays as the keyboard-friendly option even if drag arrives in M12.

## 5. Voice / microcopy

Three lines of microcopy that capture the tone of the product. Keep it short — these are the words a stressed user reads at 11pm.

| Where | Text |
|---|---|
| "+" button label | + New task |
| Empty column placeholder | Nothing here yet. Your next win goes here. |
| Toast after "Copy as Prompt Context" | Copied. Paste it into your AI and pick up where you left off. |
| Confirm-delete message | Delete "{title}"? This can't be undone. |
| Handoff toast (M7 `task-owner`) | Handed off to {name}. Their context is ready. |

## 6. Logo / wordmark

The tracker probably doesn't need a logo, but it does need a name and a wordmark style.

- **Product name:** Vibecoding Project Tracker
- **Wordmark style:** "Vibecoding Project Tracker" in Inter 600 at 24px in brand-primary, no icon.

## 7. Out of scope (this hackathon)

To keep design tight, the following are explicitly not part of `design-done`:

- A dark mode toggle. Pick one mode and ship it.
- Multiple themes. One brand, applied consistently.
- Animations beyond a 200 ms fade on toast notifications.
- A custom icon set. Use [Lucide icons](https://lucide.dev) via Tailwind classes if you need any.

---

*DESIGN.md version: hackathon-starter v1*