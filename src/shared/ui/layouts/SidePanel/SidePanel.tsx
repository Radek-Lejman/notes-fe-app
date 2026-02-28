import React, { type ReactNode } from 'react';

interface SidePanelProps {
  topHeader: ReactNode;
  children: ReactNode;
}

export const SidePanel = ({
  topHeader,
  children,
}: SidePanelProps): React.ReactElement => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'orange' }}>
      <aside style={{ width: 200 }}>
        {topHeader} 
      </aside>
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
};

export default SidePanel;
