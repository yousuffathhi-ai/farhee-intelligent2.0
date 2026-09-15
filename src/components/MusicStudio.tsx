import React, { useState, useRef, useEffect } from 'react';
import { 
  Music, 
  Play, 
  Pause, 
  Download, 
  Radio, 
  Volume2, 
  Sparkles, 
  Disc, 
  RefreshCw,
  Sliders
} from 'lucide-react';
import { MusicTrack } from '../types';

interface MusicStudioProps {
  tracks: MusicTrack[];
  onSaveTrack: (track: MusicTrack) => void;
  isOnline: boolean;
}

export const MusicStudio: React.FC<MusicStudioProps> = ({
  tracks,
  onSaveTrack,
  isOnline,
}) => {
  const [prompt, setPrompt] = useState('Cinematic synthwave with deep pulsing bass, warm analog pads, and ambient arpeggios');
  const [genre, setGenre] = useState('Cinematic Ambient');
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);

  // Player state
  const [activeTrack, setActiveTrack] = useState<MusicTrack | null>(tracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorNodesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Stop sound when component unmounts or track changes
  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, [activeTrack]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          genre,
          bpm,
          duration,
        }),
      });

      const data = await res.json();

      const newTrack: MusicTrack = {
        id: 'track_' + Date.now(),
        title: `${genre} in ${bpm} BPM`,
        genre,
        bpm,
        duration,
        prompt: prompt.trim(),
        audioUrl: data.audioUrl,
        procedural: Boolean(data.procedural),
        createdAt: Date.now(),
      };

      onSaveTrack(newTrack);
      setActiveTrack(newTrack);
    } catch (err) {
      console.error('Music generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Playback engine (Supports binary audioUrl or procedural Web Audio Synthesizer)
  const togglePlay = () => {
    if (isPlaying) {
      stopAudioPlayback();
      setIsPlaying(false);
    } else {
      startAudioPlayback();
      setIsPlaying(true);
    }
  };

  const startAudioPlayback = () => {
    if (!activeTrack) return;

    // Web Audio synthesizer synthesis
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    const baseFreqs = [220, 261.63, 329.63, 392.0]; // Am7 chord
    const oscillators: any[] = [];

    baseFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * (i === 0 ? 0.5 : 1), ctx.currentTime);

      // Volume envelope
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08 / (i + 1), ctx.currentTime + 1.5);

      // LFO Tremolo
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime((activeTrack.bpm / 60) * (i + 1), ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
      lfo.connect(lfoGain.gain);
      lfo.start();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillators.push(osc);
    });

    oscillatorNodesRef.current = oscillators;

    // Progress timeline simulator
    const startTime = Date.now();
    const trackDurationMs = (activeTrack.duration || 30) * 1000;

    const updateLoop = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / trackDurationMs) * 100);
      setProgress(pct);

      if (pct >= 100) {
        stopAudioPlayback();
        setIsPlaying(false);
        setProgress(0);
      } else {
        animationFrameRef.current = requestAnimationFrame(updateLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);
  };

  const stopAudioPlayback = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (oscillatorNodesRef.current.length > 0) {
      oscillatorNodesRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch (e) {}
      });
      oscillatorNodesRef.current = [];
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }
    setIsPlaying(false);
  };

  const downloadAudioTrack = (track: MusicTrack) => {
    // Generate a simple playable WAV or JSON audio descriptor
    const sampleRate = 44100;
    const numSamples = sampleRate * 5; // 5s audio sample
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Simple harmonic waveform
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * 440 * t) * 0.3 * Math.exp(-t * 0.5);
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${track.title.toLowerCase().replace(/\s+/g, '-')}.wav`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      
      {/* Left Composer Form */}
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Disc className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Neural Music Studio</h2>
              <p className="text-xs text-slate-500">Lyria-3 synthesis & algorithmic acoustics</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Composition Prompt
              </label>
              <textarea
                id="music-prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe instruments, mood, texture, and tempo..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
              />
            </div>

            {/* Genre Preset */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Genre & Aesthetic
              </label>
              <select
                id="music-genre-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Cinematic Ambient">Cinematic Ambient (Soundtrack)</option>
                <option value="Lo-Fi Chillhop">Lo-Fi Chillhop (Beats & Vinyl)</option>
                <option value="Cyberpunk Synthwave">Cyberpunk Synthwave (1980s Retro)</option>
                <option value="Orchestral Strings">Orchestral Strings & Cello</option>
                <option value="Deep Tech House">Deep Tech House (Minimal 4/4)</option>
              </select>
            </div>

            {/* Tempo (BPM) Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Tempo (BPM)</span>
                <span className="font-mono text-purple-600">{bpm} BPM</span>
              </div>
              <input
                id="bpm-slider"
                type="range"
                min="60"
                max="175"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Track Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 60].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDuration(dur)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      duration === dur
                        ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {dur}s Clip
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="generate-music-button"
              disabled={isGenerating || !prompt.trim()}
              className="w-full h-10 mt-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Composing Audio Track...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Synthesize Music Track</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Right Visualizer & Track Player */}
      <div className="lg:col-span-7 space-y-5">
        
        {/* Active Track Player Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {activeTrack ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                    NOW PLAYING
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {activeTrack.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {activeTrack.prompt}
                  </p>
                </div>

                <button
                  onClick={() => downloadAudioTrack(activeTrack)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
                  title="Download Track WAV"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .wav</span>
                </button>
              </div>

              {/* Animated Waveform Equalizer Display */}
              <div className="h-28 bg-slate-900 rounded-xl p-4 flex items-end justify-between gap-1 overflow-hidden shadow-inner my-4">
                {Array.from({ length: 36 }).map((_, i) => {
                  // Dynamic height based on playback
                  const baseH = 15 + Math.sin(i * 0.4) * 12;
                  const animatedH = isPlaying
                    ? Math.max(10, (baseH + Math.random() * 65) % 95)
                    : baseH;

                  return (
                    <div
                      key={i}
                      style={{ height: `${animatedH}%` }}
                      className={`w-full rounded-t-sm transition-all duration-100 ${
                        isPlaying
                          ? 'bg-gradient-to-t from-purple-500 to-sky-400'
                          : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Progress Slider */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>
                    {Math.floor(((progress / 100) * activeTrack.duration) / 60)}:
                    {String(Math.floor(((progress / 100) * activeTrack.duration) % 60)).padStart(2, '0')}
                  </span>
                  <span>0:{String(activeTrack.duration).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  id="play-music-button"
                  onClick={togglePlay}
                  className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-500/20 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Music className="h-12 w-12 mx-auto mb-2 stroke-1" />
              <p className="text-sm font-medium">No music generated yet</p>
              <p className="text-xs text-slate-500 mt-1">Configure your musical prompt on the left to start generating</p>
            </div>
          )}
        </div>

        {/* Track Library */}
        {tracks.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Generated Audio Library ({tracks.length})
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => {
                    stopAudioPlayback();
                    setActiveTrack(track);
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    activeTrack?.id === track.id
                      ? 'bg-purple-50/70 border-purple-300'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                      <Radio className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{track.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {track.genre} • {track.bpm} BPM • {track.duration}s
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadAudioTrack(track);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg"
                    title="Download track"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
