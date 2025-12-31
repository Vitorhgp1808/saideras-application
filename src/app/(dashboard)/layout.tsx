"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Corrigir sobreposição: aplicar padding-left no main em mobile
  const [mainStyle, setMainStyle] = useState({});
  const isFirstRender = useRef(true);
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) {
        setMainStyle({ paddingLeft: 64 }); // w-16 = 64px
      } else {
        setMainStyle({ marginLeft: isSidebarOpen ? 256 : 64 });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line
  }, [isSidebarOpen]);

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((v) => !v)} />
        <main
          className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 min-w-0"
          style={mainStyle}
        >
          {children}
        </main>
      </div>
    </div>
  );
}