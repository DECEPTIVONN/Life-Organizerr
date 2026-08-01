import React from 'react';

/**
 * KeyDown handler for textareas that auto-continues numbered lists on Enter press.
 * e.g., typing "1." or "1. Ovos" and pressing Enter will auto-insert "2. " on the new line.
 */
export function handleAutoListKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onChange: (val: string) => void
) {
  if (e.key === 'Enter' && !e.shiftKey) {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    const before = value.substring(0, start);
    const after = value.substring(end);

    const lineStart = before.lastIndexOf('\n') + 1;
    const currentLine = before.substring(lineStart);

    // Matches lines starting with numbers like "1.", "1. ", "1)", "1 -", etc.
    const match = currentLine.match(/^(\s*)(\d+)([\.\)\-]?\s*)/);

    if (match) {
      const indent = match[1];
      const num = parseInt(match[2], 10);
      let delim = match[3];

      if (!delim || delim === '.' || delim === ')' || delim === '-') {
        delim = (delim || '.') + ' ';
      } else if (!delim.endsWith(' ')) {
        delim = delim + ' ';
      }

      const restOfLine = currentLine.substring(match[0].length);

      // If user presses Enter on an auto-generated empty line (e.g. "3. ") and num > 1, remove prefix and exit list
      if (restOfLine.trim() === '' && num > 1) {
        e.preventDefault();
        const lineBeforePrefix = before.substring(0, lineStart);
        const newValue = lineBeforePrefix + after;
        onChange(newValue);
        setTimeout(() => {
          target.setSelectionRange(lineStart, lineStart);
        }, 0);
        return;
      }

      // Otherwise insert next line with next number
      e.preventDefault();
      const nextPrefix = `${indent}${num + 1}${delim}`;
      const newValue = before + '\n' + nextPrefix + after;
      const newPos = start + 1 + nextPrefix.length;

      onChange(newValue);
      setTimeout(() => {
        target.setSelectionRange(newPos, newPos);
      }, 0);
    }
  }
}
