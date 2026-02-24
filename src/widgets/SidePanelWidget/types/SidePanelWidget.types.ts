export type SidePanelState =
  // | { status: 'unauthenticated'; message: string } 
  | { status: 'loading'; message: string, navItems: NavItem[]  }         
  // | { status: 'errorEmail'; message: string }
  // | { status: 'error'; message: string; user: User }
  | { status: 'success'; message: string; navItems: NavItem[] }; // Output

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

