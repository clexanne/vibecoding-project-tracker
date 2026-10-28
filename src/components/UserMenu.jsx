import { ChevronDown, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from './TaskCard.jsx';

/**
 * Who is signed in, top right, where most web apps put it (GitHub, Google,
 * Trello), so people find it without looking (constructivism: we see what we
 * expect, Gregory 1970). Only the avatar shows; the name and Sign out wait in
 * a small menu, so the header has two controls instead of three and a rarely
 * used Sign out can't be hit by mistake next to Team. "You" items stay apart
 * from the project's Team button (proximity).
 *
 * Built like the "Move to" menu: a disclosure button (aria-expanded) that
 * shows a short list. Enter, Space or Arrow Down opens it and focuses Sign out;
 * Escape, Tab out or a click outside closes it, and Escape puts focus back on
 * the avatar. Every target is 44px tall. It only sits above the page while
 * open, so the task and Team dialogs still cover it.
 */
export default function UserMenu({ name, onSignOut }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const signOutRef = useRef(null);

  // Close on a click anywhere else.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  // Once the menu is on screen, its only action gets focus.
  useEffect(() => {
    if (open) signOutRef.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div
      ref={wrapRef}
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      className={`relative shrink-0 ${open ? 'z-20' : ''}`}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="user-menu"
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (!open && event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={`flex min-h-11 items-center gap-1 rounded-md border px-1.5 text-text-muted hover:border-brand-primary hover:bg-brand-accent hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
          open ? 'border-brand-primary bg-brand-accent text-brand-primary' : 'border-transparent'
        }`}
      >
        <Avatar name={name} size="lg" />
        <span className="sr-only">Account: {name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          id="user-menu"
          className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-slate-200 bg-surface-card py-1 shadow-lg"
        >
          <p className="px-3 pb-2 pt-1.5 text-sm text-text-muted">
            Signed in as
            <span className="block truncate font-semibold text-text-primary">{name}</span>
          </p>
          <div className="border-t border-slate-200 pt-1">
            <button
              ref={signOutRef}
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm text-text-primary hover:bg-brand-accent hover:text-brand-primary focus:outline-none focus-visible:bg-brand-accent focus-visible:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-primary"
            >
              <LogOut className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
