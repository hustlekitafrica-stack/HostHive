// ──────────────────────────────────────────────────────────────
// ESC/POS command constants (generic — compatible with Epson,
// Star, and most no-name thermal printers)
// ──────────────────────────────────────────────────────────────

const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

const CMD = {
  INIT:           Buffer.from([ESC, 0x40]),
  ALIGN_LEFT:     Buffer.from([ESC, 0x61, 0x00]),
  ALIGN_CENTER:   Buffer.from([ESC, 0x61, 0x01]),
  ALIGN_RIGHT:    Buffer.from([ESC, 0x61, 0x02]),
  BOLD_ON:        Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF:       Buffer.from([ESC, 0x45, 0x00]),
  DOUBLE_HEIGHT:  Buffer.from([ESC, 0x21, 0x10]),
  NORMAL_SIZE:    Buffer.from([ESC, 0x21, 0x00]),
  FEED_3:         Buffer.from([ESC, 0x64, 0x03]),
  CUT:            Buffer.from([GS, 0x56, 0x00]),
};

const LINE_WIDTH = 32; // characters per line on a 58mm roll (use 42 for 80mm)

function line(text = ''): Buffer {
  return Buffer.from(text + '\n');
}

function divider(char = '-'): Buffer {
  return line(char.repeat(LINE_WIDTH));
}

function centred(text: string): Buffer {
  const pad = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
  return line(' '.repeat(pad) + text);
}

function padRight(left: string, right: string): Buffer {
  const gap = LINE_WIDTH - left.length - right.length;
  return line(left + ' '.repeat(Math.max(1, gap)) + right);
}

function formatAmount(n: number): string {
  return n.toLocaleString('en-KE', { minimumFractionDigits: 0 });
}

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface POSOrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
  notes?: string;
  tab?: string;
}

export interface POSOrderData {
  order_number: string;
  table_name: string;
  staff_name: string;
  order_type: string;
  items: POSOrderItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_method?: string;
  payment_reference?: string;
  amount_tendered?: number;
  change_given?: number;
  customer_name?: string;
  customer_phone?: string;
  created_at: string;
  paid_at?: string;
  void_reason?: string;
}

export interface ShiftData {
  staff_name: string;
  opened_at: string;
  closed_at: string;
  opening_float: number;
  closing_cash_counted: number;
  total_cash_sales: number;
  total_mpesa_sales: number;
  total_card_sales: number;
  total_sales: number;
  total_orders: number;
  total_voids: number;
  expected_cash: number;
  cash_variance: number;
}

export interface POSSettings {
  receipt_header: string;
  receipt_footer: string;
  currency: string;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function buildHeader(title: string, order: POSOrderData, settings: POSSettings): Buffer[] {
  const ts = new Date(order.created_at).toLocaleString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  return [
    CMD.INIT,
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON,
    CMD.DOUBLE_HEIGHT,
    centred(settings.receipt_header),
    CMD.NORMAL_SIZE,
    CMD.BOLD_OFF,
    divider('='),
    CMD.BOLD_ON,
    centred(title),
    CMD.BOLD_OFF,
    divider('='),
    CMD.ALIGN_LEFT,
    line(`Order: ${order.order_number}`),
    line(`Table: ${order.table_name || order.order_type}`),
    line(`Staff: ${order.staff_name}`),
    line(`Time:  ${ts}`),
    divider('-'),
  ];
}

// ──────────────────────────────────────────────────────────────
// 1. Kitchen Ticket (food items only, no prices)
// ──────────────────────────────────────────────────────────────

export function formatKitchenTicket(order: POSOrderData, settings: POSSettings): Buffer {
  const foodItems = order.items.filter(
    (i) => !i.tab || i.tab !== 'drinks',
  );

  const parts: Buffer[] = [
    ...buildHeader('** KITCHEN TICKET **', order, settings),
  ];

  for (const item of foodItems) {
    parts.push(CMD.BOLD_ON);
    parts.push(line(`  ${item.qty}x ${item.name}`));
    parts.push(CMD.BOLD_OFF);
    if (item.notes) {
      parts.push(line(`    note: ${item.notes}`));
    }
  }

  parts.push(divider('='));
  parts.push(CMD.FEED_3);
  parts.push(CMD.CUT);

  return Buffer.concat(parts);
}

// ──────────────────────────────────────────────────────────────
// 2. Bar Ticket (drinks items only, no prices)
// ──────────────────────────────────────────────────────────────

export function formatBarTicket(order: POSOrderData, settings: POSSettings): Buffer {
  const barItems = order.items.filter((i) => i.tab === 'drinks');

  const parts: Buffer[] = [
    ...buildHeader('** BAR TICKET **', order, settings),
  ];

  for (const item of barItems) {
    parts.push(CMD.BOLD_ON);
    parts.push(line(`  ${item.qty}x ${item.name}`));
    parts.push(CMD.BOLD_OFF);
    if (item.notes) {
      parts.push(line(`    note: ${item.notes}`));
    }
  }

  parts.push(divider('='));
  parts.push(CMD.FEED_3);
  parts.push(CMD.CUT);

  return Buffer.concat(parts);
}

// ──────────────────────────────────────────────────────────────
// 3. Customer Receipt (full bill with prices)
// ──────────────────────────────────────────────────────────────

export function formatCustomerReceipt(order: POSOrderData, settings: POSSettings): Buffer {
  const cur = settings.currency;
  const paidAt = order.paid_at
    ? new Date(order.paid_at).toLocaleString('en-KE', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
    : '';

  const parts: Buffer[] = [
    CMD.INIT,
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON,
    CMD.DOUBLE_HEIGHT,
    centred(settings.receipt_header),
    CMD.NORMAL_SIZE,
    CMD.BOLD_OFF,
    divider('='),
    CMD.ALIGN_LEFT,
    line(`Receipt: ${order.order_number}`),
    line(`Date:    ${paidAt}`),
    line(`Cashier: ${order.staff_name}`),
    line(`Table:   ${order.table_name || order.order_type}`),
    ...(order.customer_name ? [line(`Guest:   ${order.customer_name}`)] : []),
    divider('-'),
  ];

  for (const item of order.items) {
    const label = `  ${item.qty}x ${item.name}`;
    const amount = `${cur} ${formatAmount(item.subtotal)}`;
    parts.push(padRight(label, amount));
    if (item.notes) parts.push(line(`    note: ${item.notes}`));
  }

  parts.push(divider('-'));
  parts.push(padRight('Subtotal:', `${cur} ${formatAmount(order.subtotal)}`));

  if (order.discount_amount > 0) {
    parts.push(padRight('Discount:', `-${cur} ${formatAmount(order.discount_amount)}`));
  }
  if (order.tax_amount > 0) {
    parts.push(padRight('Tax:', `${cur} ${formatAmount(order.tax_amount)}`));
  }

  parts.push(CMD.BOLD_ON);
  parts.push(padRight('TOTAL:', `${cur} ${formatAmount(order.total)}`));
  parts.push(CMD.BOLD_OFF);
  parts.push(divider('='));

  const methodLabel: Record<string, string> = {
    cash: 'Cash',
    mpesa: 'M-Pesa (STK)',
    mpesa_manual: 'M-Pesa',
    card: 'Card',
  };
  parts.push(line(`Payment: ${methodLabel[order.payment_method ?? ''] ?? order.payment_method ?? ''}`));
  if (order.payment_reference) {
    parts.push(line(`Ref: ${order.payment_reference}`));
  }
  if (order.payment_method === 'cash' && order.amount_tendered != null) {
    parts.push(padRight('Tendered:', `${cur} ${formatAmount(order.amount_tendered)}`));
    parts.push(padRight('Change:', `${cur} ${formatAmount(order.change_given ?? 0)}`));
  }

  parts.push(divider('='));
  parts.push(CMD.ALIGN_CENTER);
  parts.push(CMD.BOLD_ON);
  parts.push(centred(settings.receipt_footer));
  parts.push(CMD.BOLD_OFF);
  parts.push(CMD.FEED_3);
  parts.push(CMD.CUT);

  return Buffer.concat(parts);
}

// ──────────────────────────────────────────────────────────────
// 4. Z-Report (end-of-shift)
// ──────────────────────────────────────────────────────────────

export function formatZReport(shift: ShiftData, settings: POSSettings): Buffer {
  const cur = settings.currency;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('en-KE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });

  const parts: Buffer[] = [
    CMD.INIT,
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON,
    CMD.DOUBLE_HEIGHT,
    centred(settings.receipt_header),
    CMD.NORMAL_SIZE,
    CMD.BOLD_OFF,
    divider('='),
    CMD.BOLD_ON,
    centred('END OF SHIFT REPORT'),
    CMD.BOLD_OFF,
    divider('='),
    CMD.ALIGN_LEFT,
    line(`Staff:   ${shift.staff_name}`),
    line(`Opened:  ${fmtDate(shift.opened_at)}`),
    line(`Closed:  ${fmtDate(shift.closed_at)}`),
    divider('-'),
    padRight('Total Orders:', String(shift.total_orders)),
    padRight('Total Voids:', String(shift.total_voids)),
    CMD.BOLD_ON,
    padRight('Net Revenue:', `${cur} ${formatAmount(shift.total_sales)}`),
    CMD.BOLD_OFF,
    divider('-'),
    padRight('Cash Sales:', `${cur} ${formatAmount(shift.total_cash_sales)}`),
    padRight('M-Pesa Sales:', `${cur} ${formatAmount(shift.total_mpesa_sales)}`),
    padRight('Card Sales:', `${cur} ${formatAmount(shift.total_card_sales)}`),
    divider('-'),
    padRight('Opening Float:', `${cur} ${formatAmount(shift.opening_float)}`),
    padRight('Expected Cash:', `${cur} ${formatAmount(shift.expected_cash)}`),
    padRight('Counted Cash:', `${cur} ${formatAmount(shift.closing_cash_counted)}`),
    CMD.BOLD_ON,
    padRight('VARIANCE:', `${cur} ${formatAmount(shift.cash_variance)}`),
    CMD.BOLD_OFF,
    divider('='),
    CMD.FEED_3,
    CMD.CUT,
  ];

  return Buffer.concat(parts);
}

// ──────────────────────────────────────────────────────────────
// 5. Void Slip
// ──────────────────────────────────────────────────────────────

export function formatVoidSlip(order: POSOrderData, managerName: string, settings: POSSettings): Buffer {
  const ts = new Date().toLocaleString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  const parts: Buffer[] = [
    CMD.INIT,
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON,
    centred('*** VOID ***'),
    CMD.BOLD_OFF,
    divider('='),
    CMD.ALIGN_LEFT,
    line(`Order: ${order.order_number}`),
    line(`Table: ${order.table_name || order.order_type}`),
    line(`Time:  ${ts}`),
    line(`Auth:  ${managerName}`),
    line(`Reason: ${order.void_reason || 'N/A'}`),
    divider('='),
    CMD.FEED_3,
    CMD.CUT,
  ];

  return Buffer.concat(parts);
}

// ──────────────────────────────────────────────────────────────
// 6. Test Print
// ──────────────────────────────────────────────────────────────

export function formatTestPrint(printerName: string): Buffer {
  const parts: Buffer[] = [
    CMD.INIT,
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON,
    centred('PRINTER TEST'),
    CMD.BOLD_OFF,
    divider('-'),
    centred(printerName),
    centred('Connection OK'),
    divider('-'),
    CMD.FEED_3,
    CMD.CUT,
  ];
  return Buffer.concat(parts);
}
