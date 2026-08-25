"use client";

import type { AboutProfile } from "../lib/bcc-profile";

export function AboutProfileEditor({
  profile,
  onChange,
}: {
  profile: AboutProfile;
  onChange: (patch: Partial<AboutProfile>) => void;
}) {
  function updateFocus(index: number, field: "title" | "description", value: string) {
    const focuses = profile.focuses.map((focus) => ({ ...focus })) as AboutProfile["focuses"];
    focuses[index][field] = value;
    onChange({ focuses });
  }

  function updateMember(index: number, field: "name" | "role" | "phone", value: string) {
    const committee = profile.committee.map((member) => ({ ...member }));
    committee[index][field] = value;
    onChange({ committee });
  }

  return (
    <div className="about-admin-editor wide">
      <div className="home-pathway-editor-heading">
        <strong>About page details</strong>
        <small>All public wording, official facts and committee contacts</small>
      </div>

      <details open>
        <summary>Story and official facts</summary>
        <div className="about-admin-fields">
          <label>Story eyebrow<input maxLength={80} required value={profile.historyEyebrow} onChange={(event) => onChange({ historyEyebrow: event.target.value })} /></label>
          <label className="wide">Story heading<input maxLength={160} required value={profile.historyTitle} onChange={(event) => onChange({ historyTitle: event.target.value })} /></label>
          <label className="wide">Community history<textarea rows={9} maxLength={1600} required value={profile.historyBody} onChange={(event) => onChange({ historyBody: event.target.value })} /></label>
          <label>Formed date<input maxLength={80} required value={profile.formed} onChange={(event) => onChange({ formed: event.target.value })} /></label>
          <label>Incorporated date<input maxLength={80} required value={profile.incorporated} onChange={(event) => onChange({ incorporated: event.target.value })} /></label>
          <label className="wide">Registered name<input maxLength={180} required value={profile.legalName} onChange={(event) => onChange({ legalName: event.target.value })} /></label>
          <label>ABN<input maxLength={40} required value={profile.abn} onChange={(event) => onChange({ abn: event.target.value })} /></label>
        </div>
      </details>

      <details>
        <summary>Community focus</summary>
        <div className="about-admin-fields">
          <label>Section eyebrow<input maxLength={80} required value={profile.focusEyebrow} onChange={(event) => onChange({ focusEyebrow: event.target.value })} /></label>
          <label className="wide">Section heading<input maxLength={160} required value={profile.focusTitle} onChange={(event) => onChange({ focusTitle: event.target.value })} /></label>
          {profile.focuses.map((focus, index) => (
            <fieldset key={index}>
              <legend>{String(index + 1).padStart(2, "0")}</legend>
              <label>Title<input maxLength={100} required value={focus.title} onChange={(event) => updateFocus(index, "title", event.target.value)} /></label>
              <label>Description<textarea rows={3} maxLength={360} required value={focus.description} onChange={(event) => updateFocus(index, "description", event.target.value)} /></label>
            </fieldset>
          ))}
        </div>
      </details>

      <details>
        <summary>Committee and office contact</summary>
        <div className="about-admin-fields">
          <label>Committee eyebrow<input maxLength={80} required value={profile.committeeEyebrow} onChange={(event) => onChange({ committeeEyebrow: event.target.value })} /></label>
          <label className="wide">Committee heading<input maxLength={160} required value={profile.committeeTitle} onChange={(event) => onChange({ committeeTitle: event.target.value })} /></label>
          <label className="wide">Contact guidance<textarea rows={3} maxLength={360} required value={profile.committeeNote} onChange={(event) => onChange({ committeeNote: event.target.value })} /></label>
          <label>Directory updated<input maxLength={80} required value={profile.committeeUpdated} onChange={(event) => onChange({ committeeUpdated: event.target.value })} /></label>
          <label className="wide">Registered address<input maxLength={240} required value={profile.address} onChange={(event) => onChange({ address: event.target.value })} /></label>
          <label>Main phone<input maxLength={40} required value={profile.phone} onChange={(event) => onChange({ phone: event.target.value })} /></label>
          <label>Contact eyebrow<input maxLength={80} required value={profile.contactEyebrow} onChange={(event) => onChange({ contactEyebrow: event.target.value })} /></label>
          <label className="wide">Contact heading<input maxLength={160} required value={profile.contactTitle} onChange={(event) => onChange({ contactTitle: event.target.value })} /></label>
          <label className="wide">Source note<textarea rows={3} maxLength={500} required value={profile.sourceNote} onChange={(event) => onChange({ sourceNote: event.target.value })} /></label>
        </div>
      </details>

      <details>
        <summary>Committee directory ({profile.committee.length})</summary>
        <div className="about-committee-editor">
          {profile.committee.map((member, index) => (
            <fieldset key={index}>
              <legend>{String(index + 1).padStart(2, "0")}</legend>
              <label>Name<input maxLength={120} required value={member.name} onChange={(event) => updateMember(index, "name", event.target.value)} /></label>
              <label>Role<input maxLength={100} required value={member.role} onChange={(event) => updateMember(index, "role", event.target.value)} /></label>
              <label>Phone<input maxLength={40} required value={member.phone} onChange={(event) => updateMember(index, "phone", event.target.value)} /></label>
            </fieldset>
          ))}
        </div>
      </details>
    </div>
  );
}
