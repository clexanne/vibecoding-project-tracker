import { Fragment } from 'react';

/**
 * Live Markdown preview for the task Context (M9 stretch). Covers what the
 * Context template and a pasted AI answer use: headings, paragraphs, bullet
 * and numbered lists, code blocks, **bold**, *italic*, `code` and links.
 * Builds React elements, never HTML strings, so pasted text can't run as code,
 * and needs no new library.
 */

// **bold**, *italic* or _italic_, `code`, [text](https://link).
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

function inline(text) {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i} className="rounded bg-slate-100 px-1 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-brand-primary underline underline-offset-2">
          {link[1]}
        </a>
      );
    }
    if (/^(\*[^*].*\*|_[^_].*_)$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Markdown text -> a list of blocks: { type, text | items | level }. */
function parse(markdown) {
  const blocks = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      const code = [];
      while (++i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i]);
      blocks.push({ type: 'code', text: code.join('\n') });
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const last = blocks[blocks.length - 1];
    if (heading) blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
    else if (bullet || numbered) {
      const type = bullet ? 'ul' : 'ol';
      const item = (bullet ?? numbered)[1];
      if (last?.type === type) last.items.push(item);
      else blocks.push({ type, items: [item] });
    } else if (!line.trim()) blocks.push({ type: 'gap' });
    else if (last?.type === 'p') last.text += ` ${line.trim()}`;
    else blocks.push({ type: 'p', text: line.trim() });
  }
  return blocks.filter((block) => block.type !== 'gap');
}

export default function MarkdownPreview({ markdown }) {
  const blocks = parse(markdown);
  if (!blocks.length) return <p className="text-sm text-text-muted">Nothing to preview yet.</p>;

  return (
    <div className="space-y-2 text-sm leading-relaxed text-text-primary [overflow-wrap:anywhere]">
      {blocks.map((block, i) => {
        // Headings in the Context are labels inside the dialog, so they show as
        // bold text, not as page headings that would break the heading outline.
        if (block.type === 'heading') {
          return <p key={i} className={`font-semibold ${i ? 'pt-2' : ''}`}>{inline(block.text)}</p>;
        }
        if (block.type === 'ul' || block.type === 'ol') {
          const List = block.type;
          return (
            <List key={i} className={`space-y-1 pl-5 ${block.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
              {block.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
            </List>
          );
        }
        if (block.type === 'code') {
          return (
            <pre key={i} className="overflow-x-auto rounded-md bg-slate-100 p-3 font-mono text-[0.9em]">
              <code>{block.text}</code>
            </pre>
          );
        }
        return <p key={i}>{inline(block.text)}</p>;
      })}
    </div>
  );
}
