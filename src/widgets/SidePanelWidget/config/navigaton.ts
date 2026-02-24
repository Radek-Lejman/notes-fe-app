import type { NavItem } from "../types/SidePanelWidget.types";

export const SIDE_PANEL_NAV_ITEMS: NavItem[] = [
    {
        label: "Home",
        icon: "home",
        path: "/",
        id: "home",
    },
    {
        label: "Notes",
        icon: "file-text",
        path: "/notes",
        id: "notes",
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