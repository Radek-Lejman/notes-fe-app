import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { LoggedUserNavigation } from "./LoggedUserNavigation/LoggedUserNavigation";
import { SIDE_PANEL_NAV_ITEMS } from "../config/navigaton";
import { useSession } from "@entities/session";
import { SidePanelGuestContent } from "./SidePanelGuestContent/SidePanelGuestContent";
import { LoadingSpinner } from "@shared/ui/Spinner/Spinner";
import { ShowOnlyUser } from "@features/auth";
import { SidePanel } from "@shared/ui/layouts/SidePanel";
import { AsyncBoundary } from "@shared/ui/AsyncBoundary/AsyncBoundary";
import { SidePanelWidgetNavItems } from "./SidePanelWidgetNavigation/SidePanelWidgetNavigation";
import { SidePanelSectionTitle } from "./SidePanelSectionTitle/SidePanelSectionTitle";


export const SidePanelWidget = () => {
    const { reset } = useQueryErrorResetBoundary();
    const session = useSession();

    const email = session.data?.email;
    const title = email ? email + " Notes" : "Notes APP"

  return (
    <SidePanel topHeader={<SidePanelSectionTitle title={title} />}>
            <SidePanelWidgetNavItems items={SIDE_PANEL_NAV_ITEMS} />
            <br />
            <AsyncBoundary onReset={reset} pendingFallback={<LoadingSpinner/>} rejectedFallback={({error}) => <div className="text-red">{error.message}</div>}>
              <ShowOnlyUser fallback={<SidePanelGuestContent/>}> 
                {() => (
                  <LoggedUserNavigation />
                )}
              </ShowOnlyUser>
            </AsyncBoundary>

    </SidePanel>
  );   
};
