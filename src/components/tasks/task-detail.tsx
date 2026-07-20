"use client";

import { useState, useEffect } from "react";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { TimeTracker } from "./time-tracker";
import { MessageSquare, Paperclip, Send, Trash2, Download, Clock } from "lucide-react";

interface Comment {
  id: string;
  taskId: string;
  userId: string | null;
  content: string;
  createdAt: string;
  userName: string | null;
}

interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export function TaskDetail({ task, open, onClose }: TaskDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [tab, setTab] = useState<"time" | "comments" | "files">("time");

  useEffect(() => {
    if (!task || !open) return;
    fetch(`/api/comments?taskId=${task.id}`).then((r) => r.json()).then(setComments).catch(() => {});
    fetch(`/api/attachments?taskId=${task.id}`).then((r) => r.json()).then(setAttachments).catch(() => {});
  }, [task, open]);

  const addComment = async () => {
    if (!newComment.trim() || !task) return;
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, content: newComment.trim() }),
    });
    setNewComment("");
    const res = await fetch(`/api/comments?taskId=${task.id}`);
    setComments(await res.json());
  };

  const deleteComment = async (id: string) => {
    await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileData: base64,
        }),
      });
      const res = await fetch(`/api/attachments?taskId=${task.id}`);
      setAttachments(await res.json());
    };
    reader.readAsDataURL(file);
  };

  const deleteAttachment = async (id: string) => {
    await fetch(`/api/attachments?id=${id}`, { method: "DELETE" });
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1048576).toFixed(1)} МБ`;
  };

  if (!task) return null;

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{task.title}</ModalTitle>
          <ModalDescription>
            {task.description || "Без описания"}
            <div className="mt-2 flex gap-2">
              <Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "warning" : "default"}>
                {task.priority}
              </Badge>
              {task.dueDate && (
                <Badge variant="secondary">
                  {new Date(task.dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                </Badge>
              )}
            </div>
          </ModalDescription>
        </ModalHeader>

        <div className="flex gap-1 border-b border-[var(--border)]">
          {(["time", "comments", "files"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                tab === t
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              {t === "time" && <><Clock className="h-3.5 w-3.5" /> Время</>}
              {t === "comments" && <><MessageSquare className="h-3.5 w-3.5" /> Комментарии ({comments.length})</>}
              {t === "files" && <><Paperclip className="h-3.5 w-3.5" /> Файлы ({attachments.length})</>}
            </button>
          ))}
        </div>

        <div className="max-h-[400px] overflow-y-auto py-3">
          {tab === "time" && <TimeTracker taskId={task.id} />}

          {tab === "comments" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Написать комментарий..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                />
                <Button size="icon" onClick={addComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {comments.length === 0 ? (
                <p className="text-center text-sm text-[var(--secondary)] py-4">Нет комментариев</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium">{c.userName || "Аноним"}</p>
                        <p className="mt-1 text-sm">{c.content}</p>
                        <p className="mt-1 text-[10px] text-[var(--secondary)]">
                          {new Date(c.createdAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <button onClick={() => deleteComment(c.id)} className="text-[var(--error)] hover:opacity-70">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "files" && (
            <div className="space-y-3">
              <label>
                <input type="file" className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <span><Paperclip className="h-4 w-4" /> Прикрепить файл</span>
                </Button>
              </label>
              {attachments.length === 0 ? (
                <p className="text-center text-sm text-[var(--secondary)] py-4">Нет файлов</p>
              ) : (
                attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.fileName}</p>
                      <p className="text-xs text-[var(--secondary)]">{formatSize(a.fileSize)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={`/api/attachments/${a.id}`} download className="text-[var(--accent)]">
                        <Download className="h-4 w-4" />
                      </a>
                      <button onClick={() => deleteAttachment(a.id)} className="text-[var(--error)] hover:opacity-70">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
