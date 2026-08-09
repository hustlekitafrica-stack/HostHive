import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendToPrinter } from '@/lib/pos/printer';
import {
  formatKitchenTicket,
  formatBarTicket,
  formatCustomerReceipt,
  formatZReport,
  formatVoidSlip,
  formatTestPrint,
  POSSettings,
} from '@/lib/pos/escpos';

const DEFAULT_SETTINGS: POSSettings = {
  receipt_header: 'BAR & RESTAURANT',
  receipt_footer: 'Thank you, see you again!',
  currency: 'KSh',
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, order_id, shift_id, printer } = body;

    // Fetch pos_settings
    const { data: settingsRow } = await supabase
      .from('pos_settings')
      .select('*')
      .eq('host_user_id', session.user.id)
      .single();

    const settings: POSSettings = settingsRow
      ? {
          receipt_header: settingsRow.receipt_header ?? DEFAULT_SETTINGS.receipt_header,
          receipt_footer: settingsRow.receipt_footer ?? DEFAULT_SETTINGS.receipt_footer,
          currency: settingsRow.currency ?? DEFAULT_SETTINGS.currency,
        }
      : DEFAULT_SETTINGS;

    const kitchenIp: string = settingsRow?.kitchen_printer_ip ?? '';
    const barIp: string = settingsRow?.bar_printer_ip ?? '';
    const port: number = settingsRow?.printer_port ?? 9100;

    const printersReached: string[] = [];
    const printersFailed: string[] = [];

    const trySend = async (ip: string, name: string, data: Buffer) => {
      const result = await sendToPrinter(ip, port, data);
      if (result.ok) {
        printersReached.push(name);
      } else {
        printersFailed.push(`${name}: ${result.error}`);
      }
    };

    // ── Test print ────────────────────────────────────────────
    if (type === 'test') {
      const targetIp = printer === 'bar' ? barIp : kitchenIp;
      const label = printer === 'bar' ? 'BAR PRINTER' : 'KITCHEN PRINTER';
      await trySend(targetIp, label, formatTestPrint(label));
      return NextResponse.json({ success: true, printers_reached: printersReached, printers_failed: printersFailed });
    }

    // ── Z-Report ──────────────────────────────────────────────
    if (type === 'z_report') {
      if (!shift_id) return NextResponse.json({ error: 'shift_id required' }, { status: 400 });
      const { data: shift } = await supabase
        .from('pos_shifts')
        .select('*')
        .eq('id', shift_id)
        .eq('host_user_id', session.user.id)
        .single();
      if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
      const buf = formatZReport(shift, settings);
      await trySend(barIp, 'bar', buf);
      return NextResponse.json({ success: true, printers_reached: printersReached, printers_failed: printersFailed });
    }

    // ── Order-based prints ────────────────────────────────────
    if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 });

    const { data: order } = await supabase
      .from('pos_orders')
      .select('*')
      .eq('id', order_id)
      .eq('host_user_id', session.user.id)
      .single();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const items = Array.isArray(order.items) ? order.items : [];
    const orderData = { ...order, items };

    if (type === 'kitchen_ticket' || type === 'both_tickets') {
      const foodItems = items.filter((i: { tab?: string }) => i.tab !== 'drinks');
      if (foodItems.length > 0) {
        await trySend(kitchenIp, 'kitchen', formatKitchenTicket(orderData, settings));
      }
    }

    if (type === 'bar_ticket' || type === 'both_tickets') {
      const barItems = items.filter((i: { tab?: string }) => i.tab === 'drinks');
      if (barItems.length > 0) {
        await trySend(barIp, 'bar', formatBarTicket(orderData, settings));
      }
    }

    if (type === 'customer_receipt') {
      await trySend(barIp, 'bar', formatCustomerReceipt(orderData, settings));
    }

    if (type === 'void_slip') {
      // find authorised manager name
      let managerName = 'Manager';
      if (order.void_authorised_by) {
        const { data: mgr } = await supabase
          .from('pos_staff')
          .select('name')
          .eq('id', order.void_authorised_by)
          .single();
        if (mgr) managerName = mgr.name;
      }
      await trySend(barIp, 'bar', formatVoidSlip(orderData, managerName, settings));
    }

    return NextResponse.json({
      success: true,
      printers_reached: printersReached,
      printers_failed: printersFailed,
    });
  } catch (err) {
    console.error('[POST /api/pos/print]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
