import { Alert } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface AppAlertProps {
  status: "info" | "error" | "success" | "warning";
  children: ReactNode;
  title?: string;
}

export const AppAlert = ({ status, children, title }: AppAlertProps) => {
  return (
    <Alert.Root status={status} rounded="lg" variant="subtle">
      <Alert.Indicator />
      <Alert.Content>
        {title && <Alert.Title fontSize="sm">{title}</Alert.Title>}
        <Alert.Description fontSize="sm">{children}</Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
};
