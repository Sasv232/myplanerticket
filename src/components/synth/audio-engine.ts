const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export type WaveformType = "sine" | "square" | "sawtooth" | "triangle" | "piano";

export function noteToMidi(note: string): number {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 60;
  const name = match[1];
  const octave = parseInt(match[2]);
  const semitone = NOTE_NAMES.indexOf(name);
  return (octave + 1) * 12 + semitone;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteToFrequency(note: string): number {
  return midiToFrequency(noteToMidi(note));
}

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new AudioContext();
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume();
  }
  return sharedCtx;
}

export interface PlayNoteOptions {
  waveform: WaveformType;
  volume: number;
  duration?: number;
}

function playPianoNote(ctx: AudioContext, freq: number, vol: number, dur: number): { stop: () => void } {
  const oscs: OscillatorNode[] = [];
  const gains: GainNode[] = [];
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  const harmonics = [
    { ratio: 1, gain: 1.0 },
    { ratio: 2, gain: 0.5 },
    { ratio: 3, gain: 0.25 },
    { ratio: 4, gain: 0.12 },
    { ratio: 5, gain: 0.06 },
  ];

  harmonics.forEach((h) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * h.ratio, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol * h.gain, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(Math.max(vol * h.gain * 0.3, 0.001), ctx.currentTime + dur * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur + 0.05);
    oscs.push(osc);
    gains.push(gain);
  });

  masterGain.gain.setValueAtTime(1, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur + 0.05);

  return {
    stop: () => {
      oscs.forEach((o) => { try { o.stop(); } catch {} });
    },
  };
}

export function playNote(note: string, opts: PlayNoteOptions): { stop: () => void } {
  const ctx = getCtx();
  const freq = noteToFrequency(note);
  const vol = opts.volume;
  const dur = opts.duration ?? 0.4;

  if (opts.waveform === "piano") {
    return playPianoNote(ctx, freq, vol, dur);
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = opts.waveform;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02);
  gain.gain.linearRampToValueAtTime(vol * 0.6, ctx.currentTime + 0.08);
  gain.gain.linearRampToValueAtTime(vol * 0.5, ctx.currentTime + dur * 0.7);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur + 0.01);

  return {
    stop: () => {
      try { osc.stop(); } catch {}
    },
  };
}

let analyserNode: AnalyserNode | null = null;

export function getAnalyser(): AnalyserNode | null {
  try {
    const ctx = getCtx();
    if (!analyserNode) {
      analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
    }
    return analyserNode;
  } catch {
    return null;
  }
}

export function createMelodyPlayer(
  notes: { note: string; duration: number }[],
  opts: PlayNoteOptions,
  tempo: number,
  onNote: (index: number) => void,
  onStop: () => void
): { stop: () => void } {
  const ctx = getCtx();
  let stopped = false;
  let timeouts: ReturnType<typeof setTimeout>[] = [];

  function play() {
    let time = 0;
    notes.forEach((n, i) => {
      const dur = n.duration / tempo;
      const t = setTimeout(() => {
        if (stopped) return;
        onNote(i);
        playNote(n.note, { ...opts, duration: dur * 0.9 });
      }, time * 1000);
      timeouts.push(t);
      time += dur;
    });
    const endTimeout = setTimeout(() => {
      if (!stopped) onStop();
    }, time * 1000);
    timeouts.push(endTimeout);
  }

  play();

  return {
    stop: () => {
      stopped = true;
      timeouts.forEach(clearTimeout);
      timeouts = [];
      onStop();
    },
  };
}
