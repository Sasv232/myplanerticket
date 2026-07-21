"use client";

import { useState, useEffect, useCallback } from "react";
import { Note, CreateNoteInput } from "@/types/note";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  StickyNote,
  Plus,
  Pencil,
  Trash2,
  Pin,
  Search,
  X,
  Check,
} from "lucide-react";

const COLORS = [
  "#e0e7ff",
  "#dcfce7",
  "#fef9c3",
  "#fee2e2",
  "#f3e8ff",
  "#e5e7eb",
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) setNotes(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSubmit = async () => {
    if (!formContent.trim()) return;
    const data: CreateNoteInput = {
      title: formContent.split("\n")[0].slice(0, 50) || undefined,
      content: formContent,
      color: formColor,
    };

    if (editingId) {
      await fetch(`/api/notes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    setShowForm(false);
    setEditingId(null);
    setFormTitle("");
    setFormContent("");
    setFormColor(COLORS[0]);
    fetchNotes();
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setFormTitle(note.title || "");
    setFormContent(note.content);
    setFormColor(note.color);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchNotes();
  };

  const handlePin = async (note: Note) => {
    await fetch(`/api/notes/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    fetchNotes();
  };

  const filtered = notes.filter((n) =>
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    (n.title && n.title.toLowerCase().includes(search.toLowerCase()))
  );

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  return (
    <div className="space-y-6">
      <div className="mobile-page-header">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <StickyNote className="h-6 w-6 text-[var(--accent)]" />
          Заметки
        </h1>
        <p className="text-sm text-[var(--secondary)]">Простые заметки без дедлайнов</p>
      </div>

      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <Input
            placeholder="Поиск заметок..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormContent(""); setFormColor(COLORS[0]); }}>
          <Plus className="h-4 w-4 mr-1" /> Новая
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-[var(--accent)]/30">
          <CardContent className="p-4 space-y-3">
            <textarea
              autoFocus
              placeholder="Заметка..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full min-h-[100px] p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFormColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: formColor === c ? "var(--accent)" : "transparent",
                      transform: formColor === c ? "scale(1.15)" : "scale(1)",
                    }}
                  />
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

      {/* Pinned */}
      {pinned.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">📌 Закреплённые</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPin={handlePin}
                deleteConfirm={deleteConfirm}
                setDeleteConfirm={setDeleteConfirm}
              />
            ))}
          </div>
        </div>
      )}

      {/* All notes */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Все заметки</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unpinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPin={handlePin}
                deleteConfirm={deleteConfirm}
                setDeleteConfirm={setDeleteConfirm}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className="text-center py-16">
          <StickyNote className="h-12 w-12 mx-auto text-[var(--muted)] mb-3" />
          <p className="text-[var(--secondary)]">Пока нет заметок</p>
          <p className="text-[11px] text-[var(--muted)] mt-1">Нажми «Новая» чтобы создать</p>
        </div>
      )}

      {!loading && notes.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--secondary)]">Ничего не найдено</p>
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  onPin,
  deleteConfirm,
  setDeleteConfirm,
}: {
  note: Note;
  onEdit: (n: Note) => void;
  onDelete: (id: string) => void;
  onPin: (n: Note) => void;
  deleteConfirm: string | null;
  setDeleteConfirm: (id: string | null) => void;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-150 hover:shadow-md group"
      style={{ backgroundColor: note.color, border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <p className="text-sm whitespace-pre-wrap break-words text-gray-800 leading-relaxed">
        {note.content}
      </p>
      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onPin(note)}
          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
          title={note.pinned ? "Открепить" : "Закрепить"}
        >
          <Pin className={`h-3.5 w-3.5 ${note.pinned ? "fill-gray-600 text-gray-600" : "text-gray-400"}`} />
        </button>
        <button
          onClick={() => onEdit(note)}
          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
          title="Редактировать"
        >
          <Pencil className="h-3.5 w-3.5 text-gray-400" />
        </button>
        {deleteConfirm === note.id ? (
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => onDelete(note.id)}
              className="h-7 px-2 rounded-lg flex items-center justify-center bg-red-500 text-white text-[11px] font-medium hover:bg-red-600 transition-colors"
            >
              Удалить
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="h-7 px-2 rounded-lg flex items-center justify-center hover:bg-black/5 text-[11px] text-gray-500 transition-colors"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(note.id)}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors ml-auto"
            title="Удалить"
          >
            <Trash2 className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}
