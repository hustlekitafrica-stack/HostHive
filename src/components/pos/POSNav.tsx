'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  ClipboardList,
  ChefHat,
  BarChart2,
  Clock,
  Building2,
  CreditCard,
  Users,
  BookOpen,
  Layers,
  Receipt,
  Wallet,
} from 'lucide-react';
import { getPOSSession, canAccess, type POSPage } from '@/lib/pos/session';

/* ─── Nav item definitions ─────────────────────────────────────────────── */

interface NavItem {
  href:    string;
  label:   string;
  icon:    React.ElementType;
  page:    POSPage;
}

interface SettingsItem {
  href:    string;
  label:   string;
  icon:    React.ElementType;
}

const POS_ITEMS: NavItem[] = [
  { href: '/pos/terminal',    label: 'Sell',       icon: ShoppingCart,  page: 'terminal'   },
  { href: '/pos/terminal',    label: 'Orders',     icon: ClipboardList, page: 'terminal'   },
  { href: '/pos/kitchen',     label: 'Kitchen',    icon: ChefHat,       page: 'kitchen'    },
  { href: '/pos/reports',     label: 'Reports',    icon: BarChart2,     page: 'reports'    },
  { href: '/pos/close-shift', label: 'Timesheet',  icon: Clock,         page: 'close_shift'},
];

const SETTINGS_ITEMS: SettingsItem[] = [
  { href: '/pos/settings',  label: 'Business Det.', icon: Building2   },
  { href: '/pos/settings',  label: 'Subscription',  icon: CreditCard  },
  { href: '/pos/staff',     label: 'Staff & Roles',  icon: Users       },
  { href: '/pos/inventory', label: 'Product Cat.',   icon: BookOpen    },
  { href: '/pos/settings',  label: 'Modifier Grps',  icon: Layers      },
  { href: '/pos/settings',  label: 'Taxes',          icon: Receipt     },
  { href: '/pos/settings',  label: 'Payment Meth.',  icon: Wallet      },
];

/* ─── Role label helper ─────────────────────────────────────────────────── */
const ROLE_LABELS: Record<string, string> = {
  manager:       'Manager',
  cashier:       'Cashier',
  waiter:        'Waiter',
  barman:        'Barman',
  stock_manager: 'Stock Mgr',
};

/* ─── Component ─────────────────────────────────────────────────────────── */
export function POSNav() {
  const pathname = usePathname();
  const [role,      setRole]      = useState('');
  const [staffName, setStaffName] = useState('');

  useEffect(() => {
    const session = getPOSSession();
    if (session) {
      setRole(session.role);
      setStaffName(session.staffName);
    }
  }, []);

  const isManager = role === 'manager';

  return (
    <aside className="w-44 bg-[#1a1f2e] border-r border-slate-800 flex flex-col h-full flex-shrink-0 overflow-y-auto">

      {/* ── User info ─────────────────────────────────────────────── */}
      <div className="px-3 pt-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {staffName ? staffName[0].toUpperCase() : '?'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{staffName || 'Staff'}</p>
          </div>
        </div>
        <p className="text-slate-500 text-[10px] leading-tight">
          {ROLE_LABELS[role] ?? role} · On shift
        </p>
      </div>

      {/* ── POS section ───────────────────────────────────────────── */}
      <div className="px-2 pt-3 pb-1">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-1">
          POS
        </p>
        <nav className="space-y-0.5">
          {POS_ITEMS.map(({ href, label, icon: Icon, page }) => {
            const allowed = !role || canAccess(role, page);
            const active  = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={label}
                href={allowed ? href : '#'}
                onClick={e => { if (!allowed) e.preventDefault(); }}
                title={allowed ? undefined : 'Manager only'}
                className={[
                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all select-none',
                  active
                    ? 'bg-blue-600 text-white'
                    : allowed
                    ? 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                    : 'text-slate-600 cursor-not-allowed',
                ].join(' ')}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Settings section ──────────────────────────────────────── */}
      <div className="px-2 pt-3 pb-3 border-t border-slate-800 mt-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-1">
          Settings
        </p>
        <nav className="space-y-0.5">
          {SETTINGS_ITEMS.map(({ href, label, icon: Icon }) => {
            const allowed = isManager;
            const active  = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={label}
                href={allowed ? href : '#'}
                onClick={e => { if (!allowed) e.preventDefault(); }}
                title={allowed ? undefined : 'Manager only'}
                className={[
                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all select-none',
                  active && allowed
                    ? 'bg-slate-700 text-white'
                    : allowed
                    ? 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
                    : 'text-slate-700 cursor-not-allowed',
                ].join(' ')}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* spacer */}
      <div className="flex-1" />
    </aside>
  );
}
