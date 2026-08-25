"use client";

import { FormEvent, useEffect, useState } from "react";
import type { StaffUser } from "../lib/auth";
import {
  cloneAboutProfile,
  defaultAboutProfile,
  type AboutProfile,
} from "../lib/bcc-profile";
import {
  defaultHomePage,
  type HomePageSettings,
} from "../lib/home";
import {
  sectionDefinitions,
  sectionKeys,
  type SectionFeature,
  type SectionKey,
} from "../lib/sections";
import {
  defaultCertificatesContent,
  defaultGivingContent,
  type CertificateItem,
  type CertificatesContent,
  type GivingContent,
  type PageStructuredContent,
} from "../lib/page-content";
import {
  defaultPageMedia,
  supportsPageMedia,
  type PageMedia,
} from "../lib/page-media";
import { AboutProfileEditor } from "./AboutProfileEditor";

type PageFields = {
  eyebrow: string;
  title: string;
  summary: string;
  statement: string;
  features: [SectionFeature, SectionFeature, SectionFeature];
  about: AboutProfile;
  media?: PageMedia;
  content?: PageStructuredContent;
};

type PageSelection = "home" | SectionKey;

function defaults(key: SectionKey): PageFields {
  const page = sectionDefinitions[key];
  return {
    eyebrow: page.eyebrow,
    title: page.title,
    summary: page.summary,
    statement: page.statement,
    features: page.features.map((feature) => ({ ...feature })) as PageFields["features"],
    about: cloneAboutProfile(defaultAboutProfile),
    media: supportsPageMedia(key) ? { ...defaultPageMedia[key], featureImages: defaultPageMedia[key].featureImages.map((item) => ({ ...item })) as PageMedia["featureImages"] } : undefined,
    content:
      key === "giving"
        ? { giving: { ...defaultGivingContent } }
        : key === "certificates"
          ? {
              certificates: {
                galleryIntro: defaultCertificatesContent.galleryIntro,
                items: defaultCertificatesContent.items.map((item) => ({ ...item })),
              },
            }
          : undefined,
  };
}

export function PageManager({ currentUser }: { currentUser: StaffUser }) {
  const [key, setKey] = useState<PageSelection>("about");
  const [fields, setFields] = useState<PageFields>(() => defaults("about"));
  const [home, setHome] = useState<HomePageSettings>(defaultHomePage);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingPageImage, setUploadingPageImage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const endpoint = key === "home"
      ? "/api/home"
      : `/api/pages?key=${encodeURIComponent(key)}`;
    fetch(endpoint, {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload) => {
        if (key === "home" && payload.home) setHome(payload.home);
        if (key !== "home" && payload.page) {
          const fallback = defaults(key);
          setFields({
            ...fallback,
            ...payload.page,
            features: payload.page.features || fallback.features,
            about: payload.page.about || fallback.about,
            media: payload.page.media || fallback.media,
            content: payload.page.content || fallback.content,
          });
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setNotice("Using the reviewed repository copy for this page.");
      });
    if (key === "get-involved") {
      fetch("/api/home", {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((payload) => {
          if (payload.home) setHome(payload.home);
        })
        .catch(() => undefined);
    }
    return () => controller.abort();
  }, [key]);

  function selectPage(nextKey: PageSelection) {
    setKey(nextKey);
    if (nextKey === "home") {
      setHome(defaultHomePage);
    } else {
      setFields(defaults(nextKey));
    }
    setNotice("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(key === "home" ? "/api/home" : "/api/pages", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(key === "home" ? home : { key, ...fields }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save page");
      if (key === "home" && payload.home) setHome(payload.home);
      if (key === "get-involved") {
        const homeResponse = await fetch("/api/home", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(home),
        });
        const homePayload = await homeResponse.json();
        if (!homeResponse.ok) throw new Error(homePayload.error || "Unable to save Telegram training");
        if (homePayload.home) setHome(homePayload.home);
      }
      if (key !== "home" && payload.page) {
        const fallback = defaults(key);
        setFields({
          ...fallback,
          ...payload.page,
          features: payload.page.features || fallback.features,
          about: payload.page.about || fallback.about,
          media: payload.page.media || fallback.media,
          content: payload.page.content || fallback.content,
        });
      }
      setNotice(
        key === "home"
          ? "Home page public copy, pathways and Telegram training updated."
          : key === "get-involved"
            ? "Get involved copy and Telegram training updated."
            : `${sectionDefinitions[key].label} public copy and photos updated.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save page");
    } finally {
      setSaving(false);
    }
  }

  function updateAbout(patch: Partial<AboutProfile>) {
    setFields((current) => ({
      ...current,
      about: { ...current.about, ...patch },
    }));
  }

  function updateGiving(patch: Partial<GivingContent>) {
    setFields((current) => ({
      ...current,
      content: {
        ...current.content,
        giving: { ...(current.content?.giving || defaultGivingContent), ...patch },
      },
    }));
  }

  function updateCertificates(next: CertificatesContent) {
    setFields((current) => ({
      ...current,
      content: { ...current.content, certificates: next },
    }));
  }

  async function uploadCertificateImage(file: File | undefined, index: number) {
    if (!file || key !== "certificates" || !fields.content?.certificates) return;
    setUploadingPageImage(`cert-${index}`);
    setNotice("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set(
        "altText",
        fields.content.certificates.items[index]?.imageAlt ||
          fields.content.certificates.items[index]?.title ||
          file.name,
      );
      const response = await fetch("/api/media", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to upload image");
      const mediaId = Number(payload.media.id);
      const url = `/api/media?id=${mediaId}`;
      const items = fields.content.certificates.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              imageUrl: url,
              imageAlt: item.imageAlt || String(payload.media.alt_text || item.title || file.name),
            }
          : item,
      );
      updateCertificates({ ...fields.content.certificates, items });
      setNotice("Certificate image uploaded. Click Update public page to publish it.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to upload image");
    } finally {
      setUploadingPageImage(null);
    }
  }

  async function uploadHeroImage(file: File | undefined) {
    if (!file) return;
    setUploadingHero(true);
    setNotice("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("altText", home.heroImageAlt || file.name);
      const response = await fetch("/api/media", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to upload hero image");
      const mediaId = Number(payload.media.id);
      setHome((current) => ({
        ...current,
        heroImageUrl: `/api/media?id=${mediaId}`,
        heroImageAlt:
          current.heroImageAlt.trim() ||
          String(payload.media.alt_text || file.name).slice(0, 240),
      }));
      setNotice(
        "Hero image uploaded. Click Save page settings to show it on the public home page.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to upload hero image");
    } finally {
      setUploadingHero(false);
    }
  }

  async function uploadPageImage(
    file: File | undefined,
    target: "hero" | 0 | 1 | 2,
  ) {
    if (!file || !fields.media || !supportsPageMedia(key)) return;
    const uploadKey = target === "hero" ? "hero" : `feature-${target}`;
    setUploadingPageImage(uploadKey);
    setNotice("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set(
        "altText",
        target === "hero"
          ? fields.media.heroImageAlt || file.name
          : fields.media.featureImages[target].alt || file.name,
      );
      const response = await fetch("/api/media", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to upload image");
      const mediaId = Number(payload.media.id);
      const url = `/api/media?id=${mediaId}`;
      const alt = String(payload.media.alt_text || file.name).slice(0, 240);
      setFields((current) => {
        if (!current.media) return current;
        if (target === "hero") {
          return {
            ...current,
            media: {
              ...current.media,
              heroImageUrl: url,
              heroImageAlt: current.media.heroImageAlt.trim() || alt,
            },
          };
        }
        const featureImages = current.media.featureImages.map((item, index) =>
          index === target
            ? { url, alt: item.alt.trim() || alt }
            : item,
        ) as PageMedia["featureImages"];
        return { ...current, media: { ...current.media, featureImages } };
      });
      setNotice("Photo uploaded. Click Update public page to show it on the website.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to upload image");
    } finally {
      setUploadingPageImage(null);
    }
  }

  const telegramTrainingEditor = (
    <div className="home-pathway-editor wide" id="telegram-training-editor">
      <div className="home-pathway-editor-heading">
        <strong>Telegram training</strong>
        <small>Shown on Home, Get involved and Our work after you click Update public page</small>
      </div>
      <fieldset>
        <legend>Public Telegram course</legend>
        <label>
          Title
          <input
            maxLength={100}
            required
            value={home.telegramTraining.title}
            onChange={(event) =>
              setHome({
                ...home,
                telegramTraining: { ...home.telegramTraining, title: event.target.value },
              })
            }
          />
        </label>
        <label className="wide">
          Description
          <textarea
            rows={3}
            maxLength={360}
            required
            value={home.telegramTraining.description}
            onChange={(event) =>
              setHome({
                ...home,
                telegramTraining: { ...home.telegramTraining, description: event.target.value },
              })
            }
          />
        </label>
        <label>
          Button label
          <input
            maxLength={80}
            required
            value={home.telegramTraining.cta}
            onChange={(event) =>
              setHome({
                ...home,
                telegramTraining: { ...home.telegramTraining, cta: event.target.value },
              })
            }
          />
        </label>
        <label className="wide">
          Telegram link
          <input
            maxLength={500}
            required
            value={home.telegramTraining.url}
            onChange={(event) =>
              setHome({
                ...home,
                telegramTraining: { ...home.telegramTraining, url: event.target.value },
              })
            }
            placeholder="https://t.me/AIkzautomation_bot?start=public"
          />
          <small className="field-guidance">Paste the public t.me training bot link. Only https://t.me links are saved.</small>
        </label>
        <label className="pathway-visibility">
          <input
            type="checkbox"
            checked={home.telegramTraining.visible}
            onChange={(event) =>
              setHome({
                ...home,
                telegramTraining: { ...home.telegramTraining, visible: event.target.checked },
              })
            }
          />
          Show Telegram training on the public site
        </label>
      </fieldset>
    </div>
  );

  return (
    <section className="operations-panel" id="pages">
      <div className="panel-heading">
        <div><p>WEBSITE PAGE SETTINGS</p><h2>Edit website pages</h2></div>
        <span>Administrator approval</span>
      </div>
      {currentUser.role === "editor" ? (
        <p className="team-readonly">
          Editors can place posts on every public page. Only Administrators and
          Owners can change the page-level headline and statement.
        </p>
      ) : (
        <form className="page-manager-form" onSubmit={save}>
          <label>
            Edit website page
            <select value={key} onChange={(event) => selectPage(event.target.value as PageSelection)}>
              <option value="home">Home page</option>
              {sectionKeys.map((item) => (
                <option key={item} value={item}>{sectionDefinitions[item].label}</option>
              ))}
            </select>
            <small className="field-guidance">
              This changes the permanent page wording and framework—not a post.
            </small>
          </label>
          {key === "home" ? (
            <>
              <label>
                Announcement
                <input maxLength={120} required value={home.announcement} onChange={(event) => setHome({ ...home, announcement: event.target.value })} />
              </label>
              <label>
                Hero eyebrow
                <input maxLength={80} required value={home.eyebrow} onChange={(event) => setHome({ ...home, eyebrow: event.target.value })} />
              </label>
              <label className="wide">
                Hero headline
                <input maxLength={160} required value={home.title} onChange={(event) => setHome({ ...home, title: event.target.value })} />
              </label>
              <label className="wide">
                Hero introduction
                <textarea rows={3} maxLength={600} required value={home.intro} onChange={(event) => setHome({ ...home, intro: event.target.value })} />
              </label>
              <label className="wide">
                Hero image URL
                <input maxLength={500} required value={home.heroImageUrl} onChange={(event) => setHome({ ...home, heroImageUrl: event.target.value })} />
                <small className="field-guidance">
                  Prefer Upload hero image below (sets `/api/media?id=…`). Default bundled path also works after deploy.
                </small>
              </label>
              <label className="wide">
                Upload hero image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={uploadingHero || saving}
                  onChange={(event) => {
                    void uploadHeroImage(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <small className="field-guidance">
                  {uploadingHero
                    ? "Uploading…"
                    : "Replaces the hero photo on the public website after you save."}
                </small>
              </label>
              <label className="wide">
                Hero image description
                <input maxLength={240} required value={home.heroImageAlt} onChange={(event) => setHome({ ...home, heroImageAlt: event.target.value })} />
                <small className="field-guidance">Describe the people and activity for visitors using assistive technology.</small>
              </label>
              <label>
                Pathway heading
                <input maxLength={160} required value={home.helpTitle} onChange={(event) => setHome({ ...home, helpTitle: event.target.value })} />
              </label>
              <label>
                Pathway introduction
                <input maxLength={300} required value={home.helpIntro} onChange={(event) => setHome({ ...home, helpIntro: event.target.value })} />
              </label>
              <div className="home-pathway-editor wide">
                <div className="home-pathway-editor-heading">
                  <strong>Homepage pathways</strong>
                  <small>Titles, descriptions, links and visibility</small>
                </div>
                {home.pathways.map((pathway, index) => (
                  <fieldset key={index}>
                    <legend>{String(index + 1).padStart(2, "0")}</legend>
                    <label>
                      Title
                      <input
                        maxLength={100}
                        required
                        value={pathway.title}
                        onChange={(event) => {
                          const pathways = [...home.pathways] as HomePageSettings["pathways"];
                          pathways[index] = { ...pathway, title: event.target.value };
                          setHome({ ...home, pathways });
                        }}
                      />
                    </label>
                    <label className="wide">
                      Description
                      <textarea
                        rows={2}
                        maxLength={360}
                        required
                        value={pathway.description}
                        onChange={(event) => {
                          const pathways = [...home.pathways] as HomePageSettings["pathways"];
                          pathways[index] = { ...pathway, description: event.target.value };
                          setHome({ ...home, pathways });
                        }}
                      />
                    </label>
                    <label className="wide">
                      Destination link
                      <input
                        maxLength={500}
                        required
                        value={pathway.href}
                        onChange={(event) => {
                          const pathways = [...home.pathways] as HomePageSettings["pathways"];
                          pathways[index] = { ...pathway, href: event.target.value };
                          setHome({ ...home, pathways });
                        }}
                      />
                    </label>
                    <label className="pathway-visibility">
                      <input
                        type="checkbox"
                        checked={pathway.visible}
                        onChange={(event) => {
                          const pathways = [...home.pathways] as HomePageSettings["pathways"];
                          pathways[index] = { ...pathway, visible: event.target.checked };
                          setHome({ ...home, pathways });
                        }}
                      />
                      Show on home page
                    </label>
                  </fieldset>
                ))}
              </div>
              {telegramTrainingEditor}
            </>
          ) : (
            <>
              {key === "about" && (
                <div className="about-editor-selected wide" role="status">
                  <span>ABOUT PAGE SELECTED</span>
                  <strong>Full history, organisation details and contact editor</strong>
                  <small>Changes saved here update the public About page.</small>
                </div>
              )}
              {key === "get-involved" && telegramTrainingEditor}
              {supportsPageMedia(key) && fields.media && (
                <div className="home-pathway-editor wide" id="page-photos">
                  <div className="home-pathway-editor-heading">
                    <strong>Page photos</strong>
                    <small>
                      Upload the public {sectionDefinitions[key].label} photo here, then click Update public page
                    </small>
                  </div>
                  <fieldset>
                    <legend>Main photo</legend>
                    <label className="wide">
                      Image URL
                      <input
                        maxLength={500}
                        required
                        value={fields.media.heroImageUrl}
                        onChange={(event) =>
                          setFields({
                            ...fields,
                            media: { ...fields.media!, heroImageUrl: event.target.value },
                          })
                        }
                      />
                    </label>
                    <label className="wide">
                      Upload photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        disabled={Boolean(uploadingPageImage) || saving}
                        onChange={(event) => {
                          void uploadPageImage(event.target.files?.[0], "hero");
                          event.target.value = "";
                        }}
                      />
                      <small className="field-guidance">
                        {uploadingPageImage === "hero" ? "Uploading…" : "Shows on the public page hero."}
                      </small>
                    </label>
                    <label className="wide">
                      Photo description
                      <input
                        maxLength={240}
                        required
                        value={fields.media.heroImageAlt}
                        onChange={(event) =>
                          setFields({
                            ...fields,
                            media: { ...fields.media!, heroImageAlt: event.target.value },
                          })
                        }
                      />
                    </label>
                    {fields.media.heroImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={fields.media.heroImageUrl}
                        alt=""
                        width={320}
                        height={200}
                        style={{ maxWidth: "100%", height: "auto", borderRadius: 8 }}
                      />
                    ) : null}
                  </fieldset>
                  {key === "our-work" &&
                    fields.media.featureImages.map((image, index) => (
                      <fieldset key={`feature-photo-${index}`}>
                        <legend>{`Feature photo ${String(index + 1).padStart(2, "0")}`}</legend>
                        <label className="wide">
                          Image URL
                          <input
                            maxLength={500}
                            value={image.url}
                            onChange={(event) => {
                              const featureImages = fields.media!.featureImages.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, url: event.target.value } : item,
                              ) as PageMedia["featureImages"];
                              setFields({ ...fields, media: { ...fields.media!, featureImages } });
                            }}
                          />
                        </label>
                        <label className="wide">
                          Upload photo
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            disabled={Boolean(uploadingPageImage) || saving}
                            onChange={(event) => {
                              void uploadPageImage(event.target.files?.[0], index as 0 | 1 | 2);
                              event.target.value = "";
                            }}
                          />
                          <small className="field-guidance">
                            {uploadingPageImage === `feature-${index}`
                              ? "Uploading…"
                              : `Photo for feature card ${fields.features[index]?.title || index + 1}.`}
                          </small>
                        </label>
                        <label className="wide">
                          Photo description
                          <input
                            maxLength={240}
                            value={image.alt}
                            onChange={(event) => {
                              const featureImages = fields.media!.featureImages.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, alt: event.target.value } : item,
                              ) as PageMedia["featureImages"];
                              setFields({ ...fields, media: { ...fields.media!, featureImages } });
                            }}
                          />
                        </label>
                      </fieldset>
                    ))}
                </div>
              )}
              {key === "about" && (
                <AboutProfileEditor profile={fields.about} onChange={updateAbout} />
              )}
              {key === "giving" && fields.content?.giving && (
                <div className="home-pathway-editor wide" id="giving-totals-editor">
                  <div className="home-pathway-editor-heading">
                    <strong>Donation amount and total</strong>
                    <small>These figures appear on the public Giving page. Use AUD for Australian dollars (e.g. AUD 500).</small>
                  </div>
                  <label className="pathway-visibility">
                    <input
                      type="checkbox"
                      checked={fields.content.giving.showAmounts}
                      onChange={(event) => updateGiving({ showAmounts: event.target.checked })}
                    />
                    Show donation figures on the website
                  </label>
                  <label>
                    Current amount label
                    <input
                      maxLength={80}
                      required
                      value={fields.content.giving.amountLabel}
                      onChange={(event) => updateGiving({ amountLabel: event.target.value })}
                    />
                  </label>
                  <label>
                    Current amount value
                    <input
                      maxLength={40}
                      required
                      placeholder="e.g. AUD 500"
                      value={fields.content.giving.amountValue}
                      onChange={(event) => updateGiving({ amountValue: event.target.value })}
                    />
                  </label>
                  <label>
                    Total label
                    <input
                      maxLength={80}
                      required
                      value={fields.content.giving.totalLabel}
                      onChange={(event) => updateGiving({ totalLabel: event.target.value })}
                    />
                  </label>
                  <label>
                    Total value
                    <input
                      maxLength={40}
                      required
                      placeholder="e.g. AUD 2,500"
                      value={fields.content.giving.totalValue}
                      onChange={(event) => updateGiving({ totalValue: event.target.value })}
                    />
                  </label>
                  <label className="wide">
                    Transparency note
                    <textarea
                      rows={3}
                      maxLength={600}
                      required
                      value={fields.content.giving.note}
                      onChange={(event) => updateGiving({ note: event.target.value })}
                    />
                  </label>
                  <label className="wide">
                    How to give
                    <textarea
                      rows={3}
                      maxLength={800}
                      required
                      value={fields.content.giving.howToGive}
                      onChange={(event) => updateGiving({ howToGive: event.target.value })}
                    />
                  </label>
                  <label>
                    Updated label
                    <input
                      maxLength={80}
                      required
                      value={fields.content.giving.updatedLabel}
                      onChange={(event) => updateGiving({ updatedLabel: event.target.value })}
                    />
                  </label>
                </div>
              )}
              {key === "certificates" && fields.content?.certificates && (
                <div className="home-pathway-editor wide" id="certificates-editor">
                  <div className="home-pathway-editor-heading">
                    <strong>Certificates gallery</strong>
                    <small>Only items marked visible appear on the public Certificates page</small>
                  </div>
                  <label className="wide">
                    Gallery introduction
                    <textarea
                      rows={2}
                      maxLength={500}
                      required
                      value={fields.content.certificates.galleryIntro}
                      onChange={(event) =>
                        updateCertificates({
                          ...fields.content!.certificates!,
                          galleryIntro: event.target.value,
                        })
                      }
                    />
                  </label>
                  {fields.content.certificates.items.map((item, index) => (
                    <fieldset key={item.id}>
                      <legend>{`Certificate ${String(index + 1).padStart(2, "0")}`}</legend>
                      <label className="pathway-visibility">
                        <input
                          type="checkbox"
                          checked={item.visible}
                          onChange={(event) => {
                            const items = fields.content!.certificates!.items.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, visible: event.target.checked } : row,
                            );
                            updateCertificates({ ...fields.content!.certificates!, items });
                          }}
                        />
                        Visible on website
                      </label>
                      <label>
                        Title
                        <input
                          maxLength={140}
                          required
                          value={item.title}
                          onChange={(event) => {
                            const items = fields.content!.certificates!.items.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, title: event.target.value } : row,
                            );
                            updateCertificates({ ...fields.content!.certificates!, items });
                          }}
                        />
                      </label>
                      <label>
                        Issuer
                        <input
                          maxLength={120}
                          value={item.issuer}
                          onChange={(event) => {
                            const items = fields.content!.certificates!.items.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, issuer: event.target.value } : row,
                            );
                            updateCertificates({ ...fields.content!.certificates!, items });
                          }}
                        />
                      </label>
                      <label>
                        Year
                        <input
                          maxLength={20}
                          value={item.year}
                          onChange={(event) => {
                            const items = fields.content!.certificates!.items.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, year: event.target.value } : row,
                            );
                            updateCertificates({ ...fields.content!.certificates!, items });
                          }}
                        />
                      </label>
                      <label className="wide">
                        Description
                        <textarea
                          rows={2}
                          maxLength={400}
                          value={item.description}
                          onChange={(event) => {
                            const items = fields.content!.certificates!.items.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, description: event.target.value } : row,
                            );
                            updateCertificates({ ...fields.content!.certificates!, items });
                          }}
                        />
                      </label>
                      <label className="wide">
                        Image URL
                        <input
                          maxLength={500}
                          value={item.imageUrl}
                          onChange={(event) => {
                            const items = fields.content!.certificates!.items.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, imageUrl: event.target.value } : row,
                            );
                            updateCertificates({ ...fields.content!.certificates!, items });
                          }}
                        />
                      </label>
                      <label className="wide">
                        Upload certificate image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          disabled={Boolean(uploadingPageImage) || saving}
                          onChange={(event) => {
                            void uploadCertificateImage(event.target.files?.[0], index);
                            event.target.value = "";
                          }}
                        />
                        <small className="field-guidance">
                          {uploadingPageImage === `cert-${index}`
                            ? "Uploading…"
                            : "Upload a scan or photo, then Update public page."}
                        </small>
                      </label>
                      <button
                        type="button"
                        className="button-secondary"
                        disabled={fields.content!.certificates!.items.length <= 1}
                        onClick={() => {
                          const items = fields.content!.certificates!.items.filter((_, rowIndex) => rowIndex !== index);
                          updateCertificates({ ...fields.content!.certificates!, items });
                        }}
                      >
                        Remove
                      </button>
                    </fieldset>
                  ))}
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={(fields.content.certificates.items.length || 0) >= 12}
                    onClick={() => {
                      const nextIndex = fields.content!.certificates!.items.length + 1;
                      const item: CertificateItem = {
                        id: `cert-${Date.now()}`,
                        title: `Certificate ${nextIndex}`,
                        issuer: "",
                        year: "",
                        description: "",
                        imageUrl: "",
                        imageAlt: "",
                        visible: false,
                      };
                      updateCertificates({
                        ...fields.content!.certificates!,
                        items: [...fields.content!.certificates!.items, item],
                      });
                    }}
                  >
                    Add certificate
                  </button>
                </div>
              )}
              <label>
                Eyebrow
                <input maxLength={80} required value={fields.eyebrow} onChange={(event) => setFields({ ...fields, eyebrow: event.target.value })} />
              </label>
              <label className="wide">
                Headline
                <input maxLength={160} required value={fields.title} onChange={(event) => setFields({ ...fields, title: event.target.value })} />
              </label>
              <label className="wide">
                Summary
                <textarea rows={3} maxLength={600} required value={fields.summary} onChange={(event) => setFields({ ...fields, summary: event.target.value })} />
              </label>
              <label className="wide">
                Public statement
                <input maxLength={220} required value={fields.statement} onChange={(event) => setFields({ ...fields, statement: event.target.value })} />
              </label>
              <div className="home-pathway-editor wide">
                <div className="home-pathway-editor-heading">
                  <strong>Page feature cards</strong>
                  <small>Content changes inside the protected page framework</small>
                </div>
                {fields.features.map((feature, index) => (
                  <fieldset key={feature.number}>
                    <legend>{feature.number}</legend>
                    <label>
                      Title
                      <input
                        maxLength={100}
                        required
                        value={feature.title}
                        onChange={(event) => {
                          const features = [...fields.features] as PageFields["features"];
                          features[index] = { ...feature, title: event.target.value };
                          setFields({ ...fields, features });
                        }}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        rows={3}
                        maxLength={360}
                        required
                        value={feature.description}
                        onChange={(event) => {
                          const features = [...fields.features] as PageFields["features"];
                          features[index] = { ...feature, description: event.target.value };
                          setFields({ ...fields, features });
                        }}
                      />
                    </label>
                  </fieldset>
                ))}
              </div>
            </>
          )}
          <button className="button-review" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Update public page"}
          </button>
          {notice && <div className="admin-notice" role="status">{notice}</div>}
        </form>
      )}
    </section>
  );
}
