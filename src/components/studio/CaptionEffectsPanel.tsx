import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { CaptionAnimationEffect } from '../../types/video';
import {
  Type,
  Sparkles,
  Palette,
  Film,
  Layers,
  Sliders,
  Eye,
  Check,
  Zap,
  Volume2,
  Tv,
} from 'lucide-react';

const ANIMATION_EFFECTS: {
  id: CaptionAnimationEffect;
  name: string;
  desc: string;
  badge: string;
}[] = [
  {
    id: 'karaoke_pop',
    name: 'Karaoke Pop',
    desc: 'Spoken word bounces & lights up as voice speaks',
    badge: 'Popular',
  },
  {
    id: 'kinetic_bounce',
    name: 'Kinetic Rhythm',
    desc: 'Punchy bounce on every spoken word cadence',
    badge: 'Viral',
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    desc: 'Smooth character reveal synchronized with audio',
    badge: 'Retro',
  },
  {
    id: 'neon_glow',
    name: 'Neon Glow',
    desc: 'Dual-layer pulsating cyber luminescence',
    badge: 'Cyber',
  },
  {
    id: 'slide_fade',
    name: 'Slide & Fade',
    desc: 'Gentle rising cinematic entry with smooth alpha',
    badge: 'Sleek',
  },
  {
    id: 'classic',
    name: 'Classic Subtitle',
    desc: 'Clean broadcast layout with shadow stroke',
    badge: 'Neutral',
  },
];

const HIGHLIGHT_COLORS = [
  { hex: '#fbbf24', name: 'Gold / Amber' },
  { hex: '#22d3ee', name: 'Cyan Glow' },
  { hex: '#4ade80', name: 'Neon Lime' },
  { hex: '#f43f5e', name: 'Hot Coral' },
  { hex: '#c084fc', name: 'Electric Violet' },
  { hex: '#ffffff', name: 'Pure White' },
  { hex: '#38bdf8', name: 'Sky Blue' },
];

const FONT_OPTIONS = [
  { id: 'Plus Jakarta Sans, sans-serif', name: 'Modern Sans (Plus Jakarta)' },
  { id: 'Impact, sans-serif', name: 'Impact (Shorts / Punchy)' },
  { id: 'Georgia, serif', name: 'Cinematic Serif (Georgia)' },
  { id: 'Courier New, monospace', name: 'Typewriter Mono' },
  { id: 'Trebuchet MS, sans-serif', name: 'Clean Editorial' },
];

export const CaptionEffectsPanel: React.FC = () => {
  const { project, updateCaptionStyle, updateSettings, isPlaying, togglePlay } = useProject();

  const { captionStyle, settings } = project;
  const effects = settings.effects;

  // Preset quick styles
  const applyPreset = (presetName: string) => {
    if (presetName === 'shorts') {
      updateCaptionStyle({
        animationEffect: 'karaoke_pop',
        highlightColor: '#fbbf24',
        font: 'Impact, sans-serif',
        fontSize: 32,
        textCase: 'uppercase',
        showBackground: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        position: 'bottom',
      });
      updateSettings({
        effects: {
          ...effects,
          filmGrain: 0.1,
          vignette: 0.35,
          cinematicBars: false,
        },
      });
    } else if (presetName === 'cinema') {
      updateCaptionStyle({
        animationEffect: 'classic',
        highlightColor: '#ffffff',
        font: 'Georgia, serif',
        fontSize: 24,
        textCase: 'normal',
        showBackground: false,
        position: 'bottom',
      });
      updateSettings({
        effects: {
          ...effects,
          filmGrain: 0.22,
          vignette: 0.5,
          cinematicBars: true,
          lightLeak: true,
          atmosphericDust: true,
        },
      });
    } else if (presetName === 'cyber') {
      updateCaptionStyle({
        animationEffect: 'neon_glow',
        highlightColor: '#22d3ee',
        font: 'Courier New, monospace',
        fontSize: 28,
        textCase: 'uppercase',
        showBackground: true,
        backgroundColor: 'rgba(8, 12, 28, 0.85)',
        position: 'center',
      });
      updateSettings({
        effects: {
          ...effects,
          rgbGlitch: true,
          vignette: 0.45,
          filmGrain: 0.15,
        },
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/90 backdrop-blur-md text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Text & Animation FX</h2>
              <p className="text-xs text-slate-400">Spoken voice subtitles & visual video effects</p>
            </div>
          </div>
          <button
            onClick={togglePlay}
            className={`px-2.5 py-1 text-xs rounded-md font-medium border flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {isPlaying ? 'Pause' : 'Test Play'}
          </button>
        </div>

        {/* Quick Style Presets */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Presets:
          </span>
          <button
            onClick={() => applyPreset('shorts')}
            className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors whitespace-nowrap"
          >
            Viral Shorts
          </button>
          <button
            onClick={() => applyPreset('cinema')}
            className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors whitespace-nowrap"
          >
            35mm Cinema
          </button>
          <button
            onClick={() => applyPreset('cyber')}
            className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors whitespace-nowrap"
          >
            Cyber Glow
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1">
        {/* SECTION 1: SPOKEN VOICE TEXT ANIMATION */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Voiceover Text Animation
              </label>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              Active Sync
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ANIMATION_EFFECTS.map((anim) => {
              const isSelected = captionStyle.animationEffect === anim.id;
              return (
                <button
                  key={anim.id}
                  onClick={() => updateCaptionStyle({ animationEffect: anim.id })}
                  className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/30 text-white'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{anim.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {anim.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {anim.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: ACTIVE SPOKEN WORD HIGHLIGHT COLOR */}
        <div>
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            Spoken Word Highlight Color
          </label>
          <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-800/40 rounded-lg border border-slate-700/60">
            {HIGHLIGHT_COLORS.map((c) => {
              const isSelected = captionStyle.highlightColor?.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  onClick={() => updateCaptionStyle({ highlightColor: c.hex })}
                  title={c.name}
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-transform ${
                    isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && (
                    <Check className={`w-3.5 h-3.5 ${c.hex === '#ffffff' ? 'text-black' : 'text-slate-950 font-bold'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: TYPOGRAPHY & TEXT CASING */}
        <div className="space-y-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Typography Font</label>
            <select
              value={captionStyle.font}
              onChange={(e) => updateCaptionStyle({ font: e.target.value })}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 outline-none focus:border-amber-500"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Text Casing */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-xs text-slate-300">Text Casing</span>
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              <button
                onClick={() => updateCaptionStyle({ textCase: 'uppercase' })}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  captionStyle.textCase === 'uppercase'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ALL CAPS
              </button>
              <button
                onClick={() => updateCaptionStyle({ textCase: 'capitalize' })}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  captionStyle.textCase === 'capitalize'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Title Case
              </button>
              <button
                onClick={() => updateCaptionStyle({ textCase: 'normal' })}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  captionStyle.textCase === 'normal'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Normal
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div className="pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Text Size</span>
              <span className="text-slate-400 font-mono">{captionStyle.fontSize}px</span>
            </div>
            <input
              type="range"
              min={18}
              max={44}
              step={1}
              value={captionStyle.fontSize}
              onChange={(e) => updateCaptionStyle({ fontSize: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Subtitle Position */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-xs text-slate-300">Screen Position</span>
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              {(['bottom', 'center', 'top'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => updateCaptionStyle({ position: pos })}
                  className={`px-2.5 py-0.5 text-xs rounded capitalize transition-colors ${
                    captionStyle.position === pos
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Background Pill Box Toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-xs text-slate-300">Background Pill Box</span>
            <input
              type="checkbox"
              checked={captionStyle.showBackground}
              onChange={(e) => updateCaptionStyle({ showBackground: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* SECTION 4: VISUAL VIDEO ANIMATION EFFECTS */}
        <div>
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Film className="w-4 h-4 text-emerald-400" />
            Visual Video Animation Effects
          </label>

          <div className="space-y-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
            {/* 35mm Film Grain */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-slate-400" />
                  35mm Film Grain
                </span>
                <span className="text-slate-400 font-mono">
                  {Math.round((effects.filmGrain || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.02}
                value={effects.filmGrain || 0}
                onChange={(e) =>
                  updateSettings({
                    effects: { ...effects, filmGrain: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>

            {/* Corner Vignette */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Vignette Darkening</span>
                <span className="text-slate-400 font-mono">
                  {Math.round((effects.vignette || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={effects.vignette || 0}
                onChange={(e) =>
                  updateSettings({
                    effects: { ...effects, vignette: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>

            {/* Cinematic Bars (2.39:1) */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-300 block">2.39:1 Cinematic Bars</span>
                <span className="text-[10px] text-slate-500">Letterbox top & bottom black bars</span>
              </div>
              <input
                type="checkbox"
                checked={effects.cinematicBars || false}
                onChange={(e) =>
                  updateSettings({
                    effects: { ...effects, cinematicBars: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Anamorphic Light Leak */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-300 block">Anamorphic Light Leak</span>
                <span className="text-[10px] text-slate-500">Soft warm lens bloom drift</span>
              </div>
              <input
                type="checkbox"
                checked={effects.lightLeak || false}
                onChange={(e) =>
                  updateSettings({
                    effects: { ...effects, lightLeak: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Atmospheric Dust Motes */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-300 block">Atmospheric Dust Motes</span>
                <span className="text-[10px] text-slate-500">Illuminated floating particles</span>
              </div>
              <input
                type="checkbox"
                checked={effects.atmosphericDust ?? true}
                onChange={(e) =>
                  updateSettings({
                    effects: { ...effects, atmosphericDust: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* RGB Glitch Pulse */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-300 block">Cyber RGB Glitch Pulse</span>
                <span className="text-[10px] text-slate-500">Micro chromatic aberration</span>
              </div>
              <input
                type="checkbox"
                checked={effects.rgbGlitch || false}
                onChange={(e) =>
                  updateSettings({
                    effects: { ...effects, rgbGlitch: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
