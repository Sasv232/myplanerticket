"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, Smile, Paperclip, Image } from "lucide-react";

interface MsgCardProps {
  title: string;
  avatar?: React.ReactNode;
  userName: string;
  time: string;
  text: string;
  onSend?: (message: string) => void;
  className?: string;
}

export function MsgCard({ title, avatar, userName, time, text, onSend, className }: MsgCardProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <div className={cn("msg-card", className)}>
      <div className="msg-card-title">{title}</div>
      <div className="msg-card-body">
        <div className="msg-card-avatar">
          {avatar || <span className="text-sm font-bold">{userName[0]}</span>}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="msg-card-user">{userName}</span>
            <span className="msg-card-time">{time}</span>
          </div>
          <div className="msg-card-text mt-1">{text}</div>
        </div>
      </div>
      {onSend && (
        <div className="msg-card-footer">
          <div className="msg-card-footer-inner">
            <textarea
              placeholder="Написать сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <div className="msg-card-actions">
              <button className="msg-card-action"><Smile className="h-4 w-4" /></button>
              <button className="msg-card-action"><Paperclip className="h-4 w-4" /></button>
              <button className="msg-card-action"><Image className="h-4 w-4" /></button>
              <button className="msg-card-send" onClick={handleSend}>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
