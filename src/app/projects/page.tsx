"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n/context";
import { Plus, FolderKanban, Users, X, Copy } from "lucide-react";

interface Project { id: string; name: string; emoji: string | null; color: string | null; createdAt: string; ownerId: string; role?: string; members?: { id: string; name: string; role: string }[]; }

export default function ProjectsPage() {
  const { t } = useLang();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmoji, setFormEmoji] = useState("");
  const [formColor, setFormColor] = useState("#6366f1");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchProjects = async () => {
    try { const res = await fetch("/api/projects"); const data = await res.json(); if (Array.isArray(data)) setProjects(data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formName.trim(), emoji: formEmoji || null, color: formColor }) });
    setFormName(""); setFormEmoji(""); setFormOpen(false); fetchProjects();
  };
  const handleInvite = async () => {
    if (!selectedProject || !inviteEmail.trim()) return;
    await fetch(`/api/projects/${selectedProject.id}/invite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: inviteEmail.trim() }) });
    setInviteEmail(""); fetchProjects();
  };
  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (selectedProject?.id === id) setSelectedProject(null);
    fetchProjects();
  };
  const copyInviteCode = async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}/invite`, { method: "GET" });
    const data = await res.json();
    if (data.inviteCode) { await navigator.clipboard.writeText(data.inviteCode); setCopiedCode(projectId); setTimeout(() => setCopiedCode(null), 2000); }
  };

  if (loading) {
    return (
      <div style={{ padding: "32px 40px" }}>
        <div className="empty-state" style={{ minHeight: "60vh" }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p className="text-muted" style={{ marginTop: 12 }}>Загрузка проектов...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="heading-xl" style={{ marginBottom: 4 }}>{t("projects_title")}</h1>
        <p className="text-body">{projects.length} проектов · Командная работа</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {projects.map(project => (
          <div key={project.id} className="project-card" onClick={() => setSelectedProject(project)}>
            <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
              <div className="project-card-icon" style={{ background: project.color || "var(--primary)", color: "white" }}>
                {project.emoji || "📁"}
              </div>
              <div>
                <p className="heading-sm">{project.name}</p>
                <p className="text-xs">{project.role === "owner" ? "Владелец" : "Участник"} · {new Date(project.createdAt).toLocaleDateString("ru-RU")}</p>
              </div>
            </div>
            {project.members && project.members.length > 0 && (
              <div className="flex gap-1.5" style={{ marginTop: 8 }}>
                {project.members.slice(0, 4).map(m => (
                  <div key={m.id} className="mobile-checkbox" style={{ width: 28, height: 28, borderRadius: "50%", fontSize: 11, fontWeight: 600, background: "var(--bg-alt)", color: "var(--text-secondary)" }}>
                    {m.name?.[0] || "?"}
                  </div>
                ))}
                {project.members.length > 4 && <span className="text-xs" style={{ alignSelf: "center" }}>+{project.members.length - 4}</span>}
              </div>
            )}
          </div>
        ))}

        <div className="project-card" style={{ border: "2px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 120, cursor: "pointer" }} onClick={() => setFormOpen(true)}>
          <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)", marginBottom: 8 }}><Plus className="h-5 w-5" /></div>
          <p className="heading-sm" style={{ color: "var(--text-muted)" }}>Новый проект</p>
        </div>
      </div>

      {/* Create form */}
      {formOpen && (
        <div className="card" style={{ padding: 24, marginTop: 20, maxWidth: 440 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <p className="heading-md">Новый проект</p>
            <button onClick={() => setFormOpen(false)} className="btn-icon btn-icon-sm"><X className="h-4 w-4" /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label className="label">Название</label><input value={formName} onChange={e => setFormName(e.target.value)} className="input" placeholder="Название проекта" autoFocus /></div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><label className="label">Эмодзи</label><input value={formEmoji} onChange={e => setFormEmoji(e.target.value)} className="input" placeholder="📁" style={{ textAlign: "center" }} /></div>
              <div><label className="label">Цвет</label><input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} style={{ width: 44, height: 44, border: "none", borderRadius: "var(--radius-md)", cursor: "pointer" }} /></div>
            </div>
            <button onClick={handleCreate} className="btn btn-primary" disabled={!formName.trim()} style={{ width: "100%" }}>Создать</button>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedProject && (
        <div className="card" style={{ padding: 24, marginTop: 20, maxWidth: 520 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div className="flex items-center gap-3">
              <div className="project-card-icon" style={{ background: selectedProject.color || "var(--primary)", color: "white" }}>{selectedProject.emoji || "📁"}</div>
              <div>
                <p className="heading-md">{selectedProject.name}</p>
                <p className="text-xs">{selectedProject.role === "owner" ? "Владелец" : "Участник"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => copyInviteCode(selectedProject.id)} className="btn btn-outline btn-sm"><Copy className="h-3.5 w-3.5" /> {copiedCode === selectedProject.id ? "Скопировано!" : "Код"}</button>
              {selectedProject.role === "owner" && <button onClick={() => handleDelete(selectedProject.id)} className="btn btn-outline btn-sm" style={{ color: "var(--error)", borderColor: "var(--error)" }}>🗑️</button>}
              <button onClick={() => setSelectedProject(null)} className="btn-icon btn-icon-sm"><X className="h-4 w-4" /></button>
            </div>
          </div>
          {selectedProject.members && selectedProject.members.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p className="label">Участники</p>
              <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                {selectedProject.members.map(m => (
                  <div key={m.id} className="badge badge-outline" style={{ gap: 6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600 }}>{m.name?.[0] || "?"}</div>
                    {m.name} {m.role === "owner" && "👑"}
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedProject.role === "owner" && (
            <div className="flex gap-2">
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="input" style={{ flex: 1 }} placeholder="Email участника" />
              <button onClick={handleInvite} className="btn btn-primary" disabled={!inviteEmail.trim()}><Users className="h-4 w-4" /> Пригласить</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
