import { Grid, GridItem, Box } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";

interface DashboardLayoutProps {
  sidebar: React.ReactNode;
}

export const DashboardLayout = ({ sidebar }: DashboardLayoutProps) => {
  return (
    <Grid templateColumns="repeat(5, 1fr)" h="100vh" overflow="hidden">
      <GridItem colSpan={1} borderRight="1px" borderColor="gray.200">
          {sidebar}
      </GridItem>

      <GridItem colSpan={4}>
        <Box h="100%" w="100%" overflow="hidden">
           <Outlet /> 
        </Box>
      </GridItem>
    </Grid>
  );
};