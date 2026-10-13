import { Lexer, Marked, type MarkedOptions, type Token } from 'marked';
import { Markdown } from '@tiptap/markdown';

/*
 * Workaround for @tiptap/markdown 3.20: custom block tokenizers (ordered lists, task lists) lex
 * their items with a second marked lexer. marked lexers share one tokenizer object, and every
 * call sets its `lexer` to the caller - so after a list, the main lexer's paragraphs and headings
 * queue their inline content on the second lexer, which never processes it: all text after a
 * numbered list or a task list loaded empty. Inline content queued inside the list items (nested
 * items) was lost the same way.
 *
 * The second lexer below processes its own inline queue and hands the tokenizer back to the
 * lexer that called it. Each editor also gets its own marked instance, so editors do not keep
 * registering their tokenizers on the global `marked`.
 */

interface TokenizerHolder {
  tokenizer: { lexer: unknown };
}

const createMarked = () => {
  const instance = new Marked();

  class NestedLexer extends Lexer {
    constructor(options?: MarkedOptions) {
      // The extensions registered on this instance live in its defaults.
      super(options ?? instance.defaults);
      const { tokenizer } = this as unknown as TokenizerHolder;
      const blockTokens = this.blockTokens.bind(this);
      const inlineTokens = this.inlineTokens.bind(this);

      const keepCaller = <T>(run: () => T): T => {
        const caller = tokenizer.lexer;
        try {
          return run();
        } finally {
          tokenizer.lexer = caller;
        }
      };

      this.inlineTokens = ((src: string, tokens?: Token[]) =>
        keepCaller(() => inlineTokens(src, tokens))) as Lexer['inlineTokens'];

      this.blockTokens = ((src: string, tokens?: Token[]) =>
        keepCaller(() => {
          const result = blockTokens(src, tokens);
          // What `Lexer.lex` does after the block pass: fill in the queued inline tokens.
          for (let next = this.inlineQueue.shift(); next; next = this.inlineQueue.shift()) {
            inlineTokens(next.src, next.tokens);
          }
          return result;
        })) as Lexer['blockTokens'];
    }
  }

  instance.Lexer = NestedLexer as typeof Lexer;
  return instance;
};

/** The Markdown extension with the fix above; use it instead of `Markdown` in every editor. */
export const SafeMarkdown = Markdown.extend({
  onBeforeCreate(event) {
    // A fresh marked instance per editor; the parent creates the manager from these options
    // (and parses the initial content) right away.
    this.options.marked = createMarked() as unknown as typeof this.options.marked;
    this.parent?.(event);
  },
});
