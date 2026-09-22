import React, { useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Library,
  Upload,
  Image as ImageIcon,
  Mic,
  Music,
  Film,
  AudioWaveform,
  Trash2,
} from 'lucide-react';

export const AssetsView: React.FC = () => {
  const { project, uploadVoiceoverFile, uploadReferenceImage, activeScene } = useProject();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Collect all reference frames in current project
  const referenceFrames = project.scenes
    .filter((s) => Boolean(s.referenceImage))
    .map((s) => ({
      sceneId: s.id,
      sceneOrder: s.order,
      url: s.referenceImage!,
      name: s.referenceImageName || `Reference Frame 0${s.order}`,
    }));

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto p-6 space-y-8 text-slate-200">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Library className="w-5 h-5 text-indigo-400" />
          <span>Project Media & Assets Library</span>
        </h1>
        <p className="text-xs text-slate-400">
          Manage uploaded reference frames, voiceover recordings, background music, and audio tracks.
        </p>
      </div>

      {/* Reference Frames Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span>Uploaded Reference Frames ({referenceFrames.length})</span>
          </h2>
          <span className="text-xs text-slate-500">Linked to individual shots</span>
        </div>

        {referenceFrames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {referenceFrames.map((frame) => (
              <div
                key={frame.sceneId}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="aspect-video bg-black relative">
                  <img src={frame.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-cyan-300">
                    Scene {frame.sceneOrder.toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-semibold text-white truncate">{frame.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Visual Guidance Shot</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 space-y-2">
            <ImageIcon className="w-8 h-8 text-slate-700 mx-auto" />
            <p>No reference frames uploaded yet.</p>
            <p className="text-[11px] text-slate-600">
              Select any scene in the Studio editor and upload a reference image to maintain visual
              consistency.
            </p>
          </div>
        )}
      </div>

      {/* Audio Tracks Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <AudioWaveform className="w-4 h-4 text-indigo-400" />
          <span>Audio Tracks (Voice & Music)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Voiceover Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Voiceover Track</h3>
                  <p className="text-[11px] text-slate-400">
                    {project.voiceoverTrack.name || 'Recorded voiceover'}
                  </p>
                </div>
              </div>
              <span className="font-mono text-cyan-400 text-xs font-semibold">
                {project.voiceoverTrack.duration.toFixed(1)}s
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <span>Status: {project.voiceoverTrack.url ? 'Loaded' : 'No file attached'}</span>
              <span>Formats: MP3, WAV, M4A</span>
            </div>
          </div>

          {/* Music Track Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Background Music</h3>
                  <p className="text-[11px] text-slate-400">{project.musicTrack.name}</p>
                </div>
              </div>
              <span className="font-mono text-emerald-400 text-xs font-semibold">
                {project.musicTrack.duration.toFixed(0)}s
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <span>Volume: {Math.round(project.musicTrack.volume * 100)}%</span>
              <span>Ambient Cinematic Mix</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
