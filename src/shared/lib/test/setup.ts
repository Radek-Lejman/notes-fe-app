import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

// jsdom has no layout engine; Chakra (Ark UI / Floating UI) needs these to mount overlays.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

if (!window.matchMedia) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/** Adds a method jsdom does not implement, keeping a real one if a later jsdom has it. */
const polyfill = (target: object, name: string, implementation: unknown) => {
  if (typeof (target as Record<string, unknown>)[name] !== 'function') {
    Object.defineProperty(target, name, {
      value: implementation,
      configurable: true,
      writable: true,
    });
  }
};

polyfill(Element.prototype, 'scrollIntoView', vi.fn());
polyfill(Element.prototype, 'scrollTo', vi.fn());

// ProseMirror measures the caret (scrollIntoView, coordsAtPos) when the editor gets focus.
const emptyRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
const emptyRects = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
polyfill(Range.prototype, 'getBoundingClientRect', emptyRect);
polyfill(Range.prototype, 'getClientRects', emptyRects);
polyfill(document, 'elementFromPoint', () => null);
