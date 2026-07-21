"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Copy, Trash2, Clock, X } from "lucide-react";
import { useLang } from "@/lib/i18n/context";

interface Member {
  id: string;
  role: string;
  userId: string;
  userName: string;
  createdAt: string;
}

interface Invite {
  id: string;
  code: string;
  role: string;
  maxUses: number | null;
  uses: number | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Activity {
  id: string;
  action: string;
  details: string | null;
  userId: string;
  userName: string;
  createdAt: string;
}

interface CollabPanelProps {
  projectId: string;
  isOwner: boolean;
  onClose: () => void;
}

export function CollabPanel({ projectId, isOwner, onClose }: CollabPanelProps) {
  const { t } = useLang();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tab, setTab] = useState<"members" | "invites" | "activity">("members");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteMaxUses, setInviteMaxUses] = useState("");
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    const [m, i, a] = await Promise.all([
      fetch(`/api/projects/${projectId}/members`).then(r => r.json()).catch(() => []),
      fetch(`/api/projects/${projectId}/invite`).then(r => r.json()).catch(() => []),
      fetch(`/api/projects/${projectId}/activity`).then(r => r.json()).catch(() => []),
    ]);
    setMembers(m);
    setInvites(i);
    setActivities(a);
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const createInvite = async () => {
    await fetch(`/api/projects/${projectId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: inviteRole,
        maxUses: inviteMaxUses ? +inviteMaxUses : null,
      }),
    });
    setShowInviteForm(false);
    setInviteMaxUses("");
    loadData();
  };

  const deleteInvite = async (inviteId: string) => {
    await fetch(`/api/projects/${projectId}/invite?inviteId=${inviteId}`, { method: "DELETE" });
    loadData();
  };

  const removeMember = async (memberId: string) => {
    await fetch(`/api/projects/${projectId}/members?memberId=${memberId}`, { method: "DELETE" });
    loadData();
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> {t("collab_team")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface)]"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex border-b border-[var(--border)]">
          {(["members", "invites", "activity"] as const).map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)} className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === tabKey ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
              {tabKey === "members" ? `${t("collab_members")} (${members.length})` : tabKey === "invites" ? `${t("collab_invites")} (${invites.length})` : t("collab_activity")}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "members" && (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[var(--surface)]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-semibold text-sm">
                      {m.userName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.userName}</p>
                      <p className="text-[11px] text-[var(--muted)]">{m.role === "owner" ? t("collab_owner") : m.role === "admin" ? t("collab_admin") : t("collab_member")}</p>
                    </div>
                  </div>
                  {isOwner && m.role !== "owner" && (
                    <button onClick={() => removeMember(m.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "invites" && (
            <div className="space-y-3">
              {isOwner && (
                <>
                  {showInviteForm ? (
                    <div className="bg-[var(--surface)] rounded-xl p-4 space-y-3">
                      <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm">
                        <option value="member">{t("collab_role_member")}</option>
                        <option value="admin">{t("collab_role_admin")}</option>
                      </select>
                      <input type="number" placeholder={t("collab_max_uses")} value={inviteMaxUses} onChange={e => setInviteMaxUses(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm" />
                      <div className="flex gap-2">
                        <button onClick={createInvite} className="flex-1 h-10 rounded-xl bg-[var(--accent)] text-white text-sm font-medium">{t("collab_create")}</button>
                        <button onClick={() => setShowInviteForm(false)} className="px-4 h-10 rounded-xl border border-[var(--border)] text-sm">{t("collab_cancel")}</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowInviteForm(true)} className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors flex items-center justify-center gap-2">
                      <UserPlus className="h-4 w-4" /> {t("collab_create_invite")}
                    </button>
                  )}
                </>
              )}
              {invites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-[var(--surface)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-bold bg-[var(--card)] px-2 py-0.5 rounded">{inv.code}</code>
                      <button onClick={() => copyInviteCode(inv.code)} className="p-1 rounded hover:bg-[var(--card)]"><Copy className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] mt-1">
                      {inv.role === "admin" ? t("collab_admin") : t("collab_member")}
                      {inv.maxUses && ` · ${inv.uses || 0}/${inv.maxUses}`}
                      {inv.expiresAt && ` · до ${formatDate(inv.expiresAt)}`}
                    </p>
                  </div>
                  {isOwner && (
                    <button onClick={() => deleteInvite(inv.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              ))}
              {invites.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">{t("collab_no_invites")}</p>}
            </div>
          )}

          {tab === "activity" && (
            <div className="space-y-2">
              {activities.map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2 px-3 rounded-xl">
                  <div className="h-7 w-7 rounded-full bg-[var(--accent)]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-sm"><span className="font-medium">{a.userName}</span> {a.details || a.action}</p>
                    <p className="text-[11px] text-[var(--muted)]">{formatDate(a.createdAt)}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">{t("collab_no_activity")}</p>}
            </div>
          )}
        </div>

        {copied && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--foreground)] text-[var(--background)] text-xs px-3 py-1.5 rounded-lg">
            {t("collab_copied")}
          </div>
        )}
      </div>
    </div>
  );
}

export function JoinProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/projects/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      onClose();
      setCode("");
      window.location.reload();
    } else {
      setError(data.error || t("common_error"));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2"><UserPlus className="h-5 w-5" /> {t("collab_join")}</h3>
        <input
          placeholder={t("collab_join_code")}
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="w-full h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-lg font-mono font-bold text-center tracking-widest"
          autoFocus
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button onClick={join} disabled={loading || !code.trim()} className="flex-1 h-11 rounded-xl bg-[var(--accent)] text-white font-medium text-sm disabled:opacity-50">
            {loading ? "..." : t("collab_join_btn")}
          </button>
          <button onClick={onClose} className="px-4 h-11 rounded-xl border border-[var(--border)] text-sm">{t("collab_cancel")}</button>
        </div>
      </div>
    </div>
  );
}
