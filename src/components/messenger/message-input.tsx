"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Smile } from "lucide-react";
import { EmojiPicker } from "./emoji-picker";

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  }, [text, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(), 1000);
  };

  return (
    <div className="mobile-chat-input-bar">
      <div className="flex items-end gap-3">
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl active:scale-95 transition-all duration-150"
          >
            <Smile className="h-5 w-5 text-[var(--secondary)]" />
          </button>
          {showEmoji && (
            <EmojiPicker
              onSelect={(emoji) => setText((prev) => prev + emoji)}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>

        <textarea
          ref={inputRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all max-h-32 min-h-[44px]"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
