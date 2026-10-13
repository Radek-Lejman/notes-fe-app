import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Editor, Node, type JSONContent } from '@tiptap/core';
import {
  createMarkdownExtensions,
  getEditorMarkdown,
  pageReferenceMarkdown,
  SafeMarkdown,
} from './index';

const NOTE_ID = '3f2a9c1e-8b7d-4e6a-9f10-2c4d5e6f7a8b';

// Same schema + markdown spec as the real PageReferenceNode, without the React node view.
const PageReference = Node.create({
  name: 'pageReference',
  group: 'block',
  atom: true,
  addAttributes: () => ({ noteId: { default: null }, title: { default: null } }),
  parseHTML: () => [{ tag: 'div[data-type="page-reference"]' }],
  renderHTML: ({ HTMLAttributes }) => ['div', { ...HTMLAttributes, 'data-type': 'page-reference' }],
  ...pageReferenceMarkdown,
});

const editor = new Editor({
  extensions: [SafeMarkdown, ...createMarkdownExtensions(), PageReference],
});

afterAll(() => editor.destroy());

const toMarkdown = (doc: JSONContent) => {
  editor.commands.setContent(doc);
  return getEditorMarkdown(editor);
};

// The parser may split text around escapes into several text nodes; compare merged text.
const mergeText = (node: JSONContent): JSONContent => {
  if (!node.content) return node;
  const content = node.content.map(mergeText).reduce<JSONContent[]>((merged, child) => {
    const last = merged[merged.length - 1];
    const sameMarks = JSON.stringify(last?.marks ?? []) === JSON.stringify(child.marks ?? []);
    if (last?.type === 'text' && child.type === 'text' && sameMarks) {
      merged[merged.length - 1] = { ...last, text: `${last.text}${child.text}` };
    } else {
      merged.push(child);
    }
    return merged;
  }, []);
  return { ...node, content };
};

// Loads markdown into the editor; drops the empty paragraph the editor appends after blocks.
const load = (markdown: string) => {
  editor.commands.setContent(markdown, { contentType: 'markdown' });
  const doc = mergeText(editor.getJSON());
  const last = doc.content?.[doc.content.length - 1];
  const trailing = last?.type === 'paragraph' && !last.content && doc.content!.length > 1;
  return trailing ? { ...doc, content: doc.content!.slice(0, -1) } : doc;
};

const roundTrip = (markdown: string) => {
  load(markdown);
  return getEditorMarkdown(editor);
};

const paragraph = (text: string): JSONContent => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

describe('markdown escaping', () => {
  it.each([
    '*ważne* _też_',
    '[nawias] i `tick`',
    'C:\\temp',
    '~~nie przekreślone~~',
    '# nie nagłówek',
    '1. nie lista',
    '2) też nie',
    '- nie lista',
    '+ nie lista',
    '> nie cytat',
    '=== nie setext',
    '<div>nie html</div>',
    '&nbsp; to tekst',
    'C# jest ok, 2 - 1 = 1, a > b',
  ])('keeps %j as literal text after save and load', (text) => {
    const markdown = toMarkdown(paragraph(text));
    expect(load(markdown).content?.[0]).toEqual(paragraph(text).content?.[0]);
  });

  it('does not escape markers in the middle of a line', () => {
    expect(toMarkdown(paragraph('C# jest ok, 2 - 1 = 1, a > b'))).toBe(
      'C# jest ok, 2 - 1 = 1, a > b',
    );
  });

  it('escapes line-start markers after a hard break', () => {
    const doc: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a' },
            { type: 'hardBreak' },
            { type: 'text', text: '# b' },
          ],
        },
      ],
    };
    expect(toMarkdown(doc)).toBe('a\\\n\\# b');
    expect(load('a\\\n\\# b')).toEqual(doc);
  });

  it('leaves code untouched', () => {
    const doc: JSONContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '*a*', marks: [{ type: 'code' }] }] },
        {
          type: 'codeBlock',
          attrs: { language: null },
          content: [{ type: 'text', text: '# b *c*' }],
        },
      ],
    };
    expect(toMarkdown(doc)).toBe('`*a*`\n\n```\n# b *c*\n```');
  });
});

describe('code blocks', () => {
  it('uses a longer fence when the code contains a fence', () => {
    const doc: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: 'md' },
          content: [{ type: 'text', text: '```\ninner\n```' }],
        },
      ],
    };
    const markdown = toMarkdown(doc);

    expect(markdown).toBe('````md\n```\ninner\n```\n````');
    expect(load(markdown)).toEqual(doc);
  });
});

describe('empty lines', () => {
  it('serializes an empty document to an empty string', () => {
    expect(toMarkdown({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe('');
    expect(roundTrip('')).toBe('');
  });

  it('keeps intentional empty lines but drops trailing ones', () => {
    expect(roundTrip('a\n\n&nbsp;\n\nb')).toBe('a\n\n&nbsp;\n\nb');
    expect(roundTrip('- a\n- b')).toBe('- a\n- b');
  });
});

describe('page reference', () => {
  const reference = (title: string | null): JSONContent => ({
    type: 'doc',
    content: [{ type: 'pageReference', attrs: { noteId: NOTE_ID, title } }],
  });

  it('parses a line with only a note link as a page reference', () => {
    expect(load(`[Docker](/notes/${NOTE_ID})`)).toEqual(reference('Docker'));
  });

  it('starts its own block even right after a paragraph line', () => {
    expect(load(`intro\n[Docker](/notes/${NOTE_ID})`).content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: 'intro' }] },
      { type: 'pageReference', attrs: { noteId: NOTE_ID, title: 'Docker' } },
    ]);
  });

  it('keeps a note link inside a sentence as a regular link', () => {
    const doc = load(`see [Docker](/notes/${NOTE_ID}) here`);
    expect(doc.content?.[0].type).toBe('paragraph');
    expect(doc.content?.[0].content?.[1]).toMatchObject({
      text: 'Docker',
      marks: [{ type: 'link', attrs: { href: `/notes/${NOTE_ID}` } }],
    });
  });

  it.each(['https://docs.docker.com', '/notes/not-a-uuid'])(
    'keeps a standalone link to %s as a regular link',
    (href) => {
      expect(load(`[Docker](${href})`).content?.[0].type).toBe('paragraph');
    },
  );

  it('serializes to a standalone link', () => {
    expect(toMarkdown(reference('Docker'))).toBe(`[Docker](/notes/${NOTE_ID})`);
  });

  it('round-trips a title with brackets', () => {
    const markdown = toMarkdown(reference('Plan [v2]'));
    expect(markdown).toBe(`[Plan \\[v2\\]](/notes/${NOTE_ID})`);
    expect(load(markdown)).toEqual(reference('Plan [v2]'));
  });

  it.each([null, ''])('falls back to "Untitled" for title %j', (title) => {
    expect(toMarkdown(reference(title))).toBe(`[Untitled](/notes/${NOTE_ID})`);
  });
});

describe('content after lists', () => {
  // @tiptap/markdown 3.20 lost these: see safeMarkdown.ts.
  it.each([
    ['a numbered list', '1. a\n2. b\n\nAfter **the** list\n\n## Heading'],
    ['a task list', '- [x] a\n- [ ] b\n\nAfter **the** list\n\n## Heading'],
    ['nested items', '1. a\n  - **b** c\n  - [link](https://example.com)\n\nAfter'],
    ['a task list with formatting', '- [ ] **bold** task\n  - [x] *nested*\n\nAfter'],
  ])('keeps the text after and inside %s', (_case, markdown) => {
    expect(roundTrip(markdown)).toBe(markdown);
  });

  it('parses the paragraph after a numbered list with its marks', () => {
    expect(load('1. a\n\nAfter **bold**').content?.[1]).toEqual({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'After ' },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
      ],
    });
  });
});

describe('disabled extensions', () => {
  it('does not produce underline or text style markup', () => {
    expect(roundTrip('<u>a</u> <span style="color: red">b</span>')).toBe('a b');
  });
});

/**
 * Golden files shared with the backend converter (notes-app-be .../utils/__fixtures__/markdown).
 * `<name>.json` is what the editor stores, `<name>.md` is what it serializes to.
 * Regenerate with `UPDATE_GOLDEN=1 npm test` and copy the .md files to the backend.
 */
describe('golden files', () => {
  const dir = join(__dirname, '__fixtures__');
  const names = readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));
  const read = (file: string) => readFileSync(join(dir, file), 'utf8');
  const fixture = (name: string) => ({
    json: JSON.parse(read(`${name}.json`)) as JSONContent,
    markdown: () => read(`${name}.md`).replace(/\n$/, ''),
  });

  beforeEach(() => editor.commands.clearContent());

  it.each(names)('%s: serializes the stored JSON to the expected markdown', (name) => {
    const { json, markdown } = fixture(name);
    const actual = toMarkdown(json);
    if (process.env.UPDATE_GOLDEN) writeFileSync(join(dir, `${name}.md`), `${actual}\n`);

    expect(actual).toBe(markdown());
  });

  it.each(names)('%s: is stable across save and load', (name) => {
    const { markdown } = fixture(name);
    expect(roundTrip(markdown())).toBe(markdown());
  });
});
