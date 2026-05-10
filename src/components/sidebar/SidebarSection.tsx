'use client';

import { ReactNode } from 'react';

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  collapsed: boolean;
}

export function SidebarSection({
  title,
  children,
  collapsed,
}: SidebarSectionProps) {
  return (
    <div className="mb-6">
      {/* Section Title - hidden when collapsed */}
      {!collapsed && (
        <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </h3>
      )}

      {/* Divider when collapsed */}
      {collapsed && (
        <div className="px-2 py-3">
          <div className="h-px bg-slate-700"></div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}
