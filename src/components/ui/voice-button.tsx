"use client";

import { useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onResult: (text: string) => void;
  size?: "sm" | "md";
  className?: string;
  lang?: string;
}

export function VoiceButton({ onResult, size = "md", className, lang = "ru-RU" }: VoiceButtonProps) {
  const { isListening, transcript, isSupported, start, stop, error } = useSpeechRecognition(lang);

  useEffect(() => {
    if (transcript) {
      onResult(transcript);
    }
  }, [transcript, onResult]);

  useEffect(() => {
    if (error) {
      console.warn("Speech recognition error:", error);
    }
  }, [error]);

  if (!isSupported) {
    return null;
  }

  const sizeClasses = size === "sm" 
    ? "h-8 w-8" 
    : "h-10 w-10";

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={isListening ? stop : start}
      className={cn(
        "relative flex items-center justify-center rounded-xl transition-all duration-200",
        sizeClasses,
        isListening
          ? "bg-[var(--error)] text-white voice-pulse"
          : "bg-[var(--surface)] text-[var(--secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
        className
      )}
      title={isListening ? "Остановить запись" : "Голосовой ввод"}
    >
      {isListening ? (
        <MicOff className={iconSize} />
      ) : (
        <Mic className={iconSize} />
      )}
    </button>
  );
}
