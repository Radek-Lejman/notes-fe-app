import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { SidePanelContent } from "./components/SidePanelContent";
import { SidePanelSection } from "./components/SidePanelSection";
import { SIDE_PANEL_NAV_ITEMS } from "./config/navigaton";
import { SidePanelWidgetNavItems } from "./SidePanelWidgetNavigation";
import { useSession } from "@entities/session";
import { SidePanelGuestContent } from "./components/SidePanelGuestContent";
import { Suspense } from "react";
import { LoadingSpinner } from "@shared/ui/Spinner/Spinner";
import { ShowOnlyUser } from "@features/auth";

// TODO - zle nazewnistwo komponenentów i poziomy zagneirzdzen -0- zastosuj KISS
export const SidePanelWidget = () => {
    const { reset } = useQueryErrorResetBoundary();
    const session = useSession();
    const email = session.data?.email;
    const title = email ? email + " Notes" : "Notes APP"

  return (
    
    <SidePanelSection title={title}>
          <>
            <SidePanelWidgetNavItems items={SIDE_PANEL_NAV_ITEMS} />
            <br />
            <Suspense fallback={<LoadingSpinner/>}>
            <ShowOnlyUser fallback={<SidePanelGuestContent/>}> 
              {() => (
                <ErrorBoundary
                  onReset={reset} // Resetuje błędy React Query przy kliknięciu "Spróbuj ponownie"
                  fallbackRender={({error}) => <div className="text-red">{'xxx'+ error}</div>}
                  >
                    <SidePanelContent />
               </ErrorBoundary>
              )}
            </ShowOnlyUser>
            </Suspense>
          </>
        </SidePanelSection>
  );   
};
