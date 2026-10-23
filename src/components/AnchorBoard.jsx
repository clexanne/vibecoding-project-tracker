import { useState } from 'react';
import { BookOpen, ExternalLink, FileText, MonitorPlay, Presentation } from 'lucide-react';

// The four final-project deliverables (M11), in render order.
export const DELIVERABLES = [
  { id: 'presentation',  label: 'Presentation',  Icon: Presentation },
  { id: 'demo',          label: 'Demo',          Icon: MonitorPlay },
  { id: 'report',        label: 'Report',        Icon: FileText },
  { id: 'documentation', label: 'Documentation', Icon: BookOpen },
];

export const EMPTY_ANCHORS = Object.fromEntries(DELIVERABLES.map(({ id }) => [id, '']));

/**
 * Tidy a typed link: '' stays '' (clears it), a missing scheme gets https://,
 * and anything that isn't a web address returns null.
 */
export function normaliseUrl(input) {
  const text = input.trim();
  if (!text) return '';
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    const isWeb = url.protocol === 'https:' || url.protocol === 'http:';
    const hasHost = url.hostname.includes('.') || url.hostname === 'localhost';
    return isWeb && hasHost ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * One deliverable: name, empty/filled dot plus "Linked" / "Not linked" (colour is
 * never the only signal), and a single link field that saves when you leave it or press Enter.
 */
function AnchorCard({ id, label, Icon, url, onSave }) {
  const [draft, setDraft] = useState(url);
  const [error, setError] = useState(false);
  const inputId = `anchor-${id}`;
  const errorId = `${inputId}-error`;

  const commit = () => {
    const next = normaliseUrl(draft);
    if (next === null) return setError(true);
    setError(false);
    setDraft(next);
    if (next !== url) onSave(id, next);
  };

  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-surface-card p-2 pl-3 max-[359px]:block max-[359px]:p-3 sm:block sm:p-3">
      {/* A plain card per deliverable (M11: "four labeled cards"): white on the
          page grey, a light border, no shadow or stripe, so it doesn't look like a
          task card you can open. Name above its field, like the task form, and the
          four line up with the board's columns below. The
          dot is hollow or filled (shape, not just colour), with the status in words beside it.
          On phones the name sits beside its field instead of above it, so the
          four take about half the height and the board starts sooner. Below 360px
          (e.g. 400% zoom) there is no room for both, so it goes back above. */}
      <h3 className="flex w-32 shrink-0 flex-wrap items-center gap-x-2 text-sm font-semibold text-text-primary max-[359px]:mb-1.5 max-[359px]:w-auto sm:mb-1.5 sm:w-auto">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${url ? 'bg-brand-primary' : 'border-2 border-slate-500'}`}
          aria-hidden="true"
        />
        <label htmlFor={inputId}>
          {label}
          <span className="sr-only">{url ? ' link, linked' : ' link, not linked'}</span>
        </label>
        {/* The status in words too, not just the dot (NFR: colour never alone).
            Screen readers already hear it in the label, so this copy is hidden from them.
            It sits right after the name, so the dot, name and status read as one unit
            (proximity) and nobody zoomed in has to look across the card for it.
            On phones the name column is narrow, so it goes under the name instead. */}
        <span
          aria-hidden="true"
          className="basis-full pl-[18px] text-[13px] font-normal text-text-muted max-[359px]:basis-auto max-[359px]:pl-0 sm:basis-auto sm:pl-0"
        >
          <span className="hidden max-[359px]:inline sm:inline">· </span>
          {url ? 'Linked' : 'Not linked'}
        </span>
      </h3>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          id={inputId}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="Paste a link"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          aria-invalid={error}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-11 w-full min-w-0 rounded-md border bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary ${error ? 'border-due-overdue' : 'border-slate-500'}`}
        />
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${label} link in a new tab`}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-md border border-slate-500 text-sm font-medium text-brand-primary hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary px-0 sm:px-3 lg:px-0 2xl:px-3"
          >
            {/* The word "Open" shows wherever it fits; it only shrinks to its icon on
                phones and on small laptops (lg to 2xl), where the link field needs the room. */}
            <span className="sr-only sm:not-sr-only lg:sr-only 2xl:not-sr-only">Open</span>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{`${label} (opens in a new tab)`}</span>
          </a>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-due-overdue">
          Enter a web link, like https://…
        </p>
      )}
    </li>
  );
}

/**
 * "Deliverable Anchor" board (M11): the four things the project hands in,
 * pinned above the Kanban so the end goal is always in view. Compact, so the
 * board itself still starts above the fold.
 */
export default function AnchorBoard({ anchors, onSave }) {
  return (
    <section aria-labelledby="deliverables-heading" className="mb-8 sm:mb-10">
      {/* No hint line: the heading, the four names and "Paste a link" already
          say what to do. Same heading size as the board's columns (same level). */}
      <h2 id="deliverables-heading" className="mb-3 text-lg font-semibold text-text-primary">
        Deliverables
      </h2>
      {/* Same gap as the board; four across from 1024px so the board starts higher
          on small laptops, and from 1280px each card sits over a column.
          No line under the section: the cards end it, and the big gap below
          (40px, vs 12px inside a section) tells the two sections apart. */}
      <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 sm:gap-y-4 lg:grid-cols-4">
        {DELIVERABLES.map((deliverable) => (
          <AnchorCard key={deliverable.id} {...deliverable} url={anchors[deliverable.id] ?? ''} onSave={onSave} />
        ))}
      </ul>
    </section>
  );
}
