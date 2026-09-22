import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { VisualStyle } from '../../types/video';
import {
  Sparkles,
  FileText,
  Wand2,
  Clock,
  Layers,
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Mic,
  Music,
  Volume2,
  Sliders,
  Play,
} from 'lucide-react';
import { PRESET_TEMPLATES } from '../../data/templates';
import { VoiceStudioModal } from '../modals/VoiceStudioModal';

const VISUAL_STYLES: { id: VisualStyle; label: string; desc: string }[] = [
  { id: 'cinematic', label: 'Cinematic', desc: 'Anamorphic 35mm film, volumetric lighting' },
  { id: 'realistic', label: 'Realistic', desc: 'Photorealistic documentary photography' },
  { id: 'sci-fi', label: 'Sci-Fi', desc: 'Cyberpunk neon, futuristic architecture' },
  { id: 'documentary', label: 'Documentary', desc: 'National Geographic natural realism' },
  { id: 'anime', label: 'Anime', desc: 'Makoto Shinkai studio aesthetic & cel shading' },
  { id: '3d', label: '3D Animation', desc: 'Tactile Pixar/Unreal Engine 5 subsurface' },
  { id: 'cartoon', label: 'Cartoon', desc: 'Graphic animated illustrations & clean lines' },
  { id: 'gaming', label: 'Gaming', desc: 'Next-gen raytraced gameplay cinematics' },
  { id: 'fantasy', label: 'Fantasy', desc: 'Ethereal mystical monoliths & golden glow' },
  { id: 'minimalist', label: 'Minimalist', desc: 'Clean geometric lines & negative space' },
  { id: 'custom', label: 'Custom', desc: 'User-defined bespoke aesthetic prompt' },
];

export const ScriptPanel: React.FC = () => {
  const {
    project,
    updateScript,
    setScenes,
    updateSettings,
    loadTemplate,
    syncWithVoiceover,
    isGeneratingScenes,
    isVoiceSpeaking,
    isRecordingVoice,
    startMicrophoneRecording,
    testVoice,
  } = useProject();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Script metrics
  const wordCount = project.script.trim().split(/\s+/).filter(Boolean).length;
  // Average speaking pace ~ 140 words per minute (2.3 words/sec)
  const estimatedSeconds = Math.max(5, Math.round(wordCount / 2.3));
  const estimatedMinutes = Math.floor(estimatedSeconds / 60);
  const estimatedSecRemainder = estimatedSeconds % 60;

  const handleAnalyzeScript = async () => {
    if (!project.script.trim()) return;

    setIsAnalyzing(true);
    setAnalysisStep('Analyzing script semantics & story arcs...');

    try {
      const response = await fetch('/api/analyze-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: project.script,
          visualStyle: project.settings.defaultVisualPreset,
          aspectRatio: project.settings.aspectRatio,
          targetDurationSeconds: estimatedSeconds,
        }),
      });

      setAnalysisStep('Generating cinematic scene prompts & camera directions...');

      if (response.ok) {
        const data = await response.json();
        if (data.scenes && Array.isArray(data.scenes)) {
          setScenes(data.scenes);
        }
      }
    } catch (err) {
      console.warn('Script analysis fallback:', err);
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisStep('');
      }, 600);
    }
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tplId = e.target.value;
    if (tplId) {
      setSelectedTemplateId(tplId);
      loadTemplate(tplId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800/80 w-full overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              Script & AI Director
            </h2>
            <p className="text-[11px] text-slate-400">Script-to-Video Workflow</p>
          </div>
        </div>

        {/* Quick Sample Script Selector */}
        <div className="relative">
          <select
            value={selectedTemplateId}
            onChange={handleTemplateSelect}
            className="text-[11px] bg-slate-900 border border-slate-700/80 text-slate-300 rounded px-2 py-1 pr-6 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
          >
            <option value="">Sample 2+ Min Scripts...</option>
            {PRESET_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* Large Script Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <label className="font-medium text-slate-300 flex items-center gap-1.5">
              <span>Full Video Script</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                2+ Min Capable
              </span>
            </label>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span>{wordCount} words</span>
              <span>•</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{estimatedMinutes > 0 ? `${estimatedMinutes}m ` : ''}
                {estimatedSecRemainder}s
              </span>
            </div>
          </div>

          <textarea
            id="input-script-editor"
            value={project.script}
            onChange={(e) => updateScript(e.target.value)}
            placeholder="Paste or write your full video script here. For example:&#10;&#10;'Imagine waking up one morning and discovering that the clock on your wall is running backwards...'"
            rows={10}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-slate-200 placeholder-slate-500 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none font-sans"
          />
        </div>

        {/* Visual Style Selector */}
        <div className="space-y-1.5">
          <label className="font-medium text-slate-300 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Visual Style Preset</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-mono">
              {project.settings.defaultVisualPreset}
            </span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {VISUAL_STYLES.map((style) => {
              const isSelected = project.settings.defaultVisualPreset === style.id;
              return (
                <button
                  key={style.id}
                  id={`style-preset-${style.id}`}
                  onClick={() => updateSettings({ defaultVisualPreset: style.id })}
                  className={`text-left p-2 rounded-md border text-[11px] transition-all ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-500/80 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium truncate">{style.label}</div>
                  <div className="text-[9px] text-slate-500 truncate mt-0.5">{style.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Breakdown Button */}
        <div className="pt-1">
          <button
            id="btn-analyze-script"
            onClick={handleAnalyzeScript}
            disabled={isAnalyzing || !project.script.trim()}
            className={`w-full py-2.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              isAnalyzing || !project.script.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/25 active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                <span>{analysisStep || 'Analyzing Script & Creating Scenes...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-indigo-200" />
                <span>Analyze Script & Break Into Scenes</span>
              </>
            )}
          </button>
        </div>

        {/* Breakdown Summary Card */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scene Breakdown Summary</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-[10px]">
              {project.scenes.length} Scenes Generated
            </span>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1">
            <p>
              AI has segmented your story into synchronized shots with camera movements, prompts,
              and transition cues.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={syncWithVoiceover}
              className="flex-1 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors"
              title="Align scene timing with uploaded voice recording"
            >
              <Mic className="w-3 h-3 text-cyan-400" />
              <span>Auto-Sync Timing</span>
            </button>
          </div>
        </div>

        {/* Voiceover & Audio Studio Card */}
        <div className="bg-slate-900/70 border border-cyan-500/30 rounded-lg p-3 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Mic className={`w-3.5 h-3.5 ${isVoiceSpeaking ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
              <span>Voiceover Narration</span>
            </span>
            {isVoiceSpeaking ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono animate-pulse">
                Speaking Live
              </span>
            ) : project.voiceoverTrack.isMuted ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono">
                Muted
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                Active
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            {project.voiceoverTrack.url
              ? `Using audio file: "${project.voiceoverTrack.name}"`
              : 'AI Narrator speaks every scene text in real-time as video plays.'}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="btn-script-test-voice"
              onClick={() => testVoice()}
              className="py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              title="Test speech voice audio"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Test Voice</span>
            </button>

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="py-1.5 px-2 rounded bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 text-[11px] font-medium border border-cyan-500/40 flex items-center justify-center gap-1.5 transition-colors"
              title="Configure voices, mixer, or mic recording"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-300" />
              <span>Voice Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voiceover & Audio Studio Modal */}
      <VoiceStudioModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
};
