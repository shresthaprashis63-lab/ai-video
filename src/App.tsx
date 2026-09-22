/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Navbar } from './components/layout/Navbar';
import { ScriptPanel } from './components/studio/ScriptPanel';
import { VideoPlayer } from './components/preview/VideoPlayer';
import { SceneInspector } from './components/studio/SceneInspector';
import { CaptionEffectsPanel } from './components/studio/CaptionEffectsPanel';
import { TimelineEditor } from './components/timeline/TimelineEditor';
import { ExportModal } from './components/modals/ExportModal';
import { DashboardView } from './components/views/DashboardView';
import { ProjectsView } from './components/views/ProjectsView';
import { TemplatesView } from './components/views/TemplatesView';
import { AssetsView } from './components/views/AssetsView';
import { SettingsView } from './components/views/SettingsView';
import { Film, Sparkles } from 'lucide-react';

const StudioMain: React.FC = () => {
  const { activeView, activeRightTab, setActiveRightTab } = useProject();
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Top Studio Navbar */}
      <Navbar onOpenExport={() => setIsExportOpen(true)} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {activeView === 'studio' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Top 3-Pane Studio Layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              {/* Left Column: Script & AI Director */}
              <div className="w-full md:w-80 lg:w-96 shrink-0 h-64 md:h-full overflow-hidden border-b md:border-b-0">
                <ScriptPanel />
              </div>

              {/* Center Column: Video Player Viewport */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950/80">
                <VideoPlayer />
              </div>

              {/* Right Column: Scene Inspector / Spoken Text & Animation FX */}
              <div className="w-full md:w-80 lg:w-96 shrink-0 h-64 md:h-full overflow-hidden border-t md:border-t-0 flex flex-col bg-slate-900 border-l border-slate-800">
                {/* Tab Switcher */}
                <div className="flex items-center p-1.5 bg-slate-950/90 border-b border-slate-800 gap-1 shrink-0">
                  <button
                    onClick={() => setActiveRightTab('scene')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      activeRightTab === 'scene'
                        ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5 text-blue-400" />
                    Scene Shots
                  </button>
                  <button
                    onClick={() => setActiveRightTab('effects')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      activeRightTab === 'effects'
                        ? 'bg-amber-500/15 text-amber-300 shadow-sm border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Text & FX
                  </button>
                </div>

                {/* Active Panel Content */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  {activeRightTab === 'scene' ? <SceneInspector /> : <CaptionEffectsPanel />}
                </div>
              </div>
            </div>

            {/* Bottom: Multi-Track Timeline Editor */}
            <TimelineEditor />
          </div>
        )}

        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'projects' && <ProjectsView />}
        {activeView === 'templates' && <TemplatesView />}
        {activeView === 'assets' && <AssetsView />}
        {activeView === 'settings' && <SettingsView />}
      </div>

      {/* Video Export & Render Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <StudioMain />
    </ProjectProvider>
  );
}
