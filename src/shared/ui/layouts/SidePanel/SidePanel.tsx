import React, { type ReactNode } from 'react';

interface SidePanelProps {
  sidebarSlot: ReactNode;
  contentSlot: ReactNode;
}

export const SidePanel = ({
  sidebarSlot,
  contentSlot,
}: SidePanelProps): React.ReactElement => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'orange' }}>
      <aside style={{ width: 200 }}>
        {sidebarSlot} 
      </aside>
      <main style={{ flex: 1 }}>
        {contentSlot}
      </main>
    </div>
  );
};

export default SidePanel;
