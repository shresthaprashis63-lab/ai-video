import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  FolderKanban,
  Plus,
  Copy,
  Trash2,
  Film,
  Clock,
  Play,
  Edit2,
  Check,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    switchProject,
    createProject,
    duplicateProject,
    deleteProject,
    renameProject,
    setActiveView,
  } = useProject();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setTempName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (tempName.trim()) {
      renameProject(id, tempName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto p-6 space-y-6 text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            <span>Saved Video Projects</span>
          </h1>
          <p className="text-xs text-slate-400">
            Create, duplicate, modify, and manage your AI video studio productions.
          </p>
        </div>

        <button
          onClick={() => {
            createProject('New Video Project');
            setActiveView('studio');
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => {
          const dur = proj.scenes.reduce((acc, s) => acc + s.duration, 0);
          const firstThumb = proj.scenes.find((s) => s.referenceImage)?.referenceImage;

          return (
            <div
              key={proj.id}
              className="rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all p-4 space-y-3 flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-3">
                {/* Thumbnail */}
                <div
                  onClick={() => {
                    switchProject(proj.id);
                    setActiveView('studio');
                  }}
                  className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800 cursor-pointer group flex items-center justify-center"
                >
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

                {/* Title & Rename */}
                <div>
                  {editingId === proj.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(proj.id)}
                        className="bg-slate-950 border border-indigo-500 text-white text-xs px-2 py-1 rounded w-full focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(proj.id)}
                        className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h3
                        onClick={() => {
                          switchProject(proj.id);
                          setActiveView('studio');
                        }}
                        className="font-bold text-sm text-white hover:text-indigo-300 cursor-pointer transition-colors truncate"
                      >
                        {proj.name}
                      </h3>
                      <button
                        onClick={() => handleStartRename(proj.id, proj.name)}
                        className="p-1 text-slate-500 hover:text-slate-300 rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {proj.script || 'No script entered yet.'}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-500 space-x-2">
                  <span>{proj.scenes.length} Scenes</span>
                  <span>•</span>
                  <span className="uppercase">{proj.settings.aspectRatio}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateProject(proj.id)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Duplicate project"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteProject(proj.id)}
                    disabled={projects.length <= 1}
                    className="p-1.5 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 disabled:opacity-30 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      switchProject(proj.id);
                      setActiveView('studio');
                    }}
                    className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors ml-1"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
