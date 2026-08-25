#!/usr/bin/env python3
"""Copy BCC n8n workflows into new PDF workflows. Does not modify BCC."""

from __future__ import annotations

import copy
import json
import uuid
import urllib.error
import urllib.request
from pathlib import Path

N8N_URL = "https://n8n-al8a.srv1707349.hstgr.cloud"
BCC_DEV_VARS = Path("/Users/berry/Documents/Cursor/BCC/.dev.vars")
EXPORT_DIR = Path("/tmp/bcc-n8n-export")
OUT_DIR = Path(__file__).resolve().parent

BCC_IDS = [
    "U1gvYq4WnZvxyMIm",
    "czx6JcuNWP2unBRv",
    "JBDK9TqPnYJCkAMn",
    "bS9NmXubTc9y9Kc0",
    "FWwHaDlFEScrwHcN",
    "irGFDMqBM4Eyct0c",
    "iR9ee5NYsKWHlHR6",
]


def load_api_key() -> str:
    for line in BCC_DEV_VARS.read_text().splitlines():
        if line.startswith("N8N_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("N8N_API_KEY missing from BCC .dev.vars")


def api(method: str, path: str, body: dict | None = None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        N8N_URL + path,
        data=data,
        method=method,
        headers={
            "X-N8N-API-KEY": load_api_key(),
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            if resp.status == 204:
                return {}
            return json.load(resp)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"{method} {path} failed: {exc.code}\n{detail[:800]}") from exc


def rebrand_text(value: str) -> str:
    replacements = [
        ("bcc-inquiry-alert", "pdf-inquiry-alert"),
        ("bcc-publish-distribution", "pdf-publish-distribution"),
        ("bcc-subscribe-alert", "pdf-subscribe-alert"),
        ("bcc-event-mail", "pdf-event-mail"),
        ("bcc-sub-welcome-mail", "pdf-sub-welcome-mail"),
        ("BCC Enquiry Follow-up Reminder", "PDF Enquiry Follow-up Reminder"),
        ("BCC Monthly Summary Report", "PDF Monthly Summary Report"),
        ("BCC Subscriber Re-engagement Nudge", "PDF Subscriber Re-engagement Nudge"),
        ("BCC Inquiry Alert", "PDF Inquiry Alert"),
        ("BCC Publish Distribution", "PDF Publish Distribution"),
        ("BCC Subscribe Alert", "PDF Subscribe Alert"),
        ("BCC Event Mail", "PDF Event Mail"),
        ("BCC WA Charity", "PDF Myanmar Relief"),
        ("BCC WA &mdash;", "PDF Myanmar Relief &mdash;"),
        ("BCC WA —", "PDF Myanmar Relief —"),
        ("[BCC WA]", "[PDF]"),
        ("[BCC CRM]", "[PDF]"),
        ("BCC CRM", "PDF CRM"),
        ("BCC ·", "PDF ·"),
        ("BCC \\u00b7", "PDF \\u00b7"),
        ("BCC WA", "PDF Myanmar Relief"),
        ("https://bccwac.com/admin/inquiries", "http://localhost:3000/admin"),
        ("https://bccwac.com/admin/events", "http://localhost:3000/admin"),
        ("https://bccwac.com/admin", "http://localhost:3000/admin"),
        ("https://bccwac.com/api/n8n/stats", "={{ $env.PDF_SITE_ORIGIN }}/api/n8n/stats"),
        ("https://bccwac.com", "http://localhost:3000"),
        ("body.telegramChatId || '-5357822241'", "body.telegramChatId || ''"),
        ('body.telegramChatId || "-5357822241"', "body.telegramChatId || ''"),
        ("body.alertEmail || 'bccwacharity@gmail.com'", "body.alertEmail || ''"),
        ('body.alertEmail || "bccwacharity@gmail.com"', "body.alertEmail || ''"),
        ("chatId: '-5357822241'", "chatId: String($env.PDF_TELEGRAM_CHAT_ID || '')"),
        ("bccwacharity@gmail.com", ""),
    ]
    for old, new in replacements:
        value = value.replace(old, new)
    return value


def rebrand(obj):
    if isinstance(obj, str):
        return rebrand_text(obj)
    if isinstance(obj, list):
        return [rebrand(item) for item in obj]
    if isinstance(obj, dict):
        return {key: rebrand(value) for key, value in obj.items()}
    return obj


def clone_workflow(source: dict) -> dict:
    nodes = copy.deepcopy(source["nodes"])
    connections = copy.deepcopy(source.get("connections") or {})
    for node in nodes:
        node["id"] = str(uuid.uuid4())
        if node.get("type") == "n8n-nodes-base.webhook":
            node.pop("webhookId", None)
            params = node.setdefault("parameters", {})
            path = str(params.get("path") or "")
            params["path"] = path.replace("bcc-", "pdf-")
        if node.get("type") == "n8n-nodes-base.httpRequest":
            params = node.setdefault("parameters", {})
            params["url"] = "={{ $env.PDF_SITE_ORIGIN }}/api/n8n/stats"
            params["authentication"] = "none"
            params.pop("genericAuthType", None)
            params["sendHeaders"] = True
            params["headerParameters"] = {
                "parameters": [
                    {
                        "name": "x-n8n-secret",
                        "value": "={{ $env.PDF_N8N_WEBHOOK_SECRET }}",
                    }
                ]
            }
            node.pop("credentials", None)
        if node.get("type") == "n8n-nodes-base.gmail":
            params = node.setdefault("parameters", {})
            if params.get("sendTo") == "bccwacharity@gmail.com":
                params["sendTo"] = "={{ $env.PDF_ALERT_EMAIL }}"
            # Keep existing Gmail OAuth credential; owner will swap later.
            notes = str(node.get("notes") or "")
            extra = "PDF copy. Swap Gmail OAuth to the PDF mailbox when ready."
            node["notes"] = f"{notes}\n{extra}".strip()
            node["notesInFlow"] = True
    payload = {
        "name": rebrand_text(source["name"]),
        "nodes": rebrand(nodes),
        "connections": rebrand(connections),
        "settings": {"executionOrder": "v1"},
    }
    if not payload["name"].startswith("PDF "):
        payload["name"] = payload["name"].replace("BCC ", "PDF ", 1)
    return payload


def existing_pdf_names() -> dict[str, str]:
    data = api("GET", "/api/v1/workflows?limit=250")
    rows = data.get("data") or []
    found = {}
    for row in rows:
        name = row.get("name") or ""
        if name.startswith("PDF "):
            found[name] = row.get("id")
    return found


def main() -> None:
    existing = existing_pdf_names()
    created = []
    for wid in BCC_IDS:
        source = json.loads((EXPORT_DIR / f"{wid}.json").read_text())
        payload = clone_workflow(source)
        name = payload["name"]
        if name in existing:
            print(f"SKIP already exists: {name} ({existing[name]})")
            created.append({"name": name, "id": existing[name], "skipped": True})
            continue
        result = api("POST", "/api/v1/workflows", payload)
        wf_id = result["id"]
        activated = api("POST", f"/api/v1/workflows/{wf_id}/activate")
        created.append(
            {
                "name": result.get("name"),
                "id": wf_id,
                "active": activated.get("active", True),
                "open": f"{N8N_URL}/workflow/{wf_id}",
            }
        )
        print(f"CREATED {result.get('name')} {wf_id} active={activated.get('active')}")

    OUT_DIR.joinpath("pdf-n8n-workflows.json").write_text(
        json.dumps({"instance": N8N_URL, "workflows": created}, indent=2) + "\n"
    )


if __name__ == "__main__":
    main()
