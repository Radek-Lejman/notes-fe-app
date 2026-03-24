import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { LoggedUserNavigation } from "./LoggedUserNavigation/LoggedUserNavigation";
import { SIDE_PANEL_NAV_ITEMS } from "../config/navigaton";
import { SidePanelGuestContent } from "./SidePanelGuestContent/SidePanelGuestContent";
import { LoadingSpinner } from "@shared/ui/Spinner/Spinner";
import { ShowOnlyUser } from "@features/auth";
import { SidePanel } from "@shared/ui/layouts/SidePanel";
import { AsyncBoundary } from "@shared/ui/AsyncBoundary/AsyncBoundary";
import { SidePanelWidgetNavItems } from "./SidePanelWidgetNavigation/SidePanelWidgetNavigation";
import { SidePanelUserHeader } from "./SidePanelUserHeader/SidePanelUserHeader";
import { Box } from "@chakra-ui/react";

export const SidePanelWidget = () => {
    const { reset } = useQueryErrorResetBoundary();

  return (
    <SidePanel.Root>
      <SidePanel.Header>
        <SidePanelUserHeader />
      </SidePanel.Header>

      <SidePanel.Content>
        <SidePanel.Section>
          <SidePanelWidgetNavItems items={SIDE_PANEL_NAV_ITEMS} />
        </SidePanel.Section>

        <SidePanel.Section flex={1}>
          <AsyncBoundary onReset={reset} pendingFallback={<LoadingSpinner/>} rejectedFallback={({error}) => <Box color="red.500">{error.message}</Box>}>
            <ShowOnlyUser fallback={<SidePanelGuestContent/>}> 
              {() => (
                <LoggedUserNavigation />
              )}
            </ShowOnlyUser>
          </AsyncBoundary>
        </SidePanel.Section>
      </SidePanel.Content>
    </SidePanel.Root>
  );   
};
