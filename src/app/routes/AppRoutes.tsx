import { Outlet, Route, Routes } from "react-router-dom";
import { LoginPageContainer, RedirectIfAuth, RegisterPageContainer, RequireAuth } from "@features/auth";
import { Note } from "@features/manage-notes";
import { DashboardLayout } from "@shared/ui/layouts/Dashboard/DashboardLayout";
import { SidePanelWidget } from "@widgets/SidePanelWidget";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<DashboardLayout  sidebar={<SidePanelWidget />} />}>
        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <LoginPageContainer/>
            </RedirectIfAuth>
          }
          />
          <Route path="/register" element={<RegisterPageContainer />} />
          <Route element={<RequireAuth><Outlet /></RequireAuth>}>
            {/* <Route path="/" element={<WelcomePageContainer />} /> */}
            <Route path="/note/:id" element={<Note />} />
          </Route>
      </Route>
    </Routes>
  );
};