import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { AspectRatio } from '../../types/video';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Volume2,
  VolumeX,
  Smartphone,
  Tv,
  Square,
  Sparkles,
  Subtitles,
  Repeat,
  FastForward,
  Mic,
  Sliders,
} from 'lucide-react';
import {
  drawCaptions,
  drawSceneFrame,
  drawVisualEffects,
  preloadImage,
} from '../../utils/videoRenderer';
import { VoiceStudioModal } from '../modals/VoiceStudioModal';

export const VideoPlayer: React.FC = () => {
  const {
    project,
    currentTime,
    totalDuration,
    isPlaying,
    togglePlay,
    seek,
    playbackSpeed,
    setPlaybackSpeed,
    updateSettings,
    updateVoiceoverTrack,
    updateMusicTrack,
    isVoiceSpeaking,
    testVoice,
    activeScene,
    activeRightTab,
    setActiveRightTab,
  } = useProject();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Cached preloaded images for smooth realtime playback
  const imagesCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Aspect ratio specs
  const aspectRatio = project.settings.aspectRatio;

  // Preload scene reference images
  useEffect(() => {
    project.scenes.forEach((scene) => {
      if (scene.referenceImage && !imagesCacheRef.current.has(scene.id)) {
        preloadImage(scene.referenceImage)
          .then((img) => {
            imagesCacheRef.current.set(scene.id, img);
          })
          .catch(() => {});
      }
    });
  }, [project.scenes]);

  // Compute active scene from currentTime
  const currentSceneInfo = useMemo(() => {
    let elapsed = 0;
    for (let i = 0; i < project.scenes.length; i++) {
      const s = project.scenes[i];
      if (currentTime < elapsed + s.duration || i === project.scenes.length - 1) {
        const sceneElapsed = currentTime - elapsed;
        const progress = Math.min(1, Math.max(0, sceneElapsed / s.duration));
        return {
          scene: s,
          index: i,
          progress,
          elapsed,
        };
      }
      elapsed += s.duration;
    }
    return {
      scene: project.scenes[0],
      index: 0,
      progress: 0,
      elapsed: 0,
    };
  }, [project.scenes, currentTime]);

  // Render canvas frame on currentTime change or render trigger
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const scene = currentSceneInfo.scene;
    if (!scene) return;

    const img = scene.referenceImage ? imagesCacheRef.current.get(scene.id) || null : null;

    // Draw scene frame with active camera movement
    drawSceneFrame(
      ctx,
      img,
      scene,
      currentSceneInfo.progress,
      width,
      height,
      project.settings.defaultVisualPreset
    );

    // Overlay visual video animation effects (Film grain, light leaks, vignette, etc)
    if (project.settings.effects) {
      drawVisualEffects(ctx, project.settings.effects, width, height, currentTime);
    }

    // Overlay spoken text captions with animated word-by-word karaoke & effects
    if (showCaptions) {
      const activeCaption =
        project.captions.find(
          (c) => currentTime >= c.startTime && currentTime <= c.endTime
        ) || null;
      drawCaptions(ctx, activeCaption, project.captionStyle, width, height, currentTime);
    }
  }, [
    currentTime,
    currentSceneInfo,
    project.settings.defaultVisualPreset,
    project.settings.effects,
    showCaptions,
    project.captionStyle,
    project.captions,
  ]);

  // Handle format aspect ratio change
  const handleRatioChange = (ratio: AspectRatio) => {
    updateSettings({ aspectRatio: ratio });
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleFullscreenToggle = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Canvas aspect ratio dimension styles
  const canvasAspectClass =
    aspectRatio === '9:16'
      ? 'aspect-[9/16] max-h-[74vh]'
      : aspectRatio === '1:1'
      ? 'aspect-square max-h-[74vh]'
      : 'aspect-[16/9] max-h-[74vh]';

  const canvasWidth = aspectRatio === '9:16' ? 1080 : aspectRatio === '1:1' ? 1080 : 1920;
  const canvasHeight = aspectRatio === '9:16' ? 1920 : aspectRatio === '1:1' ? 1080 : 1080;

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col bg-slate-950/90 relative overflow-hidden select-none"
    >
      {/* Top Bar Controls */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 text-xs">
        {/* Aspect Ratio Selector Pills */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => handleRatioChange('9:16')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              aspectRatio === '9:16'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="9:16 Vertical (TikTok, Reels, YouTube Shorts)"
          >
            <Smartphone className="w-3 h-3" />
            <span>9:16 Vertical</span>
          </button>
          <button
            onClick={() => handleRatioChange('16:9')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              aspectRatio === '16:9'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="16:9 Landscape (YouTube, Cinema, Presentation)"
          >
            <Tv className="w-3 h-3" />
            <span>16:9 Cinema</span>
          </button>
          <button
            onClick={() => handleRatioChange('1:1')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              aspectRatio === '1:1'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="1:1 Square (Instagram, Feed)"
          >
            <Square className="w-3 h-3" />
            <span>1:1 Square</span>
          </button>
        </div>

        {/* Current Shot Details Badge */}
        <div className="hidden sm:flex items-center gap-2">
          {currentSceneInfo.scene && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="font-semibold text-white">
                Shot {currentSceneInfo.index + 1}/{project.scenes.length}
              </span>
              <span className="text-slate-600">•</span>
              <span className="capitalize text-cyan-300">
                {currentSceneInfo.scene.cameraMovement.replace('_', ' ')}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                {currentSceneInfo.scene.transition}
              </span>
            </div>
          )}
        </div>

        {/* Toggles: Voice Studio, Subtitles, Animation FX & Fullscreen */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            id="btn-open-voice-studio"
            onClick={() => setIsVoiceModalOpen(true)}
            className={`p-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all border ${
              project.voiceoverTrack.isMuted
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : isVoiceSpeaking
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 ring-1 ring-cyan-500/30 shadow-sm'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
            title="Configure voice narration, test audio output, or record mic"
          >
            {isVoiceSpeaking ? (
              <span className="flex gap-0.5 items-end h-3">
                <span className="w-0.5 h-3 bg-cyan-400 animate-bounce"></span>
                <span className="w-0.5 h-1.5 bg-cyan-400 animate-bounce delay-75"></span>
                <span className="w-0.5 h-2.5 bg-cyan-400 animate-bounce delay-150"></span>
              </span>
            ) : (
              <Mic className={`w-3.5 h-3.5 ${project.voiceoverTrack.isMuted ? 'text-rose-400' : 'text-cyan-400'}`} />
            )}
            <span className="text-[11px] font-medium">
              {project.voiceoverTrack.isMuted
                ? 'Voice Muted'
                : isVoiceSpeaking
                ? 'Voice Active'
                : 'Voice Studio'}
            </span>
          </button>

          <button
            onClick={() => setActiveRightTab('effects')}
            className={`p-1.5 rounded-md hover:bg-slate-800 text-xs flex items-center gap-1 transition-colors ${
              activeRightTab === 'effects'
                ? 'text-amber-300 bg-amber-950/40 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Configure spoken text animations & visual video effects"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline text-[11px] font-medium">Text & FX</span>
          </button>

          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className={`p-1.5 rounded-md hover:bg-slate-800 text-xs flex items-center gap-1 transition-colors ${
              showCaptions ? 'text-cyan-400 bg-cyan-950/30' : 'text-slate-500'
            }`}
            title="Toggle Subtitles overlay"
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Captions</span>
          </button>
          <button
            onClick={handleFullscreenToggle}
            className="p-1.5 rounded-md hover:bg-slate-800 hover:text-white"
            title="Toggle Fullscreen preview"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-slate-950/80 relative">
        <div
          className={`relative rounded-xl overflow-hidden shadow-2xl shadow-black/80 border border-slate-800/80 bg-black flex items-center justify-center ${canvasAspectClass} transition-all`}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full h-full object-contain"
          />

          {/* Watermark badge */}
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white/50 font-mono tracking-widest pointer-events-none">
            {project.settings.resolution.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Playback Controls Bar */}
      <div className="h-12 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between z-10 text-xs">
        {/* Playback buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => seek(Math.max(0, currentTime - 5))}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Skip back 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="btn-player-play-pause"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition-transform active:scale-95"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => seek(Math.min(totalDuration, currentTime + 5))}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Skip forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Timecode display */}
          <div className="ml-2 font-mono text-[11px] text-slate-300">
            <span className="text-cyan-400 font-semibold">{formatTime(currentTime)}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-slate-500">{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Center: Playhead Scrubber Slider */}
        <div className="flex-1 max-w-xl mx-4 hidden sm:flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={totalDuration}
            step="0.1"
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 hover:bg-slate-700 accent-indigo-500 rounded-lg cursor-pointer transition-all"
          />
        </div>

        {/* Right side: Speed, Audio Diagnostics, and Volume Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Voice Audio Test */}
          <button
            id="btn-test-voice-player"
            onClick={() => testVoice()}
            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-cyan-400 hover:text-cyan-300 text-[11px] font-medium flex items-center gap-1 transition-all"
            title="Click to test voice audio output"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Test Voice</span>
          </button>

          {/* Voice Volume Quick Slider */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800 text-[11px]">
            <button
              onClick={() => updateVoiceoverTrack({ isMuted: !project.voiceoverTrack.isMuted })}
              className={`p-0.5 rounded transition-colors ${
                project.voiceoverTrack.isMuted ? 'text-rose-400' : 'text-cyan-400 hover:text-cyan-300'
              }`}
              title={project.voiceoverTrack.isMuted ? 'Unmute voiceover' : 'Mute voiceover'}
            >
              {project.voiceoverTrack.isMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
            </button>
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
              className="w-14 h-1 bg-slate-800 accent-cyan-400 rounded cursor-pointer"
              title={`Voice Volume: ${Math.round(project.voiceoverTrack.volume * 100)}%`}
            />
          </div>

          {/* Speed Selector */}
          <button
            onClick={() => {
              const speeds = [1.0, 1.25, 1.5, 0.5];
              const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
              setPlaybackSpeed(speeds[nextIdx]);
            }}
            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-mono"
            title="Playback speed"
          >
            {playbackSpeed}x
          </button>

          {/* Master Voice Mute button */}
          <button
            onClick={() => updateVoiceoverTrack({ isMuted: !project.voiceoverTrack.isMuted })}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title={project.voiceoverTrack.isMuted ? 'Unmute Voice' : 'Mute Voice'}
          >
            {project.voiceoverTrack.isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
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
