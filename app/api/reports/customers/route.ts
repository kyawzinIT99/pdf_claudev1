import { authRuntime, authenticateRequest } from "../../../lib/auth";
import { buildPdfReport } from "../../../lib/pdf";
import { noStoreHeaders } from "../../../lib/security";
import { buildXlsx } from "../../../lib/xlsx";

async function ensureInquirySchema(db: D1Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS public_inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL DEFAULT 'get-involved',
    kind TEXT NOT NULL DEFAULT 'contact',
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organisation TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    consent INTEGER NOT NULL DEFAULT 0,
    follow_up_required INTEGER NOT NULL DEFAULT 1,
    assigned_to TEXT NOT NULL DEFAULT '',
    follow_up_by TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    closed_by TEXT NOT NULL DEFAULT '',
    closed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  for (const statement of [
    "ALTER TABLE public_inquiries ADD COLUMN closed_by TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE public_inquiries ADD COLUMN closed_at TEXT",
  ]) {
    try {
      await db.prepare(statement).run();
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.toLowerCase().includes("duplicate column")
      ) {
        throw error;
      }
    }
  }
}

async function ensureSubscriberSchema(db: D1Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS mail_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    source TEXT NOT NULL DEFAULT 'website',
    consent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

const inquiryColumns = [
  { key: "id", label: "CK ID" },
  { key: "created_at", label: "Created" },
  { key: "status", label: "Status" },
  { key: "kind", label: "Kind" },
  { key: "source", label: "Source" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "organisation", label: "Organisation" },
  { key: "location", label: "Location" },
  { key: "assigned_to", label: "Assigned to" },
  { key: "closed_by", label: "Closed by" },
  { key: "closed_at", label: "Closed at" },
  { key: "follow_up_by", label: "Follow up by" },
  { key: "message", label: "Message" },
];

const subscriberColumns = [
  { key: "id", label: "ID" },
  { key: "created_at", label: "Created" },
  { key: "status", label: "Status" },
  { key: "source", label: "Source" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "updated_at", label: "Updated" },
];

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  if (user.role === "editor") {
    return Response.json(
      { error: "Administrator access is required" },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "json").toLowerCase();
  const statusFilter = (url.searchParams.get("status") || "all").toLowerCase();
  const kind = (url.searchParams.get("kind") || "all").toLowerCase();
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  const db = authRuntime().DB;
  if (!db) {
    return Response.json(
      { error: "Database is not connected", inquiries: [], subscribers: [], summary: null },
      { status: 503, headers: noStoreHeaders() },
    );
  }
  await ensureInquirySchema(db);
  await ensureSubscriberSchema(db);

  const inquiryResult = await db
    .prepare(
      `SELECT id, source, kind, name, email, organisation, location, message,
        assigned_to, follow_up_by, status, closed_by, closed_at, created_at
       FROM public_inquiries
       ORDER BY created_at DESC
       LIMIT 1000`,
    )
    .all();
  const subscriberResult = await db
    .prepare(
      `SELECT id, name, email, status, source, created_at, updated_at
       FROM mail_subscribers
       ORDER BY created_at DESC
       LIMIT 1000`,
    )
    .all();

  let inquiries = (inquiryResult.results || []) as Array<Record<string, unknown>>;
  let subscribers = (subscriberResult.results || []) as Array<
    Record<string, unknown>
  >;

  if (statusFilter !== "all") {
    inquiries = inquiries.filter(
      (row) => String(row.status || "").toLowerCase() === statusFilter,
    );
    subscribers = subscribers.filter(
      (row) => String(row.status || "").toLowerCase() === statusFilter,
    );
  }
  if (kind !== "all") {
    inquiries = inquiries.filter(
      (row) => String(row.kind || "").toLowerCase() === kind,
    );
  }
  if (q) {
    const match = (row: Record<string, unknown>) =>
      [row.name, row.email, row.organisation, row.location, row.assigned_to, row.closed_by]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(q));
    inquiries = inquiries.filter(match);
    subscribers = subscribers.filter(match);
  }

  const summary = {
    inquiriesTotal: inquiries.length,
    inquiriesOpen: inquiries.filter((row) => row.status !== "closed").length,
    inquiriesClosed: inquiries.filter((row) => row.status === "closed").length,
    subscribersActive: subscribers.filter((row) => row.status === "active").length,
    subscribersTotal: subscribers.length,
  };

  const inquiryRows = inquiries.map((row) => ({
    ...row,
    id: row.id != null ? `CK-${row.id}` : "",
  }));
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "xlsx" || format === "excel" || format === "csv") {
    const bytes = buildXlsx([
      {
        name: "Enquiries",
        columns: inquiryColumns,
        rows: inquiryRows,
      },
      {
        name: "Subscribers",
        columns: subscriberColumns,
        rows: subscribers,
      },
    ]);
    return new Response(Uint8Array.from(bytes).buffer, {
      headers: {
        ...noStoreHeaders(),
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="bcc-customers-${stamp}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const bytes = buildPdfReport({
      title: "BCC customer report",
      subtitle: `${summary.inquiriesTotal} enquiries · ${summary.subscribersTotal} subscribers · filters applied`,
      sections: [
        {
          title: "Enquiries",
          columns: [
            { key: "id", label: "Ref", width: 50 },
            { key: "name", label: "Name", width: 90 },
            { key: "email", label: "Email", width: 120 },
            { key: "kind", label: "Kind", width: 70 },
            { key: "status", label: "Status", width: 60 },
            { key: "assigned_to", label: "Assigned", width: 70 },
            { key: "closed_by", label: "Closed by", width: 70 },
            { key: "created_at", label: "Created", width: 70 },
          ],
          rows: inquiryRows,
        },
        {
          title: "Subscribers",
          columns: [
            { key: "name", label: "Name", width: 100 },
            { key: "email", label: "Email", width: 160 },
            { key: "status", label: "Status", width: 70 },
            { key: "source", label: "Source", width: 70 },
            { key: "created_at", label: "Joined", width: 80 },
          ],
          rows: subscribers,
        },
      ],
    });
    return new Response(Uint8Array.from(bytes).buffer, {
      headers: {
        ...noStoreHeaders(),
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bcc-customers-${stamp}.pdf"`,
      },
    });
  }

  return Response.json(
    { summary, inquiries, subscribers },
    { headers: noStoreHeaders() },
  );
}
