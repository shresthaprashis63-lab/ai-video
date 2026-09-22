import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { AIProviderId } from '../../types/video';
import { AI_PROVIDERS } from '../../services/aiProvider';
import {
  Sliders,
  Sparkles,
  Server,
  Key,
  ShieldCheck,
  Check,
  ExternalLink,
  Cpu,
  Layers,
  Settings as SettingsIcon,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { project, updateSettings } = useProject();
  const [activeProvider, setActiveProvider] = useState<AIProviderId>(
    project.settings.aiProvider || 'studio_engine'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleProviderSelect = (id: AIProviderId) => {
    setActiveProvider(id);
    updateSettings({ aiProvider: id });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto p-6 space-y-8 text-slate-200">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>Studio Settings & AI Model Providers</span>
        </h1>
        <p className="text-xs text-slate-400">
          Configure video generation engines, server-side API dispatchers, and production render defaults.
        </p>
      </div>

      {/* AI Model Providers Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Active Video Generation Provider</span>
          </h2>
          {savedSuccess && (
            <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5" /> Provider updated
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          The application uses a modular AI provider abstraction layer. Generation requests are
          routed through secure server-side API endpoints (`/api/generate-scene` & `/api/analyze-script`)
          to protect credentials and handle long-form asynchronous queues.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(AI_PROVIDERS).map(([id, provider]) => {
            const isSelected = activeProvider === id;
            return (
              <div
                key={id}
                onClick={() => handleProviderSelect(id as AIProviderId)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 shadow-lg ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{provider.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        provider.isAvailable
                          ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}
                    >
                      {provider.isAvailable ? 'Active' : 'Configurable'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{provider.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-500 font-mono">
                  <div className="flex justify-between">
                    <span>Developer:</span>
                    <span className="text-slate-300">{provider.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Resolution:</span>
                    <span className="text-emerald-400 font-semibold">{provider.maxResolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aspect Ratios:</span>
                    <span className="text-slate-300">{provider.supportedRatios.join(', ')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Architecture Specs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Server-Side Architecture & Security Compliance</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
          <div className="space-y-1.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full-Stack Proxying</span>
            </div>
            <p className="leading-relaxed">
              All AI model communications are dispatched via server-side route handlers. API keys and
              model tokens are never exposed to the client-side bundle or browser network inspectors.
            </p>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Environment Variable Config</span>
            </div>
            <p className="leading-relaxed">
              Provider keys (such as `GEMINI_API_KEY`, `RUNWAY_API_KEY`, etc.) are read securely
              from `.env` on the server container.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
