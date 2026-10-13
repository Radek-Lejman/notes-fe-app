export interface NoteLinkTarget {
  id: string;
  title: string;
  /** Where the note lives, e.g. "Projects / AI". */
  path?: string;
}

export type NoteLinkItem =
  | { kind: 'note'; note: NoteLinkTarget }
  | { kind: 'create'; title: string };

export type NoteLinkListProps = {
  items: NoteLinkItem[];
  query: string;
  command: (item: NoteLinkItem) => void;
};
