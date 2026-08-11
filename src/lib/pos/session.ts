/**
 * POS session utilities — pure functions, no React, no hooks.
 * All pages import from here to keep role logic in one place.
 */

export type POSRole =
  | 'manager'
  | 'cashier'
  | 'waiter'
  | 'barman'
  | 'stock_manager';

export interface POSSession {
  staffId:   string;
  staffName: string;
  role:      POSRole;
  shiftId:   string;
}

export type POSPage =
  | 'dashboard'
  | 'terminal'
  | 'kitchen'
  | 'reports'
  | 'inventory'
  | 'staff'
  | 'settings'
  | 'close_shift';

/** Reads and parses the pos_session from sessionStorage (client-side only). */
export function getPOSSession(): POSSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('pos_session');
  if (!raw) return null;
  try { return JSON.parse(raw) as POSSession; } catch { return null; }
}

/** The default landing route for each role after login. */
export function getDefaultRoute(role: POSRole | string): string {
  switch (role) {
    case 'manager':       return '/pos/dashboard';
    case 'stock_manager': return '/pos/inventory';
    default:              return '/pos/terminal'; // cashier, waiter, barman
  }
}

/** Access rules: which roles may visit which page. */
const ACCESS_RULES: Record<POSPage, POSRole[]> = {
  dashboard:   ['manager'],
  terminal:    ['manager', 'cashier', 'waiter', 'barman'],
  kitchen:     ['manager', 'cashier', 'waiter', 'barman'],
  close_shift: ['manager', 'cashier', 'waiter', 'barman'],
  reports:     ['manager'],
  inventory:   ['manager', 'stock_manager', 'barman'],
  staff:       ['manager'],
  settings:    ['manager'],
};

export function canAccess(role: POSRole | string, page: POSPage): boolean {
  return (ACCESS_RULES[page] as string[]).includes(role);
}

/* ─── Terminal action-level permissions ─────────────────────────────────── */

export type TerminalAction =
  | 'charge'
  | 'apply_discount'
  | 'split_bill'
  | 'void_order'
  | 'send_to_kitchen'
  | 'hold_order';

const ACTION_RULES: Record<TerminalAction, POSRole[]> = {
  charge:           ['manager', 'cashier'],
  apply_discount:   ['manager', 'cashier'],
  split_bill:       ['manager', 'cashier'],
  void_order:       ['manager'],
  send_to_kitchen:  ['manager', 'cashier', 'waiter', 'barman'],
  hold_order:       ['manager', 'cashier', 'waiter', 'barman'],
};

export function canPerformTerminalAction(
  role: POSRole | string,
  action: TerminalAction,
): boolean {
  return (ACTION_RULES[action] as string[]).includes(role);
}
