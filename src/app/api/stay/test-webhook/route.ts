import { NextResponse } from 'next/server';
import { fireMakeBookingWebhook } from '@/lib/makeWebhook';

/**
 * GET /api/stay/test-webhook
 *
 * Fires the Make.com booking webhook with dummy data so you can verify
 * the connection without submitting a real booking.
 *
 * Usage: visit this URL in your browser (or use curl):
 *   http://localhost:3000/api/stay/test-webhook
 *
 * Check your server terminal for [Make.com] log lines.
 * Check Make.com scenario history to confirm it received the payload.
 */
export async function GET() {
  const webhookUrl = process.env.MAKE_WEBHOOK_BOOKING_REQUEST;

  if (!webhookUrl) {
    return NextResponse.json({
      ok: false,
      error: 'MAKE_WEBHOOK_BOOKING_REQUEST is not set in your .env.local file',
    }, { status: 500 });
  }

  fireMakeBookingWebhook({
    id:               'test-' + Date.now(),
    guest_name:       'Test Guest',
    guest_email:      process.env.ADMIN_EMAIL ?? 'test@example.com',
    guest_phone:      '+254700000000',
    check_in:         '2025-12-24',
    check_out:        '2025-12-27',
    nights:           3,
    room_name:        'Deluxe Suite',
    room_details:     [{ property_name: 'Deluxe Suite', price: 8500 }],
    total_amount:     25500,
    special_requests: 'This is a test booking — please ignore.',
    admin_email:      process.env.ADMIN_EMAIL ?? '',
  });

  return NextResponse.json({
    ok: true,
    message: 'Webhook fired. Check your server logs for [Make.com] lines, and check your Make.com scenario history.',
    webhook_url: webhookUrl.slice(0, 40) + '…',
  });
}
