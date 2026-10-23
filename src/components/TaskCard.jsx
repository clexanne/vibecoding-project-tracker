import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, FileText } from 'lucide-react';
import TypeBadge, { typeStyle } from './TypeBadge.jsx';
import DueLabel, { DUE_STATES, dueState } from './DueLabel.jsx';
import CopyContextButton from './CopyContextButton.jsx';

/** 'Sara Patel' -> 'SP'. Falls back to '?' for unassigned tasks. */
export const initials = (name) =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('') || '?';

/**
 * Initials in a circle (M7). One colour for everyone, so colour keeps meaning
 * type (stripe + badge) and due date (tint) only; the name is always shown beside it.
 */
export function Avatar({ name, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'h-9 w-9 text-sm' : 'h-7 w-7 text-xs';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-accent font-semibold text-brand-primary ring-1 ring-brand-primary/30 ${sizeClass}`}
    >
      {initials(name)}
    </span>
  );
}

/**
 * One task on the board. The card's main button opens the edit modal, where
 * the Owner field does the handoff (M7.1); its ::after layer stretches over
 * the whole card, so the card is still one large click target. "Copy context"
 * (M10) sits above that layer as the card's second Tab stop.
 * Chunked into three groups, so the eye reads three units instead of five
 * separate facts (working memory, 7±2):
 *   1. What: title first, since it's what people read for, with the type
 *      (icon + word, M6) at the end of that line; the stripe still shows type at a glance.
 *   2. Who and when: owner (M7) and due date (M8) as one unit: the avatar with
 *      the name, and the due line right under the name, so they read together.
 *      A card with no context yet (M9) says so under them; cards that have it
 *      stay quiet, so the line only shows up when something needs doing.
 *   3. Do: Copy Context, below a thin line (common region).
 * Space inside a group is small and space between groups is larger
 * (Gestalt proximity), so the groups show without adding boxes.
 * Done cards skip the due words, since the column already says Done; the grey
 * tint still marks them (M8).
 * Two hues, one job each: the type colour (left stripe + icon and word) says
 * feature vs. bug (M6), and the background tint + due text say when it's due (M8).
 * M12: the card can be dragged to another column, and "Move to" beside Copy
 * Context does the same without dragging (keyboard, screen readers, phones).
 * Both actions live in the same "Do" row, so everything you can do to a card is in one place.
 * Dragging is shown by a grab cursor on the whole card (a signifier, Norman),
 * so the card looks movable before anyone tries.
 * Copy Context is the main action (indigo); Move to is quieter grey until
 * hovered, so the row has one clear first choice. Both are 44px tall to hit.
 * The menu also has "Up one" / "Down one" (Custom order), split from the columns
 * by a line, and only when there's a card to swap with.
 */
/**
 * "Move to": a small menu in the app's own style (the browser's dropdown
 * looked out of place on the card). It's a disclosure: a button that shows a
 * list of buttons, so a screen reader says "Move to ..., collapsed/expanded",
 * then "list, 4 items". Arrow keys, Home and End move between items, Tab still
 * works, and Escape, Tab out or a click outside closes it, and focus goes back to
 * "Move to" so the next key press acts on the same card. Each item is 44px tall.
 */
function MoveMenu({ task, stages, prevId, nextId, onMove, onPlace }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const listId = `move-list-${task.id}`;

  const items = [
    prevId && { key: 'up', label: 'Up one', Icon: ArrowUp, run: () => onPlace(task.id, task.status, { before: prevId }) },
    nextId && { key: 'down', label: 'Down one', Icon: ArrowDown, run: () => onPlace(task.id, task.status, { after: nextId }) },
    ...stages
      .filter((stage) => stage.id !== task.status)
      .map((stage) => ({ key: stage.id, label: stage.label, Icon: ArrowRight, column: true, run: () => onMove(task.id, stage.id) })),
  ].filter(Boolean);

  // Close on a click anywhere else.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const itemButtons = () => [...(wrapRef.current?.querySelectorAll(':scope ul button') ?? [])];
  // Which item gets focus once the list is on screen: 0 = first, -1 = last.
  const [focusIndex, setFocusIndex] = useState(null);
  useEffect(() => {
    if (open && focusIndex != null) itemButtons().at(focusIndex)?.focus();
  }, [open, focusIndex]);
  const openMenu = (index) => {
    setFocusIndex(index);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setFocusIndex(null);
    buttonRef.current?.focus();
  };
  const onKeyDown = (event) => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      itemButtons().at(event.key === 'Home' ? 0 : -1)?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const buttons = itemButtons();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const current = buttons.indexOf(document.activeElement);
      const next = current < 0 ? (step > 0 ? 0 : buttons.length - 1) : (current + step + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  };

  return (
    <div
      ref={wrapRef}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      className={`relative -mr-2 ${open ? 'z-20' : 'z-[1]'}`}
    >
      <button
        ref={buttonRef}
        type="button"
        id={`move-${task.id}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openMenu(0))}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            openMenu(event.key === 'ArrowDown' ? 0 : -1);
          }
        }}
        className={`group -my-1 inline-flex min-h-11 items-center gap-1 rounded-md border px-3 text-[13px] font-medium hover:border-brand-primary hover:bg-brand-accent hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
          open ? 'border-brand-primary bg-brand-accent text-brand-primary' : 'border-transparent text-text-muted'
        }`}
      >
        Move to
        <span className="sr-only"> {task.title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          id={listId}
          aria-label={`Move ${task.title}`}
          className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-slate-200 bg-surface-card py-1 shadow-lg"
        >
          {items.map((item, i) => (
            <li key={item.key} className={item.column && !items[i - 1]?.column && i > 0 ? 'mt-1 border-t border-slate-200 pt-1' : ''}>
              <button
                type="button"
                onClick={() => {
                  close();
                  item.run();
                }}
                className="flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm text-text-primary hover:bg-brand-accent hover:text-brand-primary focus:outline-none focus-visible:bg-brand-accent focus-visible:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-primary"
              >
                <item.Icon className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TaskCard({ task, today, statusLabel, stages, highlighted, dragging, dropSide, prevId, nextId, onOpen, onMove, onPlace, onDragStart, onDragEnd, onCopied }) {
  const state = dueState(task, today);
  const tint = state ? DUE_STATES[state].tint : 'bg-surface-card';
  // Crisp outlines instead of soft shadows, like an issue list: open cards get a
  // firmer border that darkens on hover; done cards keep a faint one and recede.
  const depth = state === 'done' ? 'border-slate-300' : 'border-slate-300 hover:border-slate-500';

  return (
    <li
      data-task-id={task.id}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', task.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`relative rounded-xl ${dragging ? 'opacity-50' : ''} border border-l-4 ${typeStyle(task.type).stripe} ${tint} ${depth} px-4 pb-1 pt-3.5 transition-colors duration-200 motion-reduce:transition-none ${
        highlighted ? 'ring-2 ring-brand-primary' : ''
      }`}
    >
      {/* Where a dragged card will land: a line in the gap above or below. */}
      {dropSide && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -left-1 -right-1 h-1 rounded-full bg-brand-primary ${dropSide === 'before' ? '-top-2.5' : '-bottom-2.5'}`}
        />
      )}
      <button
        type="button"
        id={`open-${task.id}`}
        onClick={() => onOpen(task)}
        className="block w-full cursor-grab text-left active:cursor-grabbing after:absolute after:inset-0 after:rounded-xl focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-primary focus-visible:after:ring-offset-2"
      >
        {/* 1. What */}
        <span className="flex items-start justify-between gap-3">
          {/* Long titles wrap anywhere and stop at 3 lines, so a pasted prompt can't break the board (NFR2). */}
          <span className="min-w-0 text-base font-semibold leading-snug text-text-primary [overflow-wrap:anywhere] line-clamp-3">{task.title}</span>
          <TypeBadge type={task.type} small />
        </span>

        {/* 2. Who and when: the name and due line share one left edge beside the avatar. */}
        <span className="mt-3.5 flex min-w-0 items-center gap-2.5">
          <Avatar name={task.assignee} size="lg" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-text-primary">
              <span className="sr-only">Owner: </span>
              {task.assignee || 'Unassigned'}
            </span>
            {state && state !== 'done' && <DueLabel task={task} today={today} />}
          </span>
        </span>
        {state !== 'done' && !task.context?.trim() && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-primary">
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            No context yet
          </span>
        )}
      </button>

      {/* 3. Do */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-900/10 pt-1.5">
        <CopyContextButton
          task={task}
          statusLabel={statusLabel}
          onCopied={onCopied}
          quiet
          className="z-[1] -ml-3"
        />
        <MoveMenu task={task} stages={stages} prevId={prevId} nextId={nextId} onMove={onMove} onPlace={onPlace} />
      </div>
    </li>
  );
}
