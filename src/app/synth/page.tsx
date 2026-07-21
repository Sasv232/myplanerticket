"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Piano } from "@/components/synth/piano";
import { MELODIES } from "@/components/synth/melodies";
import { createMelodyPlayer, type WaveformType, getAnalyser } from "@/components/synth/audio-engine";
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
} from "lucide-react";

export default function SynthPage() {
  const [waveform, setWaveform] = useState<WaveformType>("sine");
  const [volume, setVolume] = useState(0.4);
  const [tempo, setTempo] = useState(1);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [playingMelody, setPlayingMelody] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<{ note: string; time: number }[]>([]);
  const playerRef = useRef<{ stop: () => void } | null>(null);
  const recordStartRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Visualizer
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
        {/* Waveform */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Звук
          </label>
          <div className="flex gap-1">
            {(["sine", "square", "sawtooth", "triangle"] as WaveformType[]).map((w) => (
              <Button
                key={w}
                variant={waveform === w ? "default" : "outline"}
                size="sm"
                onClick={() => setWaveform(w)}
                className="text-[11px]"
              >
                {w === "sine" ? "Синус" : w === "square" ? "Квадрат" : w === "sawtooth" ? "Пила" : "Треуг."}
              </Button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            <Volume2 className="h-3 w-3 inline mr-1" />
            Громкость
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-28 accent-[var(--accent)]"
          />
        </div>

        {/* Tempo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Скорость: {tempo.toFixed(1)}x
          </label>
          <input
            type="range"
            min={0.3}
            max={2.5}
            step={0.1}
            value={tempo}
            onChange={(e) => setTempo(parseFloat(e.target.value))}
            className="w-28 accent-[var(--accent)]"
          />
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
          />
        </CardContent>
      </Card>

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
          <Button
            size="lg"
            onClick={stopAll}
            className="rounded-full shadow-lg px-6"
          >
            <Square className="h-5 w-5 mr-2" /> Стоп
          </Button>
        </div>
      )}
    </div>
  );
}
