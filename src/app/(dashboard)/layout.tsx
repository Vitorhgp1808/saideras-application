// app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import Sidebar from "<saidera>/components/Sidebar";
import Navbar from "<saidera>/components/Navbar";

const layoutStyles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column' as 'column', 
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },

  mainArea: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden', 
  },
  pageContent: {
    flex: 1, 
    overflowY: 'auto' as 'auto',
    padding: '20px',
    backgroundColor: '#f7fafc',
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div style={layoutStyles.appContainer}>
      

      <Navbar onToggleSidebar={toggleSidebar} />
      
      <div style={layoutStyles.mainArea}>
        
        <Sidebar isOpen={isSidebarOpen} />
        
        <main style={layoutStyles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}