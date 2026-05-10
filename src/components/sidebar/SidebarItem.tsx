'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  collapsed: boolean;
  badge?: number;
}

export function SidebarItem({
  icon,
  label,
  href,
  isActive,
  collapsed,
  badge,
}: SidebarItemProps) {
  return (
    <Link href={href}>
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg
          transition-all duration-200 ease-in-out
          relative group
          ${
            isActive
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
          }
        `}
        style={isActive ? { backgroundColor: 'var(--brand-secondary, #16a34a)' } : undefined}
      >
        {/* Left border indicator for active state */}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-lg" style={{ backgroundColor: 'var(--brand-secondary, #16a34a)', filter: 'brightness(1.4)' }}></div>
        )}

        {/* Icon */}
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          {icon}
        </div>

        {/* Label - hidden when collapsed */}
        {!collapsed && (
          <span className="flex-1 text-sm font-medium whitespace-nowrap">
            {label}
          </span>
        )}

        {/* Badge */}
        {badge && !collapsed && (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {badge}
          </span>
        )}

        {/* Tooltip when collapsed */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            {label}
          </div>
        )}
      </div>
    </Link>
  );
}
