/**
 * Bottom-centre toast (DESIGN.md §4). The live region is always mounted so
 * screen readers announce each new message politely.
 */
export default function Toast({ message, visible }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center"
    >
      <p
        className={`rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-white shadow-lg transition-opacity duration-200 motion-reduce:transition-none ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {message}
      </p>
    </div>
  );
}
