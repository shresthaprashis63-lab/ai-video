import React, { useState, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { CameraMovement, TransitionType } from '../../types/video';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Scissors,
  ArrowLeft,
  ArrowRight,
  Clock,
  Video,
  Volume2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Film,
  Camera,
  Layers,
  History,
} from 'lucide-react';

const CAMERA_MOVEMENTS: { id: CameraMovement; label: string; desc: string }[] = [
  { id: 'cinematic', label: 'Cinematic', desc: 'Slow anamorphic motion & subtle glide' },
  { id: 'zoom_in', label: 'Zoom In', desc: 'Continuous dramatic push-in' },
  { id: 'zoom_out', label: 'Zoom Out', desc: 'Pull back reveal shot' },
  { id: 'pan_left', label: 'Pan Left', desc: 'Horizontal camera truck to the left' },
  { id: 'pan_right', label: 'Pan Right', desc: 'Horizontal camera truck to the right' },
  { id: 'tracking', label: 'Tracking', desc: 'Dynamic diagonal camera tracking' },
  { id: 'handheld', label: 'Handheld', desc: 'Organic natural gyro handheld drift' },
  { id: 'static', label: 'Static', desc: 'Locked tripod shot with ambient depth' },
];

const TRANSITIONS: { id: TransitionType; label: string }[] = [
  { id: 'cut', label: 'Hard Cut' },
  { id: 'dissolve', label: 'Cross Dissolve' },
  { id: 'fade', label: 'Fade to Black' },
  { id: 'zoom', label: 'Zoom Push' },
  { id: 'slide', label: 'Horizontal Slide' },
  { id: 'blur', label: 'Focal Blur' },
  { id: 'cinematic', label: 'Cinematic Lens Bloom' },
];

const MODIFICATION_PRESETS = [
  'Make the lighting darker & moody',
  'Make the camera move slower',
  'Change background to futuristic city',
  'Make the character look surprised',
  'Add cinematic rain and reflections',
  'Make this scene more cinematic',
];

const PRESET_REFERENCE_FRAMES = [
  {
    name: 'Antique Clockwork',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Floating Raindrops',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cyberpunk Metropolis',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Anamorphic Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Bioluminescent Abyss',
    url: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cosmic Portal',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  },
];

export const SceneInspector: React.FC = () => {
  const {
    project,
    activeScene,
    updateScene,
    uploadReferenceImage,
    removeReferenceImage,
    regenerateSingleScene,
    duplicateScene,
    deleteScene,
    splitScene,
    reorderScenes,
    setActiveSceneId,
  } = useProject();

  const [modificationPrompt, setModificationPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showPresetGallery, setShowPresetGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!activeScene) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-slate-500 text-xs text-center">
        Select a scene from the timeline below to edit its prompt, reference frame, camera movement,
        and transitions.
      </div>
    );
  }

  const sceneIndex = project.scenes.findIndex((s) => s.id === activeScene.id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadReferenceImage(activeScene.id, file);
    }
  };

  const handleRegenerateScene = async (instruction?: string) => {
    setIsRegenerating(true);
    const textToUse = instruction || modificationPrompt;
    await regenerateSingleScene(activeScene.id, textToUse);
    setModificationPrompt('');
    setIsRegenerating(false);
  };

  const handleMoveScene = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && sceneIndex > 0) {
      reorderScenes(sceneIndex, sceneIndex - 1);
    } else if (direction === 'next' && sceneIndex < project.scenes.length - 1) {
      reorderScenes(sceneIndex, sceneIndex + 1);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-l border-slate-800/80 w-full overflow-hidden text-xs">
      {/* Inspector Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-900/60 border border-indigo-500/40 flex items-center justify-center font-mono font-bold text-indigo-300 text-xs">
            {activeScene.order.toString().padStart(2, '0')}
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              Scene Inspector
            </h2>
            <p className="text-[11px] text-slate-400">
              Shot {sceneIndex + 1} of {project.scenes.length}
            </p>
          </div>
        </div>

        {/* Scene Navigation & Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleMoveScene('prev')}
            disabled={sceneIndex === 0}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
            title="Move scene earlier in timeline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleMoveScene('next')}
            disabled={sceneIndex === project.scenes.length - 1}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
            title="Move scene later in timeline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          <button
            onClick={() => duplicateScene(activeScene.id)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Duplicate scene"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => splitScene(activeScene.id, 0.5)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Split scene into two shots"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteScene(activeScene.id)}
            disabled={project.scenes.length <= 1}
            className="p-1.5 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 disabled:opacity-30"
            title="Delete scene"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Controls Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* REFERENCE FRAME SYSTEM */}
        <div className="space-y-2 bg-slate-900/80 border border-slate-800/90 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-200 text-[11px] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reference Frame</span>
              <span className="font-mono text-[10px] text-slate-500">
                (Scene {activeScene.order.toString().padStart(2, '0')})
              </span>
            </label>
            <span className="text-[10px] text-slate-400">
              {activeScene.referenceImage ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Frame Linked
                </span>
              ) : (
                'Optional (Text-to-Video)'
              )}
            </span>
          </div>

          <p className="text-[10px] text-slate-400 leading-normal">
            Upload an image for this shot. The AI uses this reference for character, environment,
            and lighting consistency.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {activeScene.referenceImage ? (
            <div className="space-y-2">
              <div className="relative group rounded-md overflow-hidden border border-slate-700 aspect-video bg-black flex items-center justify-center">
                <img
                  src={activeScene.referenceImage}
                  alt={`Reference shot for Scene ${activeScene.order}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium border border-slate-600 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Replace
                  </button>
                  <button
                    onClick={() => removeReferenceImage(activeScene.id)}
                    className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-[11px] font-medium border border-rose-800 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {activeScene.referenceImageName || 'Custom Reference Image Attached'}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-indigo-500/80 hover:bg-indigo-950/20 rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-medium text-slate-300">
                  Click or drag reference image
                </div>
                <div className="text-[10px] text-slate-500">Supports PNG, JPG, WebP</div>
              </div>

              {/* Sample shots button */}
              <button
                onClick={() => setShowPresetGallery(!showPresetGallery)}
                className="w-full py-1 text-[10px] text-indigo-400 hover:text-indigo-300 text-center flex items-center justify-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {showPresetGallery ? 'Hide Reference Library' : 'Or Pick from Reference Library'}
              </button>

              {showPresetGallery && (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {PRESET_REFERENCE_FRAMES.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        updateScene(activeScene.id, {
                          referenceImage: preset.url,
                          referenceImageName: preset.name,
                        })
                      }
                      className="group cursor-pointer rounded border border-slate-800 hover:border-cyan-500 overflow-hidden relative aspect-video bg-slate-900"
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white p-0.5 text-center font-medium">
                        {preset.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Script Line / Voiceover Segment */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 text-[11px] flex items-center justify-between">
            <span>Voiceover / Script Segment</span>
            <span className="text-[10px] text-slate-500">Scene Narrative</span>
          </label>
          <textarea
            value={activeScene.scriptText}
            onChange={(e) => updateScene(activeScene.id, { scriptText: e.target.value })}
            rows={3}
            className="w-full bg-slate-900 border border-slate-800 rounded-md p-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
            placeholder="Narrative spoken text for this shot..."
          />
        </div>

        {/* Duration & Timing */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Shot Duration</span>
            </label>
            <span className="font-mono text-cyan-300 font-semibold text-xs">
              {activeScene.duration.toFixed(1)}s
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="2.0"
              max="25.0"
              step="0.5"
              value={activeScene.duration}
              onChange={(e) =>
                updateScene(activeScene.id, { duration: parseFloat(e.target.value) })
              }
              className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              min="1.0"
              max="60.0"
              step="0.5"
              value={activeScene.duration}
              onChange={(e) =>
                updateScene(activeScene.id, { duration: parseFloat(e.target.value) || 3.0 })
              }
              className="w-14 bg-slate-900 border border-slate-800 text-center text-xs py-1 rounded text-slate-200 font-mono"
            />
          </div>
        </div>

        {/* Camera Movement Picker */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 text-[11px] flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            <span>Camera Movement</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {CAMERA_MOVEMENTS.map((cam) => {
              const isSelected = activeScene.cameraMovement === cam.id;
              return (
                <button
                  key={cam.id}
                  onClick={() => updateScene(activeScene.id, { cameraMovement: cam.id })}
                  className={`text-left p-2 rounded border text-[11px] transition-all ${
                    isSelected
                      ? 'bg-indigo-950/90 border-indigo-500 text-white font-medium'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div>{cam.label}</div>
                  <div className="text-[9px] text-slate-500 truncate">{cam.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Transition to Next Scene */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 text-[11px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Transition to Next Scene</span>
          </label>
          <select
            value={activeScene.transition}
            onChange={(e) =>
              updateScene(activeScene.id, { transition: e.target.value as TransitionType })
            }
            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            {TRANSITIONS.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.label}
              </option>
            ))}
          </select>
        </div>

        {/* Video Prompt */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Video Prompt</span>
            </span>
          </label>
          <textarea
            value={activeScene.videoPrompt}
            onChange={(e) => updateScene(activeScene.id, { videoPrompt: e.target.value })}
            rows={3}
            className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-200 text-[11px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-mono"
            placeholder="Detailed visual prompt for video generation..."
          />
        </div>

        {/* AI SCENE MODIFICATION BOX */}
        <div className="space-y-2 bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-indigo-200 text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Modify Scene With AI</span>
            </label>
            <span className="text-[10px] text-indigo-400/80 font-mono">Isolated Regeneration</span>
          </div>

          <p className="text-[10px] text-slate-400">
            Type natural language instructions to adjust lighting, camera speed, environment, or
            mood for <strong>only this scene</strong> without regenerating the rest of the video.
          </p>

          <div className="space-y-2">
            <input
              type="text"
              value={modificationPrompt}
              onChange={(e) => setModificationPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegenerateScene()}
              placeholder='e.g. "Make lighting darker", "Add rain", "Camera move slower"'
              className="w-full bg-slate-900/90 border border-indigo-500/40 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1">
              {MODIFICATION_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setModificationPrompt(preset)}
                  className="px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-slate-200 text-[10px] transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleRegenerateScene()}
              disabled={isRegenerating}
              className="w-full py-2 rounded font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Regenerating Scene {activeScene.order}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Regenerate This Scene</span>
                </>
              )}
            </button>
          </div>

          {/* Modification History */}
          {activeScene.modificationHistory && activeScene.modificationHistory.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                <History className="w-3 h-3" />
                <span>Modification History</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {activeScene.modificationHistory.map((item, i) => (
                  <span
                    key={i}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
