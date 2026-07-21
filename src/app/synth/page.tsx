"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Piano } from "@/components/synth/piano";
import { MELODIES } from "@/components/synth/melodies";
import { createMelodyPlayer, type WaveformType, getAnalyser } from "@/components/synth/audio-engine";
import {
  WHITE_NOTES,
  BLACK_NOTES,
  ALL_NOTES,
  DEFAULT_BINDINGS,
  loadBindings,
  saveBindings,
  getReverseBindings,
} from "@/components/synth/keybindings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Square,
  Volume2,
  Music,
  Mic,
  MicOff,
  RotateCcw,
  Keyboard,
  Save,
} from "lucide-react";

export default function SynthPage() {
  const [waveform, setWaveform] = useState<WaveformType>("sine");
  const [volume, setVolume] = useState(0.4);
  const [tempo, setTempo] = useState(1);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [playingMelody, setPlayingMelody] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<{ note: string; time: number }[]>([]);
  const [bindings, setBindings] = useState<Record<string, string>>(DEFAULT_BINDINGS);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [showBindings, setShowBindings] = useState(false);
  const playerRef = useRef<{ stop: () => void } | null>(null);
  const recordStartRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    setBindings(loadBindings());
  }, []);

  const reverseBindings = getReverseBindings(bindings);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    const maybeAnalyser = getAnalyser();
    if (!maybeAnalyser) return;
    const analyser = maybeAnalyser;

    const bufLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);

    const cx = ctx;
    const el = canvasEl;

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(data);

      const w = el.width;
      const h = el.height;
      cx.clearRect(0, 0, w, h);

      cx.lineWidth = 2;
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#3b82f6";
      cx.strokeStyle = accent;
      cx.beginPath();

      const sliceW = w / bufLen;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const v = data[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) cx.moveTo(x, y);
        else cx.lineTo(x, y);
        x += sliceW;
      }
      cx.lineTo(w, h / 2);
      cx.stroke();
    }

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [activeNotes]);

  const handleNotePlay = useCallback((note: string) => {
    if (recording) {
      const elapsed = (Date.now() - recordStartRef.current) / 1000;
      setRecordedNotes((prev) => [...prev, { note, time: elapsed }]);
    }
  }, [recording]);

  const playMelody = useCallback((melodyId: string) => {
    if (playingMelody) {
      playerRef.current?.stop();
      setPlayingMelody(null);
      setActiveNotes(new Set());
      return;
    }

    const melody = MELODIES.find((m) => m.id === melodyId);
    if (!melody) return;

    setPlayingMelody(melodyId);
    setActiveNotes(new Set());

    const player = createMelodyPlayer(
      melody.notes,
      { waveform, volume, duration: 0.4 },
      tempo,
      (idx) => {
        setActiveNotes(new Set([melody.notes[idx].note]));
      },
      () => {
        setPlayingMelody(null);
        setActiveNotes(new Set());
      }
    );
    playerRef.current = player;
  }, [playingMelody, waveform, volume, tempo]);

  const startRecording = () => {
    setRecordedNotes([]);
    setRecording(true);
    recordStartRef.current = Date.now();
  };

  const stopRecording = () => {
    setRecording(false);
  };

  const playRecording = () => {
    if (recordedNotes.length === 0) return;
    if (playingMelody) {
      playerRef.current?.stop();
      setPlayingMelody(null);
      setActiveNotes(new Set());
      return;
    }

    setPlayingMelody("__recorded__");
    setActiveNotes(new Set());

    const notesWithDur: { note: string; duration: number }[] = [];
    for (let i = 0; i < recordedNotes.length; i++) {
      const dur = i < recordedNotes.length - 1
        ? recordedNotes[i + 1].time - recordedNotes[i].time
        : 0.4;
      notesWithDur.push({ note: recordedNotes[i].note, duration: Math.max(dur, 0.1) });
    }

    const player = createMelodyPlayer(
      notesWithDur,
      { waveform, volume, duration: 0.4 },
      tempo,
      (idx) => {
        setActiveNotes(new Set([notesWithDur[idx].note]));
      },
      () => {
        setPlayingMelody(null);
        setActiveNotes(new Set());
      }
    );
    playerRef.current = player;
  };

  const stopAll = () => {
    playerRef.current?.stop();
    setPlayingMelody(null);
    setActiveNotes(new Set());
    setRecording(false);
  };

  const handleBindKey = useCallback((note: string, key: string) => {
    setBindings((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(next)) {
        if (v === note) delete next[k];
      }
      next[key.toLowerCase()] = note;
      return next;
    });
    setEditingNote(null);
  }, []);

  const handleSaveBindings = () => {
    saveBindings(bindings);
  };

  const handleResetBindings = () => {
    setBindings({ ...DEFAULT_BINDINGS });
    saveBindings({ ...DEFAULT_BINDINGS });
  };

  const getKeyDisplay = (note: string): string => {
    const key = reverseBindings[note];
    if (!key) return "—";
    if (key === "\\") return "\\";
    return key.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="mobile-page-header">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Music className="h-6 w-6 text-[var(--accent)]" />
          Синтезатор
        </h1>
        <p className="text-sm text-[var(--secondary)]">Виртуальная клавиатура с мелодиями</p>
      </div>

      {/* Visualizer */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            width={600}
            height={80}
            className="w-full"
            style={{ background: "var(--background)" }}
          />
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Звук</label>
          <div className="flex gap-1">
            {(["sine", "square", "sawtooth", "triangle", "piano"] as WaveformType[]).map((w) => (
              <Button
                key={w}
                variant={waveform === w ? "default" : "outline"}
                size="sm"
                onClick={() => setWaveform(w)}
                className="text-[11px]"
              >
                {w === "sine" ? "Синус" : w === "square" ? "Квадрат" : w === "sawtooth" ? "Пила" : w === "triangle" ? "Треуг." : "Пианино"}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            <Volume2 className="h-3 w-3 inline mr-1" />Громкость
          </label>
          <input type="range" min={0} max={1} step={0.05} value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-28 accent-[var(--accent)]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Скорость: {tempo.toFixed(1)}x
          </label>
          <input type="range" min={0.3} max={2.5} step={0.1} value={tempo}
            onChange={(e) => setTempo(parseFloat(e.target.value))}
            className="w-28 accent-[var(--accent)]" />
        </div>
      </div>

      {/* Piano */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <Piano
            waveform={waveform}
            volume={volume}
            activeNotes={activeNotes}
            onNotePlay={handleNotePlay}
            bindings={bindings}
          />
        </CardContent>
      </Card>

      {/* Key Bindings Settings */}
      <div>
        <button
          onClick={() => setShowBindings(!showBindings)}
          className="flex items-center gap-2 text-lg font-bold hover:text-[var(--accent)] transition-colors"
        >
          <Keyboard className="h-5 w-5 text-[var(--accent)]" />
          Настройка клавиш
          <span className="text-xs text-[var(--muted)] font-normal">
            {showBindings ? "▲ скрыть" : "▼ показать"}
          </span>
        </button>

        {showBindings && (
          <Card className="mt-3">
            <CardContent className="p-4 space-y-4">
              <p className="text-[11px] text-[var(--secondary)]">
                Нажми на клавишу рядом с нотой, затем нажми клавишу на клавиатуре чтобы назначить
              </p>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Белые клавиши</p>
                <div className="grid grid-cols-7 gap-2">
                  {WHITE_NOTES.map((note) => (
                    <button
                      key={note}
                      onClick={() => setEditingNote(note)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-150 ${
                        editingNote === note
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/30"
                          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/30"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-[var(--secondary)]">{note}</span>
                      <span className="text-lg font-bold" style={{ color: editingNote === note ? "var(--accent)" : "var(--foreground)" }}>
                        {getKeyDisplay(note)}
                      </span>
                      {editingNote === note && (
                        <span className="text-[8px] text-[var(--accent)] animate-pulse">Нажми клавишу...</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Чёрные клавиши</p>
                <div className="grid grid-cols-5 gap-2">
                  {BLACK_NOTES.map((note) => (
                    <button
                      key={note}
                      onClick={() => setEditingNote(note)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-150 ${
                        editingNote === note
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/30"
                          : "border-[var(--border)] bg-[#1a1a2e] hover:border-[var(--accent)]/30"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-[#888]">{note}</span>
                      <span className="text-lg font-bold" style={{ color: editingNote === note ? "var(--accent)" : "#ccc" }}>
                        {getKeyDisplay(note)}
                      </span>
                      {editingNote === note && (
                        <span className="text-[8px] text-[var(--accent)] animate-pulse">Нажми клавишу...</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                <Button variant="outline" size="sm" onClick={handleResetBindings}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> По умолчанию
                </Button>
                <Button size="sm" onClick={handleSaveBindings}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Сохранить
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Melodies */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Music className="h-5 w-5 text-[var(--accent)]" />
          Готовые мелодии
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {MELODIES.map((melody) => (
            <div
              key={melody.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/30 transition-colors"
            >
              <span className="text-2xl">{melody.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate">{melody.name}</p>
                <p className="text-[10px] text-[var(--secondary)]">{melody.notes.length} нот</p>
              </div>
              <Button
                size="sm"
                variant={playingMelody === melody.id ? "default" : "outline"}
                onClick={() => playMelody(melody.id)}
              >
                {playingMelody === melody.id ? (
                  <><Square className="h-3.5 w-3.5 mr-1" /> Стоп</>
                ) : (
                  <><Play className="h-3.5 w-3.5 mr-1" /> Играть</>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Recording */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Mic className="h-5 w-5 text-[var(--accent)]" />
          Запись
        </h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              {!recording ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startRecording}
                  className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                >
                  <Mic className="h-3.5 w-3.5 mr-1" /> Записать
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopRecording}
                  className="text-red-500 border-red-500/30 hover:bg-red-500/10 animate-pulse"
                >
                  <MicOff className="h-3.5 w-3.5 mr-1" /> Остановить
                </Button>
              )}

              {recordedNotes.length > 0 && !recording && (
                <>
                  <Button size="sm" onClick={playRecording}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Играть запись
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRecordedNotes([]);
                      setActiveNotes(new Set());
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Очистить
                  </Button>
                </>
              )}

              {playingMelody === "__recorded__" && (
                <Button size="sm" onClick={stopAll}>
                  <Square className="h-3.5 w-3.5 mr-1" /> Стоп
                </Button>
              )}

              <span className="text-[11px] text-[var(--secondary)]">
                {recording
                  ? "Нажимай на клавиши..."
                  : recordedNotes.length > 0
                    ? `${recordedNotes.length} нот записано`
                    : "Нажми \"Записать\" и играй на клавиатуре"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile stop button */}
      {playingMelody && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button size="lg" onClick={stopAll} className="rounded-full shadow-lg px-6">
            <Square className="h-5 w-5 mr-2" /> Стоп
          </Button>
        </div>
      )}

      {/* Hidden listener for key binding */}
      {editingNote && (
        <KeyBindingListener
          note={editingNote}
          onKey={(key) => handleBindKey(editingNote, key)}
          onCancel={() => setEditingNote(null)}
        />
      )}
    </div>
  );
}

function KeyBindingListener({ note, onKey, onCancel }: { note: string; onKey: (key: string) => void; onCancel: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        onCancel();
      } else {
        onKey(e.key);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [note, onKey, onCancel]);

  return null;
}
