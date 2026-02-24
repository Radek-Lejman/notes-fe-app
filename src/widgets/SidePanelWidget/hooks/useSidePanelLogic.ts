import { useGetNotes } from "@entities/notes";
import { mapNotesToNavItems } from "../helpers/fromNotesToNavitem";
import type { SidePanelState } from "../types/SidePanelWidget.types";

export const useSidePanelLogic = (): SidePanelState => {
    // TODO zamontuj status pending oraz przetestuj bledy
    // TODO - opbluga empty satatusu
    // const session = useSession();
    // const userId = session.data?.sub;
    // const email = session.data?.email;

    const notes = useGetNotes();

    // TODO -niemozliwe bo to zalatwia inna czesc logiki - SPR to
    // if (!userId) {
    //     return { status: 'unauthenticated', message: 'User not found' };
    // }

    // if (!email) {
    //     return { status: 'errorEmail', message: 'Email not found' };
    // }

    // if (notes.isPending) {
    //     return { status: 'loading', message: 'Loading notes...', navItems: [] };
    // }

    // if (true) {
    //     return { status: 'error', user: { email, sub: userId }, message: notes.error?.message || 'Error fetching notes' };
    // }

    // if (!notes.data) {
    //  throiw Error 
    //     return { status: 'error', user: { email, sub: userId }, message: 'Notes data is missing' };
    // }

    return { 
        status: 'success', 
        message: 'Notes fetched successfully',
        navItems: mapNotesToNavItems(notes.data || []) 
    };
}
