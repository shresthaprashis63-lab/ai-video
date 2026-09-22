import React from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Film,
  Sparkles,
  Plus,
  Clock,
  Layers,
  FolderKanban,
  FileVideo,
  Library,
  Sliders,
  Play,
  ArrowRight,
} from 'lucide-react';
import { PRESET_TEMPLATES } from '../../data/templates';

export const DashboardView: React.FC = () => {
  const { projects, switchProject, createProject, setActiveView, totalDuration } = useProject();

  const totalScenesAllProjects = projects.reduce((acc, p) => acc + p.scenes.length, 0);

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto p-6 space-y-8 text-slate-200">
      {/* Top Banner / Welcome */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 p-8 shadow-xl">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Video Production Studio</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Script-to-Video Engine with Reference Frames & Voiceover Sync
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Transform complete narratives into multi-scene 2+ minute cinematic videos. Upload reference
            frames for visual shot guidance, synchronize your recorded voiceover, modify scenes
            individually, and export in 4K/1080p.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                createProject('New Video Story');
                setActiveView('studio');
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-500 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/25 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Video</span>
            </button>

            <button
              onClick={() => setActiveView('templates')}
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 flex items-center gap-2 transition-colors"
            >
              <FileVideo className="w-4 h-4 text-indigo-400" />
              <span>Browse 2+ Min Templates</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            <span>Active Projects</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{projects.length}</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Total AI Scenes</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalScenesAllProjects}</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Target Video Length</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">2+ Min Capable</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Multi-Model Architecture</span>
          </div>
          <div className="text-sm font-semibold text-slate-200 mt-1">Veo • Runway • Engine</div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            <span>Recent Projects</span>
          </h2>
          <button
            onClick={() => setActiveView('projects')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const dur = proj.scenes.reduce((acc, s) => acc + s.duration, 0);
            const firstThumb = proj.scenes.find((s) => s.referenceImage)?.referenceImage;

            return (
              <div
                key={proj.id}
                onClick={() => {
                  switchProject(proj.id);
                  setActiveView('studio');
                }}
                className="group cursor-pointer rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/60 transition-all p-4 space-y-3 shadow-sm hover:shadow-lg"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                  {firstThumb ? (
                    <img src={firstThumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Film className="w-8 h-8 text-slate-700" />
                  )}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-cyan-300">
                    {Math.floor(dur / 60)}:{(dur % 60).toFixed(0).padStart(2, '0')}
                  </div>
                  <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {proj.script || 'No script entered yet.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{proj.scenes.length} Scenes</span>
                  <span className="capitalize text-slate-400">{proj.settings.defaultVisualPreset}</span>
                  <span className="uppercase font-mono">{proj.settings.aspectRatio}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick 2+ Minute Templates */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <FileVideo className="w-4 h-4 text-cyan-400" />
          <span>Quick 2+ Minute Templates</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-semibold text-[10px]">
                    {tpl.category}
                  </span>
                  <span className="text-cyan-400 font-mono text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(tpl.durationSeconds / 60)}m {tpl.durationSeconds % 60}s
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">{tpl.name}</h3>
                <p className="text-xs text-slate-400">{tpl.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-500">{tpl.scenes.length} Shots Ready</span>
                <button
                  onClick={() => {
                    createProject(tpl.name, tpl.id);
                    setActiveView('studio');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Open in Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
