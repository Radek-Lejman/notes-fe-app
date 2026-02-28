
import { useSidePanelLogic } from "../../model/useSidePanelLogic";
import { SidePanelWidgetNavItems } from "../SidePanelWidgetNavigation/SidePanelWidgetNavigation";

// TODO - poprtaw nazwe tytluyy i zazrtzadzanie stanem
export const LoggedUserNavigation = () => {
  const state = useSidePanelLogic();

  return (
    <SidePanelWidgetNavItems items={state.navItems} />
  );    
};
