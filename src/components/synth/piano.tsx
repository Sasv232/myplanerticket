"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { playNote, type WaveformType } from "./audio-engine";

interface PianoProps {
  waveform: WaveformType;
  volume: number;
  activeNotes?: Set<string>;
  onNotePlay?: (note: string) => void;
}

const WHITE_NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5", "B5"];
const BLACK_NOTES = ["C#4", "D#4", "F#4", "G#4", "A#4", "C#5", "D#5", "F#5", "G#5", "A#5"];

const BLACK_KEY_POSITIONS: Record<string, number> = {
  "C#4": 1, "D#4": 2, "F#4": 4, "G#4": 5, "A#4": 6,
  "C#5": 8, "D#5": 9, "F#5": 11, "G#5": 12, "A#5": 13,
};

const KEY_LABELS: Record<string, string> = {
  "C4": "C", "D4": "D", "E4": "E", "F4": "F", "G4": "G", "A4": "A", "B4": "B",
  "C5": "C", "D5": "D", "E5": "E", "F5": "F", "G5": "G", "A5": "A", "B5": "B",
  "C#4": "C#", "D#4": "D#", "F#4": "F#", "G#4": "G#", "A#4": "A#",
  "C#5": "C#", "D#5": "D#", "F#5": "F#", "G#5": "G#", "A#5": "A#",
};

const KEYBOARD_MAP: Record<string, string> = {
  "a": "C4", "w": "C#4", "s": "D4", "e": "D#4", "d": "E4",
  "f": "F4", "t": "F#4", "g": "G4", "y": "G#4", "h": "A4",
  "u": "A#4", "j": "B4", "k": "C5", "o": "C#5", "l": "D5",
  "p": "D#5", ";": "E5", "'": "F5",
};

export function Piano({ waveform, volume, activeNotes, onNotePlay }: PianoProps) {
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const heldRef = useRef<Map<string, { stop: () => void }>>(new Map());

  const handleDown = useCallback((note: string) => {
    setPressed((prev) => new Set(prev).add(note));
    const playing = playNote(note, { waveform, volume, duration: 1.5 });
    heldRef.current.set(note, playing);
    onNotePlay?.(note);
  }, [waveform, volume, onNotePlay]);

  const handleUp = useCallback((note: string) => {
    setPressed((prev) => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    const ref = heldRef.current.get(note);
    if (ref) {
      ref.stop();
      heldRef.current.delete(note);
    }
  }, []);

  useEffect(() => {
    const down = new Set<string>();
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const note = KEYBOARD_MAP[e.key.toLowerCase()];
      if (!note) return;
      e.preventDefault();
      if (e.type === "keydown" && !down.has(e.key)) {
        down.add(e.key);
        handleDown(note);
      } else if (e.type === "keyup") {
        down.delete(e.key);
        handleUp(note);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [handleDown, handleUp]);

  useEffect(() => {
    return () => {
      heldRef.current.forEach((r) => r.stop());
      heldRef.current.clear();
    };
  }, []);

  const whiteWidth = 100 / WHITE_NOTES.length;
  const blackWidth = whiteWidth * 0.6;

  const allActive = new Set([...(activeNotes || []), ...pressed]);

  return (
    <div className="w-full select-none">
      {/* Octave labels */}
      <div className="flex justify-between mb-2 px-1">
        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Октава 4</span>
        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Октава 5</span>
      </div>

      <div className="relative" style={{ paddingBottom: "55%" }}>
        {/* White keys */}
        {WHITE_NOTES.map((note, i) => (
          <button
            key={note}
            onMouseDown={() => handleDown(note)}
            onMouseUp={() => handleUp(note)}
            onMouseLeave={() => handleUp(note)}
            onTouchStart={(e) => { e.preventDefault(); handleDown(note); }}
            onTouchEnd={(e) => { e.preventDefault(); handleUp(note); }}
            className="absolute bottom-0 rounded-b-xl transition-all duration-75"
            style={{
              left: `${i * whiteWidth}%`,
              width: `${whiteWidth - 0.3}%`,
              height: "100%",
              backgroundColor: allActive.has(note)
                ? "var(--accent)"
                : "var(--card)",
              border: "1px solid var(--border)",
              borderRight: "none",
              boxShadow: allActive.has(note)
                ? "0 0 12px var(--accent), inset 0 -4px 8px rgba(0,0,0,0.15)"
                : "inset 0 -4px 8px rgba(0,0,0,0.08)",
              zIndex: 1,
            }}
          >
            <span
              className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold"
              style={{ color: allActive.has(note) ? "#fff" : "var(--secondary)" }}
            >
              {KEY_LABELS[note]}
            </span>
          </button>
        ))}

        {/* Black keys */}
        {BLACK_NOTES.map((note) => {
          const pos = BLACK_KEY_POSITIONS[note];
          const left = pos * whiteWidth - blackWidth / 2;
          return (
            <button
              key={note}
              onMouseDown={() => handleDown(note)}
              onMouseUp={() => handleUp(note)}
              onMouseLeave={() => handleUp(note)}
              onTouchStart={(e) => { e.preventDefault(); handleDown(note); }}
              onTouchEnd={(e) => { e.preventDefault(); handleUp(note); }}
              className="absolute bottom-0 rounded-b-lg transition-all duration-75"
              style={{
                left: `${left}%`,
                width: `${blackWidth}%`,
                height: "60%",
                backgroundColor: allActive.has(note)
                  ? "var(--accent)"
                  : "#1a1a2e",
                border: "1px solid #333",
                borderTop: "none",
                boxShadow: allActive.has(note)
                  ? "0 0 12px var(--accent), inset 0 -3px 6px rgba(0,0,0,0.3)"
                  : "inset 0 -3px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)",
                zIndex: 2,
              }}
            >
              <span
                className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold"
                style={{ color: allActive.has(note) ? "#fff" : "#888" }}
              >
                {KEY_LABELS[note]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Keyboard hint */}
      <p className="text-[10px] text-[var(--muted)] text-center mt-3 font-medium">
        Клавиатура: A S D F G H J K L ; &nbsp;|&nbsp; W E T Y U O P
      </p>
    </div>
  );
}
