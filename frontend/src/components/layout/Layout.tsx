import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, onSelectTab, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '260px',
          minWidth: 0,
          transition: 'margin-left 0.25s ease'
        }}
        className="main-layout-area"
      >
        <Topbar
          currentTab={currentTab}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .main-layout-area {
            margin-left: 0 !important;
          }
          #mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
