# PDF — Community Relief platform

Civilian humanitarian website for the PDF community. Public pages have a distinct design. The staff Admin Panel, APIs, database schema and n8n webhooks stay on the shared community-platform contracts so editors can change copy, stories, giving figures, events and galleries and the front updates.

**BCC-website is not modified.** This repository is the PDF client copy.

## Public site

- `/` Home
- `/about` About
- `/our-work` Our work
- `/giving` Giving
- `/certificates` Certificates
- `/stories` News & stories
- `/events` Events
- `/gallery` Gallery
- `/approach` Our approach
- `/get-involved` Get involved
- `/admin` Staff Admin Panel (unchanged workflow)

Admin edits still flow through `/api/home`, `/api/pages`, `/api/posts`, `/api/events`, `/api/media`, `/api/inquiries` and `/api/subscribers`.

## n8n (PDF copies — not BCC)

Seven **PDF** workflows live on the existing Hostinger n8n VPS. BCC workflows were copied, then renamed; BCC itself was not changed.

| Workflow | Webhook path |
|---|---|
| PDF Inquiry Alert | `/webhook/pdf-inquiry-alert` |
| PDF Publish Distribution | `/webhook/pdf-publish-distribution` |
| PDF Subscribe Alert | `/webhook/pdf-subscribe-alert` |
| PDF Event Mail | `/webhook/pdf-event-mail` |
| PDF Enquiry Follow-up Reminder | schedule (calls `PDF_SITE_ORIGIN/api/n8n/stats`) |
| PDF Monthly Summary Report | schedule |
| PDF Subscriber Re-engagement Nudge | schedule |
| Python + CCNP Telegram Course Bot | Telegram trigger (`https://t.me/AIkzautomation_bot?start=public`) |

Website env names stay the same (`N8N_INQUIRY_ALERT_WEBHOOK`, and so on) but must point at the **pdf-** paths, not `bcc-`.

Gmail still uses the current n8n OAuth credential until you attach a PDF mailbox. Set n8n env `PDF_SITE_ORIGIN`, `PDF_N8N_WEBHOOK_SECRET` (same value as `N8N_INQUIRY_WEBHOOK_SECRET`), and later `PDF_ALERT_EMAIL` / `PDF_TELEGRAM_CHAT_ID` for the three scheduled jobs.

Do not commit secrets.

## Local

Requires Node.js `>=22.13.0`.

```bash
npm install
cp .env.example .env.local
npm run dev
```

- Public: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
