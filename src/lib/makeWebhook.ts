/**
 * Make.com webhook helper
 *
 * Required env vars:
 *   MAKE_WEBHOOK_BOOKING_REQUEST  – URL of the Custom Webhook module in your Make.com scenario
 *   ADMIN_EMAIL                   – Admin email address; forwarded in the payload so Make.com
 *                                   can route the admin email dynamically
 *
 * If MAKE_WEBHOOK_BOOKING_REQUEST is not set the call is silently skipped —
 * the booking flow is never blocked.
 *
 * Make.com scenario structure:
 *   [Webhook] → [OpenAI: guest email body] → [OpenAI: admin email body]
 *             → [Email: to guest] → [Email: to admin]
 *
 * Payload shape sent to Make.com (all fields available as variables in every module):
 *   id              – booking request UUID
 *   guest_name      – full name
 *   guest_email     – guest email address
 *   guest_phone     – guest phone number
 *   check_in        – ISO date string  e.g. "2025-12-24"
 *   check_out       – ISO date string
 *   nights          – number of nights
 *   room_name       – name of the first room booked
 *   room_details    – full array of room objects (JSON)
 *   total_amount    – total in KSh (number)
 *   special_requests – free-text or ""
 *   admin_email     – value of ADMIN_EMAIL env var
 */

export interface BookingWebhookPayload {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  nights: number;
  room_name: string;
  room_details: unknown[];
  total_amount: number;
  special_requests: string;
  admin_email: string;
}

/**
 * Fire-and-forget POST to the Make.com booking-request webhook.
 * Never throws — errors are logged but do not affect the caller.
 */
export function fireMakeBookingWebhook(payload: BookingWebhookPayload): void {
  const webhookUrl = process.env.MAKE_WEBHOOK_BOOKING_REQUEST;

  if (!webhookUrl) {
    console.warn('[Make.com] MAKE_WEBHOOK_BOOKING_REQUEST is not set — skipping webhook');
    return;
  }

  console.log('[Make.com] Firing booking webhook for:', payload.guest_email, '| booking id:', payload.id);

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(res => {
      console.log('[Make.com] Webhook response status:', res.status);
    })
    .catch(err => {
      console.error('[Make.com] Webhook fetch error:', err);
    });
}
