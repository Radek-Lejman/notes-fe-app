import type { NavItem } from "../model/types";

export const SIDE_PANEL_NAV_ITEMS: NavItem[] = [
    {
        label: "Home",
        icon: "home",
        path: "/",
        id: "home",
    },
    {
        label: "Create note",
        icon: "file-text",
        path: "/note",
        id: "note",
    },
    {
        label: "Settings",
        icon: "cog",
        path: "/settings",
        id: "settings",
    },
    {
        label: "Search",
        icon: "search",
        path: "/search",
        id: "search",
    }
];