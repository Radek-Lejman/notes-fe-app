
import { useSidePanelLogic } from "../../model/useSidePanelLogic";
import { SidePanelWidgetNavItems } from "../SidePanelWidgetNavigation/SidePanelWidgetNavigation";

export const LoggedUserNavigation = () => {
  const state = useSidePanelLogic();

  return (
    <SidePanelWidgetNavItems items={state.navItems} />
  );    
};
