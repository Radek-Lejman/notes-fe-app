
import { useSidePanelLogic } from "../hooks/useSidePanelLogic";
import { SidePanelWidgetNavItems } from "../SidePanelWidgetNavigation";

// TODO - poprtaw nazwe tytluyy i zazrtzadzanie stanem
export const SidePanelContent = () => {
  const state = useSidePanelLogic();



  return (

        <SidePanelWidgetNavItems items={state.navItems} />
 
  );    
};
