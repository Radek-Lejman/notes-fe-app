import type { ReactNode } from "react"
import { SidePanel } from "@shared/ui/layouts/SidePanel"
import { SidePanelSectionTitle } from "./SidePanelSectionTitle"
import { Text } from "@chakra-ui/react"

export interface SidePanelSectionProps {
    title: string,
    children?: ReactNode
}

export const SidePanelSection = ({
    title,
    children
}: SidePanelSectionProps) => {
    return (
          <SidePanel sidebarSlot={
            <>
            {/* TODO - rtefactor by chakra UI */}
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <SidePanelSectionTitle title={title} />
              {/* <Text fontWeight="bold">+</Text> */}
            </div>
            </>
            } contentSlot={
              children
            }
            />
    )
}