import type { JSONContent } from '@tiptap/core';

export const parseContent = (content: string): JSONContent | null => {
  if (!content) return null;

  try {
    return JSON.parse(content) as JSONContent;
  } catch {
    return null;
  }
};
// test comment
