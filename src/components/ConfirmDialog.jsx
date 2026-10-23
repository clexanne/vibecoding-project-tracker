import { useEffect, useRef } from 'react';

/**
 * A small "are you sure?" dialog that replaces the browser's confirm() box,
 * which can't be styled, looks like a system warning, and names the website
 * instead of the task.
 * It opens over the task modal with the safe choice focused, so Enter or
 * Escape never loses work by accident. The risky button is red with words
 * that say what happens ("Delete task"), so colour is never the only cue.
 * Tab stays inside it; focus goes back to whatever opened it.
 * It keeps an edge in high-contrast mode (transparent border).
 * role="alertdialog" tells screen readers it needs an answer, and they read
 * the message straight away (aria-describedby).
 */
export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancel', onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    cancelRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !event.isComposing) {
        event.stopPropagation();
        onCancel();
      }
      // Keep Tab inside the two buttons.
      if (event.key === 'Tab') {
        const buttons = dialogRef.current?.querySelectorAll('button');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-md rounded-lg border border-transparent bg-surface-card p-6 shadow-xl"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-text-primary">
          {title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm leading-relaxed text-text-muted">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="min-h-11 whitespace-nowrap rounded-md border border-slate-500 px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 whitespace-nowrap rounded-md border border-transparent bg-due-overdue px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-due-overdue focus-visible:ring-offset-2"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
