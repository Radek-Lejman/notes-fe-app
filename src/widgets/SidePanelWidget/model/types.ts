export type SidePanelState =
  | { status: 'loading'; message: string, navItems: NavItem[]  }         
  | { status: 'success'; message: string; navItems: NavItem[] };

export type NavItem = {
  label: string;
  icon: string;
  path: string;
  id: string;
};


export interface SidePanelWidgetNavItemsProps {
  items: NavItem[];
}

