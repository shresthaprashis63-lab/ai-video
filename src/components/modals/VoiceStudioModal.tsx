import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { voiceEngine, VoiceOption } from '../../services/voiceEngine';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Music,
  X,
  Radio,
  Sliders,
  Check,
  AlertCircle,
  Upload,
} from 'lucide-react';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({ isOpen, onClose }) => {
  const {
    project,
    updateVoiceoverTrack,
    updateMusicTrack,
    isVoiceSpeaking,
    isRecordingVoice,
    recordingElapsedSeconds,
    startMicrophoneRecording,
    stopMicrophoneRecording,
    testVoice,
    generateAIVoiceover,
    uploadVoiceoverFile,
    syncWithVoiceover,
    isGeneratingScenes,
  } = useProject();

  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    project.voiceoverTrack.voiceId || ''
  );
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const voices = voiceEngine.getAvailableVoices();
      setAvailableVoices(voices);
      if (!selectedVoiceId && voices.length > 0) {
        setSelectedVoiceId(voices[0].id);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    voiceEngine.setSelectedVoice(voiceId);
    updateVoiceoverTrack({ voiceId });
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    await testVoice(selectedVoiceId);
    setIsTestingVoice(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadVoiceoverFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Voiceover & Audio Studio
                {isVoiceSpeaking ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Speaking Now
                  </span>
                ) : project.voiceoverTrack.isMuted ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono">
                    <VolumeX className="w-3 h-3" />
                    Voice Muted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                    <Radio className="w-3 h-3" />
                    Audio Ready
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Control speech synthesis voice, record from microphone, or mix background music
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Audio Test & Unmute Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                Audio Diagnostic & Preview
              </div>
              <p className="text-[11px] text-slate-300">
                Ensure your speakers or headphones are audible. Click below to test voice output instantly.
              </p>
            </div>
            <button
              id="btn-test-voice-modal"
              onClick={handleTestVoice}
              disabled={isTestingVoice}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20 active:scale-95 shrink-0"
            >
              {isTestingVoice ? (
                <>
                  <span className="flex gap-0.5 items-end h-3">
                    <span className="w-0.5 h-3 bg-slate-950 animate-bounce"></span>
                    <span className="w-0.5 h-2 bg-slate-950 animate-bounce delay-75"></span>
                    <span className="w-0.5 h-3 bg-slate-950 animate-bounce delay-150"></span>
                  </span>
                  <span>Testing Audio...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>🔊 Test Voice Output</span>
                </>
              )}
            </button>
          </div>

          {/* Section 1: Microphone Voice Recording */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Record Your Own Voiceover</h3>
                  <p className="text-[10px] text-slate-400">
                    Use your microphone to narrate the script directly into the studio timeline
                  </p>
                </div>
              </div>

              {isRecordingVoice ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    {Math.floor(recordingElapsedSeconds / 60)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {(recordingElapsedSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={stopMicrophoneRecording}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Stop & Apply</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    id="btn-start-mic-recording"
                    onClick={startMicrophoneRecording}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/50 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <Mic className="w-3.5 h-3.5 text-rose-400" />
                    <span>Record Mic</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                    title="Upload recorded audio file"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Audio</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {project.voiceoverTrack.url && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate font-medium">{project.voiceoverTrack.name}</span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    ({project.voiceoverTrack.duration.toFixed(1)}s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={syncWithVoiceover}
                    className="text-[11px] text-cyan-400 hover:underline font-medium"
                  >
                    Auto-Sync Timing
                  </button>
                  <button
                    onClick={() => updateVoiceoverTrack({ url: null, useLiveVoice: true })}
                    className="text-[11px] text-slate-400 hover:text-rose-400"
                  >
                    Switch to Live AI
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: AI Voice Narrator Persona */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">AI Voice Narrator</h3>
                  <p className="text-[10px] text-slate-400">
                    Real-time speech synthesis that speaks every scene script during video playback
                  </p>
                </div>
              </div>

              <button
                onClick={() => generateAIVoiceover(selectedVoiceId)}
                disabled={isGeneratingScenes}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synthesize Audio Track</span>
              </button>
            </div>

            {/* Voice Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableVoices.slice(0, 12).map((voice) => {
                const isSelected = selectedVoiceId === voice.id;
                return (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceSelect(voice.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500/80 text-white ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-medium truncate">{voice.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="capitalize">{voice.gender}</span>
                        <span>•</span>
                        <span>{voice.lang}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Audio Mixer & Volume Controls */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-white">Audio Levels & Mixer</h3>
            </div>

            {/* Voiceover Track Slider */}
            <div className="space-y-1.5 bg-slate-900/70 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  Voiceover Volume
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-300 font-semibold text-[11px]">
                    {Math.round(project.voiceoverTrack.volume * 100)}%
                  </span>
                  <button
                    onClick={() =>
                      updateVoiceoverTrack({ isMuted: !project.voiceoverTrack.isMuted })
                    }
                    className={`p-1 rounded ${
                      project.voiceoverTrack.isMuted
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                    title={project.voiceoverTrack.isMuted ? 'Unmute voice' : 'Mute voice'}
                  >
                    {project.voiceoverTrack.isMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={project.voiceoverTrack.isMuted ? 0 : project.voiceoverTrack.volume}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value);
                  updateVoiceoverTrack({ volume: vol, isMuted: vol === 0 });
                }}
                className="w-full h-1.5 bg-slate-800 accent-cyan-400 rounded-lg cursor-pointer"
              />
            </div>

            {/* Music Track Slider */}
            <div className="space-y-1.5 bg-slate-900/70 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  Background Music Volume
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-300 font-semibold text-[11px]">
                    {Math.round(project.musicTrack.volume * 100)}%
                  </span>
                  <button
                    onClick={() => updateMusicTrack({ isMuted: !project.musicTrack.isMuted })}
                    className={`p-1 rounded ${
                      project.musicTrack.isMuted
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                    title={project.musicTrack.isMuted ? 'Unmute music' : 'Mute music'}
                  >
                    {project.musicTrack.isMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={project.musicTrack.isMuted ? 0 : project.musicTrack.volume}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value);
                  updateMusicTrack({ volume: vol, isMuted: vol === 0 });
                }}
                className="w-full h-1.5 bg-slate-800 accent-emerald-400 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice speech synchronizes automatically with the video canvas playhead.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
