"use client";

import { FormEvent, useEffect, useState } from "react";
import type { StaffRole, StaffUser } from "../lib/auth";

type AccountForm = {
  email: string;
  displayName: string;
  password: string;
  role: StaffRole;
  status: "active" | "disabled";
};

const emptyAccount: AccountForm = {
  email: "",
  displayName: "",
  password: "",
  role: "editor",
  status: "active",
};

const roleDetails = [
  ["Owner", "Creates and modifies staff accounts and retains final platform control."],
  ["Administrator", "Manages posts, review decisions and approved publishing workflows."],
  ["Editor", "Creates drafts and submits community content for review."],
];

export function TeamAccess({ currentUser }: { currentUser: StaffUser }) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [form, setForm] = useState<AccountForm>(emptyAccount);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser.role !== "owner") return;
    fetch("/api/users", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setUsers(payload.users);
      })
      .catch((error) =>
        setNotice(error instanceof Error ? error.message : "Unable to load team accounts"),
      );
  }, [currentUser.role]);

  function beginEdit(user: StaffUser) {
    setEditingId(user.id);
    setForm({
      email: user.email,
      displayName: user.displayName,
      password: "",
      role: user.role,
      status: user.status,
    });
    setNotice("Leave password blank to keep the existing password.");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyAccount);
    setNotice("");
  }

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/users", {
        method: editingId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save account");
      setUsers((current) =>
        editingId
          ? current.map((user) => (user.id === editingId ? payload.user : user))
          : [...current, payload.user],
      );
      setEditingId(null);
      setForm(emptyAccount);
      setNotice(editingId ? "Account updated." : "Staff account created.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="team-access" id="team">
      <div className="panel-heading">
        <div>
          <p>TEAM ACCESS</p>
          <h2>People, roles and passwords</h2>
        </div>
        <span>{currentUser.role === "owner" ? "Owner controls" : "Owner-managed"}</span>
      </div>

      <div className="role-grid">
        {roleDetails.map(([role, description]) => (
          <article key={role}>
            <strong>{role}</strong>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <div className="hpanel-boundary">
        <strong>Hostinger hPanel is separate</strong>
        <p>
          hPanel controls Linux, domains, email, SSL and backups. Its password is
          never copied into this database. The website Owner creates staff
          publishing accounts here.
        </p>
      </div>

      {currentUser.role === "owner" ? (
        <div className="team-management-grid">
          <form className="team-account-form" onSubmit={saveAccount}>
            <h3>{editingId ? "Modify account" : "Create staff account"}</h3>
            <label>
              Display name
              <input
                required
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>
            <div className="form-row">
              <label>
                Role
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value as StaffRole })
                  }
                >
                  <option value="owner">Owner</option>
                  <option value="administrator">Administrator</option>
                  <option value="editor">Editor</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as AccountForm["status"],
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
            </div>
            <label>
              {editingId ? "New password (optional)" : "Temporary password"}
              <input
                type="password"
                minLength={12}
                required={!editingId}
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </label>
            <div className="composer-actions">
              {editingId && (
                <button className="button-save" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
              <button className="button-review" type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Create account"}
              </button>
            </div>
            {notice && <div className="admin-notice" role="status">{notice}</div>}
          </form>

          <div className="team-list">
            <h3>Current website team</h3>
            {users.map((user) => (
              <article key={user.id}>
                <span>{user.displayName.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{user.displayName}</strong>
                  <p>{user.email}</p>
                </div>
                <small>{user.role}</small>
                <i className={user.status === "active" ? "healthy" : ""} />
                <button type="button" onClick={() => beginEdit(user)}>Modify</button>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="team-readonly">
          Your account can use the publishing workspace. Only the Owner can
          create accounts, change roles or reset passwords.
        </p>
      )}
    </section>
  );
}
