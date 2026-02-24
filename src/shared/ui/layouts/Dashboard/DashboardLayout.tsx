import { Grid, GridItem } from "@chakra-ui/react";
import MainLayout from "../MainLayout/MainLayout";
import { Outlet } from "react-router-dom";

interface DashboardLayoutProps {
  title?: string;
  sidebar: React.ReactNode;
}

export const DashboardLayout = ({ title, sidebar }: DashboardLayoutProps) => {
  return (
<Grid templateColumns="repeat(5, 1fr)" gap={4} h="100vh">
      <GridItem colSpan={1}>
          {sidebar}
      </GridItem>

      <GridItem colSpan={4}>
        <MainLayout title={title}>
          <Outlet /> 
        </MainLayout>
      </GridItem>
    </Grid>
  );
};