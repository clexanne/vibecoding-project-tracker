import { forwardRef } from 'react';

/**
 * Bottom-centre toast (DESIGN.md §4). The live region is always mounted so
 * screen readers announce each new message politely.
 * Some messages carry an action (Undo after a delete or a move). Then the toast
 * takes clicks, and it stays put while the pointer is on it or focus is in it
 * (onHold / onRelease), so nobody has to race a timer to press Undo (WCAG 2.2.1).
 */
const Toast = forwardRef(function Toast({ message, visible, action, onHold, onRelease }, actionRef) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center px-4"
    >
      <p
        onMouseEnter={action ? onHold : undefined}
        onMouseLeave={action ? onRelease : undefined}
        onFocus={action ? onHold : undefined}
        onBlur={action ? onRelease : undefined}
        className={`flex items-center gap-3 rounded-md bg-text-primary text-sm font-medium text-white shadow-lg transition-opacity duration-200 motion-reduce:transition-none ${
          action ? 'pointer-events-auto py-1 pl-4 pr-1' : 'px-4 py-2'
        } ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        {message}
        {action && (
          <button
            type="button"
            ref={actionRef}
            onClick={action.onClick}
            className="min-h-11 rounded px-3 font-semibold text-indigo-200 underline underline-offset-2 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {action.label}
          </button>
        )}
      </p>
    </div>
  );
});

export default Toast;
