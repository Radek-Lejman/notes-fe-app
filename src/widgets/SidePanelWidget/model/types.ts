export type SidePanelState =
  | { status: 'loading'; message: string, navItems: NavItem[]  }         
  | { status: 'success'; message: string; navItems: NavItem[] };

export type NavItem = {
  label: string;
  icon: string;
  path: string;
  id: string;
};

export interface SidePanelSectionTitleProps {
    title: string;
}

export interface SidePanelWidgetNavItemsProps {
  items: NavItem[];
}

