import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";

interface SlashCommandOptions {
  suggestion: Omit<SuggestionOptions, "editor">;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: { command: (args: { editor: Editor; range: Range }) => void } }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
