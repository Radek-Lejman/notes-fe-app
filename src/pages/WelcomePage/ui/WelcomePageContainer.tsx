import { type FC } from "react";
import { WelcomeHero } from "./WelcomeHero";
import MainLayout from "@shared/ui/layouts/MainLayout/MainLayout";

export const WelcomePageContainer: FC = () => {
  return (
    <MainLayout title="Welcome">
      <WelcomeHero />
    </MainLayout>
  );
};
