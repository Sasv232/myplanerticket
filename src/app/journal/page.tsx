"use client";

import { useState, useEffect, useCallback } from "react";
import { JournalEntry, CreateJournalInput } from "@/types/journal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseJournalContent } from "@/lib/journal-parser";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Pin,
  Search,
  X,
  Check,
  Smile,
} from "lucide-react";

const MOODS = ["😊", "😐", "😢", "😡", "🤩", "😴", "🤔", "😌"];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formMood, setFormMood] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/journal");
      if (res.ok) setEntries(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSubmit = async () => {
    if (!formContent.trim()) return;
    const data: CreateJournalInput = {
      title: formTitle || undefined,
      content: formContent,
      mood: formMood || undefined,
    };

    if (editingId) {
      await fetch(`/api/journal/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    setShowForm(false);
    setEditingId(null);
    setFormTitle("");
    setFormContent("");
    setFormMood(null);
    fetchEntries();
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setFormTitle(entry.title || "");
    setFormContent(entry.content);
    setFormMood(entry.mood);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/journal/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchEntries();
  };

  const handlePin = async (entry: JournalEntry) => {
    await fetch(`/api/journal/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !entry.pinned }),
    });
    fetchEntries();
  };

  const filtered = entries.filter((e) =>
    e.content.toLowerCase().includes(search.toLowerCase()) ||
    (e.title && e.title.toLowerCase().includes(search.toLowerCase()))
  );

  const pinned = filtered.filter((e) => e.pinned);
  const unpinned = filtered.filter((e) => !e.pinned);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="mobile-page-header">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-[var(--accent)]" />
          Дневник
        </h1>
        <p className="text-sm text-[var(--secondary)]">Длинные записи со ссылками на задачи</p>
      </div>

      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <Input
            placeholder="Поиск по дневнику..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormTitle(""); setFormContent(""); setFormMood(null); }}>
          <Plus className="h-4 w-4 mr-1" /> Новая запись
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-[var(--accent)]/30">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Заголовок (необязательно)"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            <textarea
              autoFocus
              placeholder="Пиши как хочешь... Используй [[task:id]] или [[file:id]] для ссылок"
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full min-h-[200px] p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 leading-relaxed"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Smile className="h-4 w-4 text-[var(--muted)]" />
                {MOODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setFormMood(formMood === m ? null : m)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all"
                    style={{
                      backgroundColor: formMood === m ? "var(--accent)" : "transparent",
                      transform: formMood === m ? "scale(1.2)" : "scale(1)",
                      opacity: formMood && formMood !== m ? 0.4 : 1,
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
                Отмена
              </Button>
              <Button size="sm" onClick={handleSubmit}>
                <Check className="h-3.5 w-3.5 mr-1" /> {editingId ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries */}
      <div className="space-y-4">
        {pinned.length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">📌 Закреплённые</p>
            {pinned.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                formatDate={formatDate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPin={handlePin}
                deleteConfirm={deleteConfirm}
                setDeleteConfirm={setDeleteConfirm}
              />
            ))}
          </>
        )}

        {pinned.length > 0 && unpinned.length > 0 && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Все записи</p>
        )}

        {unpinned.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            formatDate={formatDate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPin={handlePin}
            deleteConfirm={deleteConfirm}
            setDeleteConfirm={setDeleteConfirm}
          />
        ))}
      </div>

      {!loading && entries.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 mx-auto text-[var(--muted)] mb-3" />
          <p className="text-[var(--secondary)]">Пока нет записей</p>
          <p className="text-[11px] text-[var(--muted)] mt-1">Нажми «Новая запись» чтобы начать</p>
        </div>
      )}

      {!loading && entries.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--secondary)]">Ничего не найдено</p>
        </div>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  formatDate,
  onEdit,
  onDelete,
  onPin,
  deleteConfirm,
  setDeleteConfirm,
}: {
  entry: JournalEntry;
  formatDate: (s: string) => string;
  onEdit: (e: JournalEntry) => void;
  onDelete: (id: string) => void;
  onPin: (e: JournalEntry) => void;
  deleteConfirm: string | null;
  setDeleteConfirm: (id: string | null) => void;
}) {
  const segments = parseJournalContent(entry.content);

  return (
    <Card className="group">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {entry.mood && <span className="text-lg">{entry.mood}</span>}
              <h3 className="text-sm font-bold truncate">
                {entry.title || formatDate(entry.createdAt)}
              </h3>
              <span className="text-[10px] text-[var(--muted)] shrink-0">
                {formatDate(entry.createdAt)}
              </span>
            </div>

            <div className="text-sm text-[var(--secondary)] leading-relaxed whitespace-pre-wrap">
              {segments.map((seg, i) => {
                if (seg.type === "text") return <span key={i}>{seg.content}</span>;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium"
                    style={{
                      backgroundColor: seg.type === "task" ? "var(--accent)" : "var(--success)",
                      color: "#fff",
                    }}
                  >
                    {seg.type === "task" ? "📋" : "📎"} {seg.content}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onPin(entry)}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--surface)] transition-colors"
            >
              <Pin className={`h-3.5 w-3.5 ${entry.pinned ? "fill-[var(--foreground)] text-[var(--foreground)]" : "text-[var(--muted)]"}`} />
            </button>
            <button
              onClick={() => onEdit(entry)}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--surface)] transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-[var(--muted)]" />
            </button>
            {deleteConfirm === entry.id ? (
              <>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="h-7 px-2 rounded-lg flex items-center justify-center bg-red-500 text-white text-[11px] font-medium"
                >
                  Да
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="h-7 px-2 rounded-lg flex items-center justify-center hover:bg-[var(--surface)] text-[11px] text-[var(--muted)]"
                >
                  Нет
                </button>
              </>
            ) : (
              <button
                onClick={() => setDeleteConfirm(entry.id)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--surface)] transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-[var(--muted)]" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
