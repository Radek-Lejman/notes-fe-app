import type { ReactNode } from "react";


interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  title?: string;
}
const MainLayout = ({ children, className, title }: MainLayoutProps) => {
return (
    <div className={`main-layout ${className ?? ''}`.trim()}>
      <header>
        <h2>{title || 'Main Layout'}</h2>
      </header>
      <main>{children}</main>
    </div>
  )
}

export default MainLayout;