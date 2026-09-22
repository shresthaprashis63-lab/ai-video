import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { PRESET_TEMPLATES, VideoTemplate } from '../../data/templates';
import {
  FileVideo,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  Smartphone,
  Tv,
  Check,
  Eye,
} from 'lucide-react';

export const TemplatesView: React.FC = () => {
  const { createProject, setActiveView } = useProject();
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate>(PRESET_TEMPLATES[0]);

  const handleUseTemplate = (tpl: VideoTemplate) => {
    createProject(tpl.name, tpl.id);
    setActiveView('studio');
  };

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto p-6 space-y-6 text-slate-200">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileVideo className="w-5 h-5 text-indigo-400" />
          <span>2+ Minute AI Video Templates</span>
        </h1>
        <p className="text-xs text-slate-400">
          Full-length cinematic video blueprints with synchronized scripts, reference frames,
          camera movements, and audio designs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="space-y-4">
          {PRESET_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplate.id === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-semibold text-[10px]">
                    {tpl.category}
                  </span>
                  <span className="font-mono text-cyan-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(tpl.durationSeconds / 60)}m {tpl.durationSeconds % 60}s
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white">{tpl.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{tpl.description}</p>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  <span>{tpl.scenes.length} Scenes</span>
                  <span className="capitalize">{tpl.visualStyle}</span>
                  <span className="uppercase">{tpl.aspectRatio}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Template Details Inspector */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold text-xs border border-indigo-500/30">
                  {selectedTemplate.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {Math.floor(selectedTemplate.durationSeconds / 60)}m{' '}
                  {selectedTemplate.durationSeconds % 60}s Total Duration
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{selectedTemplate.name}</h2>
              <p className="text-xs text-slate-400 mt-1">{selectedTemplate.description}</p>
            </div>

            <button
              onClick={() => handleUseTemplate(selectedTemplate)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-500 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
            >
              <span>Use This Template</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Full Narrative Script Excerpt */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">
              Full Narrative Script
            </h3>
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 font-sans leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line">
              {selectedTemplate.fullScript}
            </div>
          </div>

          {/* Scenes Breakdown Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">
                Scene Sequence Breakdown ({selectedTemplate.scenes.length} Shots)
              </h3>
              <span className="text-[11px] text-cyan-400 font-mono">
                Visual Style: {selectedTemplate.visualStyle}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {selectedTemplate.scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300">
                      Scene {scene.order.toString().padStart(2, '0')}
                    </span>
                    <span className="font-mono text-cyan-400 text-[10px]">{scene.duration}s</span>
                  </div>

                  {scene.referenceImage && (
                    <div className="aspect-video rounded overflow-hidden bg-black border border-slate-800">
                      <img src={scene.referenceImage} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className="text-[11px] text-slate-300 line-clamp-2">{scene.scriptText}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                    <span className="capitalize">{scene.cameraMovement.replace('_', ' ')}</span>
                    <span className="uppercase">{scene.transition}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
