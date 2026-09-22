import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Film,
  Download,
  Sparkles,
  LayoutDashboard,
  FolderKanban,
  FileVideo,
  Library,
  Sliders,
  Check,
  Edit2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { AI_PROVIDERS } from '../../services/aiProvider';

interface NavbarProps {
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenExport }) => {
  const {
    project,
    activeView,
    setActiveView,
    renameProject,
    generateAllScenes,
    isGeneratingScenes,
    generationProgressText,
    totalDuration,
  } = useProject();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(project.name);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      renameProject(project.id, tempName.trim());
    }
    setIsEditingName(false);
  };

  const navItems = [
    { id: 'studio', label: 'Create Video', icon: Film },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'templates', label: 'Templates', icon: FileVideo },
    { id: 'assets', label: 'Assets', icon: Library },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ] as const;

  const currentProviderInfo = AI_PROVIDERS[project.settings.aiProvider] || AI_PROVIDERS.studio_engine;

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/80 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2 cursor-pointer group"
          id="nav-brand-logo"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-wider">AURA</span>
            <span className="text-xs font-semibold px-1.5 py-0.5 ml-1 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300">
              STUDIO
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Project Title Editor */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className="bg-slate-900 border border-indigo-500 text-white text-xs px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                autoFocus
              />
              <button
                onClick={handleNameSubmit}
                className="p-1 hover:bg-slate-800 text-emerald-400 rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempName(project.name);
                setIsEditingName(true);
              }}
              className="group flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-slate-900 transition-colors"
              title="Click to rename project"
            >
              <span className="font-medium max-w-[140px] md:max-w-[200px] truncate">
                {project.name}
              </span>
              <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded-full">
            <span>{project.scenes.length} Scenes</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-mono">{formatDuration(totalDuration)}</span>
            <span className="text-slate-600">•</span>
            <span className="uppercase text-slate-400">{project.settings.aspectRatio}</span>
          </div>
        </div>
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Provider badge */}
        <div
          onClick={() => setActiveView('settings')}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-md cursor-pointer transition-colors text-slate-300 text-[11px]"
          title="Click to configure AI Video generation provider"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Engine:</span>
          <span className="font-medium text-slate-200">{currentProviderInfo.name.split('/')[0]}</span>
        </div>

        {/* Generate All Scenes Button */}
        {activeView === 'studio' && (
          <button
            id="btn-generate-all-scenes"
            onClick={generateAllScenes}
            disabled={isGeneratingScenes}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm ${
              isGeneratingScenes
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 hover:shadow-indigo-500/30'
            }`}
            title="Generate AI video clips for all scenes in sequence"
          >
            {isGeneratingScenes ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Generate Video</span>
              </>
            )}
          </button>
        )}

        {/* Export Video Button */}
        <button
          id="btn-open-export-modal"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-600/20 transition-all hover:scale-[1.02]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
};
