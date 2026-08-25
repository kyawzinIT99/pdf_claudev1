"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CommunityPost,
  type PublicPlacement,
  seedPosts,
} from "../lib/content";
import { LogoMark } from "../components/LogoMark";
import { sectionDefinitions, sectionKeys } from "../lib/sections";
import type { StaffUser } from "../lib/auth";
import { AdminLogin } from "./AdminLogin";
import { TeamAccess } from "./TeamAccess";
import {
  MrKyawZinAssistant,
  type AssistantDraft,
} from "./MrKyawZinAssistant";
import { AdminOperations } from "./AdminOperations";
import { InquiryAlert } from "./InquiryAlert";
import { PageManager } from "./PageManager";
import { EventsManager } from "./EventsManager";
import { SubscribersManager } from "./SubscribersManager";
import { CustomersReport } from "./CustomersReport";

const channels = ["Website", "Facebook", "Telegram", "Email"];
const MAX_GALLERY_PHOTOS = 4;

type AdminSection =
  | "overview"
  | "composer"
  | "content"
  | "distribution"
  | "team"
  | "security"
  | "pages"
  | "events"
  | "subscribers"
  | "inquiries"
  | "reports";

type AdminNavItem = {
  id: AdminSection;
  label: string;
  number: string;
  adminOnly?: boolean;
};

const adminNavItems: AdminNavItem[] = [
  { id: "overview", label: "Overview", number: "01" },
  { id: "composer", label: "Create post", number: "02" },
  { id: "content", label: "Content library", number: "03" },
  { id: "distribution", label: "Distribution", number: "04" },
  { id: "team", label: "Team access", number: "05" },
  { id: "security", label: "Security & records", number: "06" },
  { id: "pages", label: "Public pages", number: "07" },
  { id: "events", label: "Events", number: "08" },
  { id: "subscribers", label: "Subscribers", number: "09", adminOnly: true },
  { id: "inquiries", label: "Enquiries", number: "10", adminOnly: true },
  { id: "reports", label: "Reports", number: "11", adminOnly: true },
];

type ComposerMedia = {
  id: number;
  name: string;
  previewUrl: string;
};

type Composer = {
  title: string;
  excerpt: string;
  body: string;
  category: CommunityPost["category"];
  placement: PublicPlacement;
  channels: string[];
  media: ComposerMedia[];
  mediaAlt: string;
};

const emptyComposer: Composer = {
  title: "",
  excerpt: "",
  body: "",
  category: "Field notes",
  placement: "stories",
  channels: ["Website"],
  media: [],
  mediaAlt: "",
};

export function AdminDashboard() {
  const [session, setSession] = useState<StaffUser | null | undefined>(undefined);
  const [posts, setPosts] = useState<CommunityPost[]>(seedPosts);
  const [composer, setComposer] = useState<Composer>(emptyComposer);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        setSession(response.ok ? payload.user : null);
      })
      .catch(() => setSession(null));
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "") as AdminSection;
    if (adminNavItems.some((item) => item.id === hash)) {
      const timer = window.setTimeout(() => setActiveSection(hash), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  function openSection(section: AdminSection) {
    setActiveSection(section);
    window.history.replaceState(null, "", `#${section}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (!session) return;
    fetch("/api/posts?scope=admin", { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload) => {
        if (Array.isArray(payload.posts) && payload.posts.length) {
          setPosts(payload.posts);
        }
      })
      .catch(() => {
        setNotice("The protected content library is temporarily unavailable.");
      });
  }, [session]);

  const counts = useMemo(
    () => ({
      published: posts.filter((post) => post.status === "published").length,
      review: posts.filter((post) => post.status === "review").length,
      drafts: posts.filter((post) => post.status === "draft").length,
    }),
    [posts],
  );

  function toggleChannel(channel: string) {
    setComposer((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel],
    }));
  }

  function revokeComposerPreviews(items: ComposerMedia[]) {
    items.forEach((item) => {
      if (item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  }

  async function uploadMedia(file: File | undefined) {
    if (!file) return;
    if (composer.media.length >= MAX_GALLERY_PHOTOS) {
      setNotice(`Each story can include up to ${MAX_GALLERY_PHOTOS} photos.`);
      return;
    }
    setUploadingMedia(true);
    setNotice("");
    const localPreview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : "";
    try {
      const form = new FormData();
      form.append("file", file);
      form.append(
        "altText",
        composer.mediaAlt.trim() || composer.title.trim() || file.name,
      );
      const response = await fetch("/api/media", { method: "POST", credentials: "same-origin", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to upload media");
      setComposer((current) => ({
        ...current,
        media: [
          ...current.media,
          {
            id: Number(payload.media.id),
            name: String(payload.media.filename),
            previewUrl: localPreview || `/api/media?id=${Number(payload.media.id)}`,
          },
        ].slice(0, MAX_GALLERY_PHOTOS),
      }));
      setNotice(
        `${payload.media.filename} added (${Math.min(composer.media.length + 1, MAX_GALLERY_PHOTOS)} of ${MAX_GALLERY_PHOTOS}). Publish the story to show it on the website.`,
      );
    } catch (error) {
      if (localPreview) URL.revokeObjectURL(localPreview);
      setNotice(error instanceof Error ? error.message : "Unable to upload media");
    } finally {
      setUploadingMedia(false);
    }
  }

  function removeMedia(mediaId: number) {
    setComposer((current) => {
      const target = current.media.find((item) => item.id === mediaId);
      if (target?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return {
        ...current,
        media: current.media.filter((item) => item.id !== mediaId),
      };
    });
  }

  async function savePost(status: "draft" | "review" | "published") {
    if (uploadingMedia) {
      setNotice("Please wait for the media upload to finish.");
      return;
    }
    if (!composer.title.trim()) {
      setNotice("Add a clear post title before saving.");
      return;
    }

    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/posts", {
        method: editingId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: composer.title,
          excerpt: composer.excerpt,
          body: composer.body,
          category: composer.category,
          placement: composer.placement,
          channels: composer.channels,
          mediaId: composer.media[0]?.id ?? null,
          mediaIds: composer.media.map((item) => item.id),
          status,
          id: editingId,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Content API unavailable");
      setPosts((current) =>
        editingId
          ? current.map((post) => post.id === editingId ? payload.post : post)
          : [payload.post, ...current],
      );
      revokeComposerPreviews(composer.media);
      setComposer(emptyComposer);
      setEditingId(null);
      setNotice(
        status === "draft"
          ? "Draft saved. Nothing was distributed."
          : "Sent for editorial review. Distribution remains locked.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save this post");
    } finally {
      setSaving(false);
    }
  }

  function editPost(post: CommunityPost) {
    setEditingId(post.id);
    const gallery =
      post.gallery?.length
        ? post.gallery
        : post.mediaId
          ? [
              {
                id: post.mediaId,
                url: post.mediaUrl || `/api/media?id=${post.mediaId}`,
                contentType: post.mediaType || "image/jpeg",
                alt: post.mediaAlt || "",
              },
            ]
          : [];
    setComposer({
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      category: post.category,
      placement: post.placement,
      channels: post.channels,
      media: gallery.map((item) => ({
        id: item.id,
        name: `Photo #${item.id}`,
        previewUrl: item.url,
      })),
      mediaAlt: post.mediaAlt || "",
    });
    openSection("composer");
  }

  async function publishPost(post: CommunityPost) {
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/posts", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          body: post.body,
          category: post.category,
          placement: post.placement,
          channels: post.channels,
          mediaId: post.mediaId ?? post.gallery?.[0]?.id ?? null,
          mediaIds:
            post.mediaIds?.length
              ? post.mediaIds
              : post.gallery?.map((item) => item.id) ||
                (post.mediaId ? [post.mediaId] : []),
          status: "published",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload.detail
            ? `${payload.error || "Unable to publish"} (${payload.detail})`
            : payload.error || "Unable to publish",
        );
      }
      setPosts((current) =>
        current.map((item) => item.id === post.id ? payload.post : item),
      );
      setNotice("Published to the website. No external channel was contacted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to publish");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(post: CommunityPost) {
    if (session?.role === "editor") {
      setNotice("Only Administrators and Owners can delete posts.");
      return;
    }
    const confirmed = window.confirm(
      `Delete “${post.title}”? This removes it from the website and content library.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(`/api/posts?id=${post.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload.detail
            ? `${payload.error || "Unable to delete post"} (${payload.detail})`
            : payload.error || "Unable to delete post",
        );
      }
      setPosts((current) => current.filter((item) => item.id !== post.id));
      if (editingId === post.id) {
        revokeComposerPreviews(composer.media);
        setComposer(emptyComposer);
        setEditingId(null);
      }
      setNotice(`Deleted “${post.title}”.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to delete post");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void savePost("review");
  }

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
    setSession(null);
  }

  if (session === undefined) {
    return (
      <main className="admin-auth-loading">
        <LogoMark />
        <p>Checking secure staff access…</p>
      </main>
    );
  }

  if (!session) {
    return <AdminLogin onSignedIn={setSession} />;
  }

  const visibleNav = adminNavItems.filter(
    (item) => !item.adminOnly || session.role !== "editor",
  );
  const sectionIndex = Math.max(
    0,
    visibleNav.findIndex((item) => item.id === activeSection),
  );
  const currentNav = visibleNav[sectionIndex] || visibleNav[0];
  const previousSection = visibleNav[sectionIndex - 1];
  const nextSection = visibleNav[sectionIndex + 1];
  const sectionTitle = currentNav?.label || "Overview";

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="wordmark admin-wordmark" href="/">
          <LogoMark />
          <span>BURMESE CATHOLIC COMMUNITY WA</span>
        </Link>
        <nav aria-label="Admin sections">
          {visibleNav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? "active" : undefined}
              onClick={() => openSection(item.id)}
            >
              <span>{item.number}</span> {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" />
          <p>
            Focused workspace
            <small>One section at a time · use arrows to move</small>
          </p>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p>STAFF WORKSPACE / {sectionTitle.toUpperCase()}</p>
            <h1>{sectionTitle}</h1>
          </div>
          <div className="editor-chip">
            <span>{session.displayName.slice(0, 2).toUpperCase()}</span>
            <p>{session.displayName}<small>{session.role}</small></p>
            <button type="button" onClick={() => void signOut()}>Sign out</button>
          </div>
        </header>

        {notice ? <div className="admin-notice" role="status">{notice}</div> : null}

        <div className="admin-stage" aria-live="polite">
        {activeSection === "overview" ? (
          <div className="admin-stage-panel">
            <InquiryAlert
              currentUser={session}
              onOpenQueue={() => openSection("inquiries")}
            />
            <section className="admin-overview" id="overview">
              <article>
                <span>Published</span>
                <strong>{counts.published.toString().padStart(2, "0")}</strong>
                <p>Live on the website</p>
              </article>
              <article>
                <span>In review</span>
                <strong>{counts.review.toString().padStart(2, "0")}</strong>
                <p>Waiting for approval</p>
              </article>
              <article>
                <span>Drafts</span>
                <strong>{counts.drafts.toString().padStart(2, "0")}</strong>
                <p>Private to staff</p>
              </article>
              <article className="distribution-card">
                <span>Distribution health</span>
                <strong>Website only</strong>
                <p>Website publishing only</p>
              </article>
            </section>
            <div className="admin-quick-jumps">
              <button type="button" onClick={() => openSection("composer")}>
                Create post →
              </button>
              {session.role !== "editor" ? (
                <button type="button" onClick={() => openSection("inquiries")}>
                  Open enquiries →
                </button>
              ) : null}
              <button type="button" onClick={() => openSection("events")}>
                Manage events →
              </button>
            </div>
          </div>
        ) : null}

        {activeSection === "composer" ? (
        <div className="admin-stage-panel admin-stage-composer">
        <div className="admin-grid">
          <form className="composer-panel is-focus" id="composer" onSubmit={handleSubmit}>
            <div className="panel-heading">
              <div>
                <p>CREATE</p>
                <h2>{editingId ? "Edit community update" : "New community update"}</h2>
              </div>
              <span>Human review required</span>
            </div>

            <label>
              Post title
              <input
                value={composer.title}
                onChange={(event) => setComposer({ ...composer, title: event.target.value })}
                placeholder="What happened, in clear human language?"
              />
            </label>

            <div className="form-row">
              <label>
                Post appears on page
                <select
                  value={composer.placement}
                  onChange={(event) =>
                    setComposer({
                      ...composer,
                      placement: event.target.value as PublicPlacement,
                    })
                  }
                >
                  {sectionKeys.map((key) => (
                    <option key={key} value={key}>
                      {sectionDefinitions[key].label}
                    </option>
                  ))}
                </select>
                <small className="field-guidance">
                  This chooses where this individual post will be published.
                </small>
              </label>
              <label>
                Category
                <select
                  value={composer.category}
                  onChange={(event) =>
                    setComposer({
                      ...composer,
                      category: event.target.value as CommunityPost["category"],
                    })
                  }
                >
                  <option>Field notes</option>
                  <option>Learning</option>
                  <option>Events</option>
                </select>
              </label>
            </div>

            <label>
              Short summary
              <textarea
                rows={3}
                value={composer.excerpt}
                onChange={(event) => setComposer({ ...composer, excerpt: event.target.value })}
                placeholder="A short introduction for story cards and social previews."
              />
            </label>

            <label>
              Full story
              <textarea
                rows={7}
                value={composer.body}
                onChange={(event) => setComposer({ ...composer, body: event.target.value })}
                placeholder="Write the complete update. Verify claims and personal details before review."
              />
            </label>

            <div
              className={
                composer.media.length
                  ? "upload-zone has-media gallery-upload"
                  : "upload-zone gallery-upload"
              }
            >
              <div className="composer-gallery-thumbs">
                {composer.media.map((item, index) => (
                  <div className="composer-gallery-thumb" key={item.id}>
                    {item.previewUrl ? (
                      <Image
                        src={item.previewUrl}
                        alt={item.name}
                        width={58}
                        height={58}
                        unoptimized
                      />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                    <button
                      type="button"
                      className="composer-gallery-remove"
                      onClick={() => removeMedia(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      ×
                    </button>
                    {index === 0 ? <em>Cover</em> : null}
                  </div>
                ))}
                {composer.media.length < MAX_GALLERY_PHOTOS ? (
                  <span className="composer-gallery-add">
                    {uploadingMedia ? "…" : "+"}
                  </span>
                ) : null}
              </div>
              <p>
                {uploadingMedia
                  ? "Uploading approved media…"
                  : composer.media.length
                    ? `${composer.media.length} of ${MAX_GALLERY_PHOTOS} photos attached`
                    : "Add approved photos (gallery style)"}
                <small>
                  Up to {MAX_GALLERY_PHOTOS} photos stay together as one story
                  album — they will not scatter across the site.
                </small>
              </p>
              <label className="upload-choose" htmlFor="post-media">
                {composer.media.length >= MAX_GALLERY_PHOTOS
                  ? "Limit reached"
                  : composer.media.length
                    ? "Add another photo"
                    : "Browse files"}
              </label>
              <input
                id="post-media"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                disabled={
                  uploadingMedia || composer.media.length >= MAX_GALLERY_PHOTOS
                }
                onChange={(event) => {
                  void uploadMedia(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </div>
            <label>
              Photo description
              <input
                value={composer.mediaAlt}
                maxLength={240}
                onChange={(event) =>
                  setComposer({ ...composer, mediaAlt: event.target.value })
                }
                placeholder="Describe the photos for people using screen readers."
              />
            </label>

            <fieldset>
              <legend>Future distribution preferences</legend>
              <div className="channel-options">
                {channels.map((channel) => (
                  <label key={channel}>
                    <input
                      type="checkbox"
                      checked={composer.channels.includes(channel)}
                      onChange={() => toggleChannel(channel)}
                    />
                    <span>{channel.slice(0, 2).toUpperCase()}</span>
                    {channel}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="composer-actions">
              <button
                className="button-save"
                type="button"
                disabled={saving}
                onClick={() => void savePost("draft")}
              >
                Save draft
              </button>
              <button
                className="button-save"
                type="button"
                disabled={!composer.title.trim()}
                onClick={() => setPreviewing(true)}
              >
                Preview
              </button>
              <button className="button-review" type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save for review →" : "Send for review →"}
              </button>
              {editingId && session.role !== "editor" ? (
                <button
                  type="button"
                  className="button-danger-text"
                  disabled={saving}
                  onClick={() => {
                    const current = posts.find((post) => post.id === editingId);
                    if (current) void deletePost(current);
                  }}
                >
                  Delete post
                </button>
              ) : null}
            </div>
          </form>

          <aside className="activity-panel composer-assistant-slot">
            <MrKyawZinAssistant
              draft={{
                title: composer.title,
                excerpt: composer.excerpt,
                body: composer.body,
                placement: composer.placement,
              }}
              onApplySuggestion={(suggestion: Partial<AssistantDraft>) =>
                setComposer((current) => ({ ...current, ...suggestion }))
              }
            />
          </aside>
        </div>
        </div>
        ) : null}

        {activeSection === "content" ? (
        <div className="admin-stage-panel">
        <section className="content-table is-focus" id="content">
          <div className="panel-heading">
            <div>
              <p>CONTENT LIBRARY</p>
              <h2>Recent updates</h2>
            </div>
            <button type="button" onClick={() => openSection("composer")}>
              New post →
            </button>
          </div>
          <div className="table-head">
            <span>Content</span><span>Status</span><span>Destination</span><span>Action</span>
          </div>
          {posts.map((post) => (
            <article className="content-row" key={post.id}>
              <div>
                {post.mediaUrl && post.mediaType?.startsWith("image/") ? (
                  <Image
                    src={post.mediaUrl}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                  />
                ) : (
                  <span>{post.category.slice(0, 2).toUpperCase()}</span>
                )}
                <p>
                  {post.title}
                  <small>
                    {post.category} · {post.author}
                    {(post.gallery?.length || 0) > 1
                      ? ` · ${post.gallery!.length} photos`
                      : ""}
                  </small>
                </p>
              </div>
              <strong className={`status-${post.status}`}>{post.status}</strong>
              <p>{sectionDefinitions[post.placement].label}</p>
              <div className="row-actions">
                <button type="button" onClick={() => editPost(post)}>Edit</button>
                {post.status === "review" && session.role !== "editor" && (
                  <button
                    type="button"
                    className="button-publish"
                    disabled={saving}
                    onClick={() => void publishPost(post)}
                  >
                    Publish
                  </button>
                )}
                {session.role !== "editor" && (
                  <button
                    type="button"
                    className="button-danger-text"
                    disabled={saving}
                    onClick={() => void deletePost(post)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
        </div>
        ) : null}

        {activeSection === "distribution" ? (
        <div className="admin-stage-panel">
          <aside className="activity-panel is-focus" id="distribution">
            <div className="panel-heading">
              <div>
                <p>INTEGRATION STATUS</p>
                <h2>Website first</h2>
              </div>
            </div>
            <div className="integration-list">
              {[
                ["WB", "Website", "Available"],
                ["N8", "n8n AI automation", "Connected"],
                ["IQ", "Inquiry alerts", "Connected"],
                ["FB", "Facebook / Telegram channels", "Ready for channel credentials"],
              ].map(([code, label, status]) => (
                <article key={label}>
                  <span>{code}</span>
                  <p>{label}<small>{status}</small></p>
                  <i className={status === "Available" || status === "Connected" ? "healthy" : ""} />
                </article>
              ))}
            </div>
            <div className="automation-explainer">
              <p>AI AUTOMATION</p>
              <h3>Dynamic site linked to n8n.</h3>
              <p>
                After administrator approval, published posts and community inquiries
                are handed to n8n for AI automation. Draft and review content stays private.
              </p>
              <div className="mini-flow">
                <span>Draft</span><b>→</b><span>Review</span><b>→</b><span>Website</span><b>→</b><span>n8n AI</span>
              </div>
            </div>
          </aside>
        </div>
        ) : null}

        {activeSection === "team" ? (
          <div className="admin-stage-panel"><TeamAccess currentUser={session} /></div>
        ) : null}
        {activeSection === "security" ? (
          <div className="admin-stage-panel">
            <AdminOperations currentUser={session} panel="security" />
          </div>
        ) : null}
        {activeSection === "pages" ? (
          <div className="admin-stage-panel"><PageManager currentUser={session} /></div>
        ) : null}
        {activeSection === "events" ? (
          <div className="admin-stage-panel"><EventsManager /></div>
        ) : null}
        {activeSection === "subscribers" && session.role !== "editor" ? (
          <div className="admin-stage-panel">
            <SubscribersManager currentUser={session} />
          </div>
        ) : null}
        {activeSection === "inquiries" && session.role !== "editor" ? (
          <div className="admin-stage-panel">
            <AdminOperations currentUser={session} panel="inquiries" />
          </div>
        ) : null}
        {activeSection === "reports" && session.role !== "editor" ? (
          <div className="admin-stage-panel">
            <CustomersReport currentUser={session} />
          </div>
        ) : null}
        </div>

        <nav className="admin-section-rail" aria-label="Move between admin sections">
          <button
            type="button"
            className="admin-rail-arrow"
            disabled={!previousSection}
            onClick={() => previousSection && openSection(previousSection.id)}
            aria-label={
              previousSection ? `Previous: ${previousSection.label}` : "No previous section"
            }
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6 9 12l6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{previousSection ? previousSection.label : "Start"}</span>
          </button>
          <div className="admin-rail-status">
            <div className="admin-rail-dots" aria-hidden="true">
              {visibleNav.map((item, index) => (
                <i
                  key={item.id}
                  className={index === sectionIndex ? "is-active" : undefined}
                />
              ))}
            </div>
            <strong>{sectionTitle}</strong>
            <span>
              {(sectionIndex + 1).toString().padStart(2, "0")} of{" "}
              {visibleNav.length.toString().padStart(2, "0")}
            </span>
          </div>
          <button
            type="button"
            className="admin-rail-arrow is-next"
            disabled={!nextSection}
            onClick={() => nextSection && openSection(nextSection.id)}
            aria-label={nextSection ? `Next: ${nextSection.label}` : "No next section"}
          >
            <span>{nextSection ? nextSection.label : "End"}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </nav>

        {previewing && (
          <div className="preview-overlay" role="dialog" aria-modal="true">
            <article>
              <button type="button" onClick={() => setPreviewing(false)}>Close</button>
              <span>{composer.category}</span>
              <h2>{composer.title || "Untitled update"}</h2>
              <p>{composer.excerpt}</p>
              {composer.media.length ? (
                <div className="preview-gallery">
                  {composer.media.map((item) => (
                    <Image
                      key={item.id}
                      src={item.previewUrl}
                      alt={item.name}
                      width={120}
                      height={90}
                      unoptimized
                    />
                  ))}
                </div>
              ) : null}
              <div>{composer.body}</div>
              <small>Private preview · {sectionDefinitions[composer.placement].label}</small>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
