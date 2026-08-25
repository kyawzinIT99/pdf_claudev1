# PDF News Ingest — eighth n8n workflow

Pulls Myanmar news and humanitarian feeds into the PDF site **as drafts**.
The seven existing PDF workflows are not touched by this and share nothing
with it except the site itself.

## What it does

```
Every 30 min → read 5 feeds → normalise + filter → skip already seen
             → POST /api/posts   status: "draft"
```

An administrator then reviews the drafts in Admin and publishes the ones worth
publishing. That human publish is what fires the existing
`PDF Publish Distribution` webhook, exactly as it does today.

**This workflow never publishes.** `status` is hard-coded to `draft` in the
HTTP node, and `app/lib/n8n.ts` already documents the rule it respects:
*"Draft and review content must never call this."*

## Install

1. n8n → **Workflows → Import from File** → `pdf-news-ingest.workflow.json`
2. Set two n8n environment variables:

   | Variable | Value |
   |---|---|
   | `PDF_SITE_ORIGIN` | public origin of the site, no trailing slash |
   | `PDF_ADMIN_WRITE_TOKEN` | same value as the site's `ADMIN_WRITE_TOKEN` |

3. Set `ADMIN_WRITE_TOKEN` on the website to a long random value. Generate one
   with `openssl rand -hex 32`. It is the only thing standing between the open
   internet and your drafts queue, so do not reuse a token from anywhere else.
4. **Run once manually** and confirm drafts appear in Admin before activating
   the schedule.

## Sources

Verified 25 Aug 2026 as returning a live feed to a *server-side* client, which
is what n8n is:

| Source | Feed | Language |
|---|---|---|
| Myanmar Now | `myanmar-now.org/en/feed/` | English |
| Myanmar Now | `myanmar-now.org/mm/feed/` | Burmese |
| DVB | `english.dvb.no/feed` | English |
| RFA | `rfa.org/burmese/rss2.xml` | Burmese |
| BNI Online | `bnionline.net/en/rss.xml` | English |

Add or remove sources by editing the **Feed list** node only. Nothing else
needs changing.

### Sources that do not work server-side

These return a live feed in a browser but block n8n, so they were left out
rather than added as a silent failure:

| Source | Result |
|---|---|
| The Irrawaddy, Frontier Myanmar, Mizzima | 403, Cloudflare |
| ReliefWeb RSS | 406 "Blocked due to bot activity" |
| ReliefWeb API v2 | 403 — needs a registered `appname`, apply at reliefweb.int/help/api |

ReliefWeb is worth pursuing for humanitarian reporting; it needs that
registration first.

## Two things to know before changing it

**Do not enable `keywordFilter` on a Myanmar-dedicated outlet.** Burmese copy
never contains the English string "Myanmar", so an English keyword filter
silently discards every Burmese article. In testing this was 13 of 25 items.
The filter exists only for general or global feeds.

**Attribution comes from the article hostname, not the Feed list node.** The
RSS node fans one feed into many items, so item pairing is unreliable and
every article would otherwise inherit the first feed's name.

## Editorial

Items are stored as a summary plus attribution and a link to the original.
Full articles are not republished. Keep it that way — for an organisation whose
credibility rests on its record, quietly republishing other outlets' work in
full is the wrong trade.
