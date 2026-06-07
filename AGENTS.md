<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Environment Variables Reference

### SMS (Twilio — primary provider)

```
SMS_PROVIDER=twilio
SMS_API_KEY=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx        # Twilio Account SID
SMS_USERNAME=your_auth_token                          # Twilio Auth Token
SMS_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxx  # Preferred: Messaging Service SID (add KogeloSuite alphanumeric sender inside it)
SMS_FROM=KogeloSuite                                  # Fallback: used only when SMS_MESSAGING_SERVICE_SID is not set
ADMIN_PHONE=+254700000000                             # Host/admin phone — receives booking notifications
```

### Make.com — AI-personalised email notifications

```
MAKE_WEBHOOK_BOOKING_REQUEST=https://hook.eu2.make.com/xxxxxx  # Custom Webhook URL from your Make.com scenario
ADMIN_EMAIL=you@example.com                                     # Admin email — forwarded in the webhook payload
```

Scenario flow: Webhook → OpenAI (guest email) → OpenAI (admin email) → Email to guest → Email to admin.
If MAKE_WEBHOOK_BOOKING_REQUEST is absent, the webhook call is silently skipped.

### SMS (Africa's Talking — legacy, kept for reference)

```
SMS_PROVIDER=africastalking
SMS_API_KEY=<AT API key>
SMS_USERNAME=<AT username>
SMS_SENDER_ID=<AT sender name/number>
```
