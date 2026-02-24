import { Text } from "@chakra-ui/react";
import type { SidePanelSectionTitleProps } from "../types/SidePanelWidget.types";

export const SidePanelSectionTitle = ({ title }: SidePanelSectionTitleProps) => {
    return (
        <div>
            <Text fontWeight="bold">{title}</Text>
        </div>
    );
};