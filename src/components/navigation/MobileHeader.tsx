'use client';

import { usePathname } from 'next/navigation';

interface MobileHeaderProps {
  onMenuOpen: () => void;
  onAddBooking: () => void;
  onAdjustPricing: () => void;
  onBlockDates: () => void;
  onMessageGuest: () => void;
  onGenerateReport: () => void;
}

export function MobileHeader({ 
  onMenuOpen, 
  onAddBooking, 
  onAdjustPricing, 
  onBlockDates, 
  onMessageGuest, 
  onGenerateReport 
}: MobileHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/properties') return 'Properties';
    if (pathname === '/unit-performance') return 'Performance';
    if (pathname === '/calendar') return 'Calendar';
    if (pathname === '/guests') return 'Guests';
    if (pathname === '/alerts') return 'Alerts';
    if (pathname === '/expenses') return 'Expenses';
    if (pathname === '/reports') return 'Reports';
    if (pathname === '/settings') return 'Settings';
    return 'Host Hive';
  };

  // Hide header on pages that have their own sticky header
  const pagesWithOwnHeader = ['/booking-calendar', '/alerts', '/guests', '/unit-performance', '/properties', '/expenses', '/reports', '/settings'];
  if (pagesWithOwnHeader.includes(pathname)) {
    return null;
  }

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
      {/* Header Row */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Burger Menu */}
        <button
          onClick={onMenuOpen}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
          title="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <h1 className="text-base font-bold text-gray-900">Host Hive</h1>

        {/* Upgrade Button */}
        <a href="/upgrade" className="bg-gray-900 text-white px-3 py-1.5 rounded-lg font-medium text-xs hover:bg-gray-800 transition-colors">
          Upgrade
        </a>
      </div>

      {/* Action Buttons Row */}
      <div className="py-1.5 flex gap-2 overflow-x-auto px-3 sm:px-4 scrollbar-hide" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onAddBooking();
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-teal-500 text-teal-500 rounded-full hover:bg-teal-500 hover:text-white transition-colors font-medium text-xs whitespace-nowrap flex-shrink-0 min-w-[140px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14m7-7H5"/>
          </svg>
          Add Booking
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onAdjustPricing();
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-teal-500 text-teal-500 rounded-full hover:bg-teal-500 hover:text-white transition-colors font-medium text-xs whitespace-nowrap flex-shrink-0 min-w-[140px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
          Adjust Pricing
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onBlockDates();
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-teal-500 text-teal-500 rounded-full hover:bg-teal-500 hover:text-white transition-colors font-medium text-xs whitespace-nowrap flex-shrink-0 min-w-[140px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          Block Dates
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onMessageGuest();
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-teal-500 text-teal-500 rounded-full hover:bg-teal-500 hover:text-white transition-colors font-medium text-xs whitespace-nowrap flex-shrink-0 min-w-[140px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Message Guest
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onGenerateReport();
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-teal-500 text-teal-500 rounded-full hover:bg-teal-500 hover:text-white transition-colors font-medium text-xs whitespace-nowrap flex-shrink-0 min-w-[140px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
          Generate Report
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-teal-500 text-teal-500 rounded-full hover:bg-teal-500 hover:text-white transition-colors font-medium text-xs whitespace-nowrap flex-shrink-0 min-w-[140px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Add Property
        </button>
      </div>
    </div>
  );
}
