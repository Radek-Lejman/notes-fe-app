import type { Notes } from "@entities/notes";
import type { NavItem } from "../types/SidePanelWidget.types";

export const mapNotesToNavItems = (notes: Notes[]): NavItem[] => {
  return notes.map((note) => ({
    label: note.title,
    icon: 'FileText',
    path: `/notes/${note.id}`,
    id: note.id,
  }));
};