import { ReactRenderer } from '@tiptap/react';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import type { PluginKey } from '@tiptap/pm/state';
import {
  exitSuggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from '@tiptap/suggestion';

export interface SuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

type ListComponent<P extends Record<string, unknown>> = ConstructorParameters<
  typeof ReactRenderer<SuggestionListRef, P>
>[0];

/**
 * Renders a suggestion list (slash menu, note picker) in a popup under the typed trigger.
 * Escape closes the suggestion for real: the typed text stays as plain text.
 */
export const createFloatingRenderer =
  <Item, P extends Record<string, unknown>>(component: ListComponent<P>, pluginKey: PluginKey) =>
  () => {
    let renderer: ReactRenderer<SuggestionListRef, P> | null = null;
    let floating: HTMLElement | null = null;

    const place = (props: SuggestionProps<Item>) => {
      const rect = props.clientRect?.();
      if (!rect || !floating) return;
      const element = floating;
      void computePosition({ getBoundingClientRect: () => rect }, element, {
        strategy: 'fixed',
        placement: 'bottom-start',
        middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
      });
    };

    return {
      onStart: (props: SuggestionProps<Item>) => {
        renderer = new ReactRenderer(component, { props, editor: props.editor });
        floating = renderer.element;
        Object.assign(floating.style, { position: 'fixed', left: '0', top: '0', zIndex: '1500' });
        document.body.appendChild(floating);
        place(props);
      },

      onUpdate: (props: SuggestionProps<Item>) => {
        renderer?.updateProps(props);
        place(props);
      },

      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === 'Escape') {
          exitSuggestion(props.view, pluginKey);
          return true;
        }
        return renderer?.ref?.onKeyDown(props) ?? false;
      },

      onExit: () => {
        floating?.remove();
        renderer?.destroy();
        floating = null;
        renderer = null;
      },
    };
  };
