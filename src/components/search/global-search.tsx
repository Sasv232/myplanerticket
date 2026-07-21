"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, CheckSquare, FolderKanban, StickyNote, BookOpen, X, ArrowRight } from "lucide-react";

interface SearchResult {
  type: "task" | "project" | "note" | "journal";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
}

const ICONS = {
  task: <CheckSquare className="h-4 w-4 text-[var(--accent)]" />,
  project: <FolderKanban className="h-4 w-4 text-green-500" />,
  note: <StickyNote className="h-4 w-4 text-yellow-500" />,
  journal: <BookOpen className="h-4 w-4 text-purple-500" />,
};

const TYPE_LABELS = {
  task: "Задача",
  project: "Проект",
  note: "Заметка",
  journal: "Дневник",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const [tasksRes, projectsRes, notesRes, journalRes] = await Promise.all([
        fetch("/api/tasks").then((r) => r.json()).catch(() => []),
        fetch("/api/projects").then((r) => r.json()).catch(() => []),
        fetch("/api/notes").then((r) => r.json()).catch(() => []),
        fetch("/api/journal").then((r) => r.json()).catch(() => []),
      ]);

      const lower = q.toLowerCase();
      const found: SearchResult[] = [];

      (tasksRes || []).forEach((t: any) => {
        if (
          t.title?.toLowerCase().includes(lower) ||
          t.description?.toLowerCase().includes(lower)
        ) {
          found.push({
            type: "task",
            id: t.id,
            title: t.title,
            subtitle: t.description?.slice(0, 60) || "Задача",
            href: "/tasks",
            icon: ICONS.task,
          });
        }
      });

      (projectsRes || []).forEach((p: any) => {
        if (p.name?.toLowerCase().includes(lower)) {
          found.push({
            type: "project",
            id: p.id,
            title: `${p.emoji || "📁"} ${p.name}`,
            subtitle: "Проект",
            href: "/projects",
            icon: ICONS.project,
          });
        }
      });

      (notesRes || []).forEach((n: any) => {
        if (
          n.content?.toLowerCase().includes(lower) ||
          n.title?.toLowerCase().includes(lower)
        ) {
          found.push({
            type: "note",
            id: n.id,
            title: n.title || n.content?.slice(0, 40) || "Заметка",
            subtitle: n.content?.slice(0, 60) || "",
            href: "/notes",
            icon: ICONS.note,
          });
        }
      });

      (journalRes || []).forEach((j: any) => {
        if (
          j.content?.toLowerCase().includes(lower) ||
          j.title?.toLowerCase().includes(lower)
        ) {
          found.push({
            type: "journal",
            id: j.id,
            title: j.title || "Дневник",
            subtitle: j.content?.slice(0, 60) || "",
            href: "/journal",
            icon: ICONS.journal,
          });
        }
      });

      setResults(found.slice(0, 20));
      setSelectedIdx(0);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      navigate(results[selectedIdx].href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg mx-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="h-5 w-5 text-[var(--muted)] shrink-0" />
          <input
            ref={inputRef}
            placeholder="Поиск по всему..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[var(--muted)] hover:text-[var(--foreground)]">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="text-[10px] text-[var(--muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {loading && (
            <div className="py-8 text-center text-[var(--secondary)] text-sm">
              Поиск...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-8 text-center text-[var(--secondary)] text-sm">
              Ничего не найдено
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {results.map((r, i) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => navigate(r.href)}
                  onMouseEnter={() => setSelectedIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIdx ? "bg-[var(--accent)]/10" : "hover:bg-[var(--surface)]"
                  }`}
                >
                  <div className="shrink-0">{r.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-[11px] text-[var(--muted)] truncate">{r.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-[var(--muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded shrink-0">
                    {TYPE_LABELS[r.type]}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div className="py-8 text-center text-[var(--muted)] text-sm">
              <p>Начни вводить для поиска</p>
              <p className="text-[10px] mt-1">Задачи · Проекты · Заметки · Дневник</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
