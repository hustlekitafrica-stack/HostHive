'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Monitor,
  ChefHat,
  BarChart2,
  Package,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { getPOSSession, canAccess, type POSPage } from '@/lib/pos/session';

// Each nav item declares which POSPage key it maps to for access checking.
const NAV_ITEMS: { href: string; label: string; icon: React.ElementType; page: POSPage }[] = [
  { href: '/pos/dashboard', label: 'Dashboard', icon: LayoutGrid, page: 'dashboard'  },
  { href: '/pos/terminal',  label: 'Terminal',  icon: Monitor,    page: 'terminal'   },
  { href: '/pos/kitchen',   label: 'Kitchen',   icon: ChefHat,    page: 'kitchen'    },
  { href: '/pos/reports',   label: 'Reports',   icon: BarChart2,  page: 'reports'    },
  { href: '/pos/inventory', label: 'Inventory', icon: Package,    page: 'inventory'  },
  { href: '/pos/staff',     label: 'Staff',     icon: Users,      page: 'staff'      },
  { href: '/pos/settings',  label: 'Settings',  icon: Settings,   page: 'settings'   },
];

export function POSNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    const session = getPOSSession();
    if (session) setRole(session.role);
  }, []);

  // While role is unknown (first render), render nothing to avoid flash.
  // Once role is loaded, filter items; if no role yet fall back to showing nothing.
  const visibleItems = role
    ? NAV_ITEMS.filter(item => canAccess(role, item.page))
    : [];

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-4 py-0 flex items-center gap-1 overflow-x-auto no-scrollbar min-h-[48px] flex-shrink-0">
      {/* Brand */}
      <span className="font-bold text-white text-sm tracking-tight whitespace-nowrap mr-3 hidden sm:block">
        Kogelo POS
      </span>
      <div className="hidden sm:block w-px h-5 bg-slate-600 mr-2" />

      {/* Nav links */}
      <div className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px
                ${active
                  ? 'text-blue-400 border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-white hover:border-slate-500'
                }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <Link
        href="/pos"
        title="Sign Out"
        onClick={() => sessionStorage.removeItem('pos_session')}
        className="ml-2 flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs transition-all flex-shrink-0"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Sign out</span>
      </Link>
    </nav>
  );
}
