import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { CommandSuggestionList } from "../../../ui/RichEditor/SlashCommand/CommandSuggestionList";
import { type CommandItem, type CommandSuggestionListRef } from "../../../ui/RichEditor/SlashCommand/types";
import { handleEditorAction } from "../../editorActions";
import { richEditorMenu } from "../../../config/editor/menu.config";
import { Editor, type Range } from "@tiptap/core";
import { type SuggestionProps, type SuggestionKeyDownProps } from "@tiptap/suggestion";

export const suggestionOptionsAdapter = {
  items: ({ query }: { query: string }) => {
    return richEditorMenu.menu
      .filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10)
      .map((item) => ({
        ...item,
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor.chain().focus().deleteRange(range).run();
          handleEditorAction(editor, item.value);
        },
      }));
  },
  render: () => {
    let component: ReactRenderer<CommandSuggestionListRef>;
    let popup: TippyInstance[];

    return {
      onStart: (props: SuggestionProps<CommandItem>) => {
        component = new ReactRenderer(CommandSuggestionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy("body", {
          getReferenceClientRect: () => props.clientRect?.() as DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate(props: SuggestionProps<CommandItem>) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: () => props.clientRect?.() as DOMRect,
        });
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === "Escape") {
          popup[0].hide();
          return true;
        }
        return component.ref?.onKeyDown(props) ?? false;
      },

      onExit() {
        if (popup && popup.length > 0) {
          popup[0].destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
};
