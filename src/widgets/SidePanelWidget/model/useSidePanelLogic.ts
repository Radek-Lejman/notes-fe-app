import { useGetNotes } from "@entities/notes";
import { mapNotesToNavItems } from "../lib/fromNotesToNavitem";
import type { SidePanelState } from "./types";

export const useSidePanelLogic = (): SidePanelState => {
    const notes = useGetNotes();

    return { 
        status: 'success', 
        message: 'Notes fetched successfully',
        navItems: mapNotesToNavItems(notes.data || []) 
    };
}
