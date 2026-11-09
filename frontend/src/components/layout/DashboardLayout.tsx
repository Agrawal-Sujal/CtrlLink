import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Left Navigation Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onSearchSubmit={onSearchSubmit}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
