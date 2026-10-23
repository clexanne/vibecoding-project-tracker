import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

const longDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * A task as a Markdown briefing for an AI chat (M10 copy-context). Built from
 * the task data, never the DOM, so line breaks survive the paste.
 * The Context's own headings move down one level so they sit under "## Context".
 */
export function formatContext(task, statusLabel) {
  const facts = [
    `- **Type:** ${task.type === 'bug' ? 'Bug' : 'Feature'}`,
    `- **Status:** ${statusLabel}`,
    `- **Owner:** ${task.assignee || 'Unassigned'}`,
    task.dueDate && `- **Due:** ${longDate(task.dueDate)}`,
    task.contextTool && `- **AI tool so far:** ${task.contextTool}`,
  ].filter(Boolean);

  const context = task.context?.trim()
    ? task.context.trim().replace(/^(#{1,5}) /gm, '#$1 ')
    : '_No context written yet._';

  return [
    `I'm working on this task. Here's the briefing so you can help me pick it up.`,
    `# ${task.title}`,
    facts.join('\n'),
    `## Description\n${task.description?.trim() || '_No description._'}`,
    `## Context\n${context}`,
  ].join('\n\n') + '\n';
}

/**
 * "Copy context" button for a card or the modal. The label changes to
 * "Copied" for five seconds where the user is looking (as long as the toast),
 * and `onCopied(ok, hasContext)` lets App show the toast, which screen readers announce.
 * `quiet` (cards) is icon + words in the brand indigo, like a link, with no
 * outline until hover or focus: every card has one, so a row of outlined
 * buttons would pull the eye from the titles, but grey text looked disabled. It looks 36px tall but its click area is 44px (a
 * stretched ::before), so it stays easy to hit without looking heavy.
 */
export default function CopyContextButton({ task, statusLabel, onCopied, quiet = false, className = '' }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatContext(task, statusLabel));
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 5000);
      onCopied(true, Boolean(task.context?.trim()));
    } catch {
      onCopied(false);
    }
  };

  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      className={`relative inline-flex items-center gap-2 rounded-md px-3 ${quiet ? 'min-h-9 before:absolute before:-inset-y-1 before:inset-x-0 border border-transparent text-[13px] font-medium text-brand-primary hover:border-brand-primary' : 'min-h-11 text-sm font-medium text-brand-primary'} hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${className}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {copied ? 'Copied' : 'Copy Context'}
      {/* Every card has this button, so each needs its own name in a screen reader's list. */}
      <span className="sr-only"> for {task.title.trim() || 'this task'}</span>
    </button>
  );
}
