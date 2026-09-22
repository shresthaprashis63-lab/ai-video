import React, { useRef, useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Scene, TransitionType } from '../../types/video';
import {
  Play,
  Pause,
  Plus,
  Scissors,
  Copy,
  Trash2,
  Volume2,
  VolumeX,
  Mic,
  Music,
  Sparkles,
  Subtitles,
  ZoomIn,
  ZoomOut,
  Layers,
  Upload,
  RefreshCw,
  Clock,
  AudioWaveform,
  Square,
  Sliders,
  Radio,
} from 'lucide-react';
import { VoiceStudioModal } from '../modals/VoiceStudioModal';

const TRANSITIONS_LIST: TransitionType[] = [
  'cut',
  'dissolve',
  'fade',
  'zoom',
  'slide',
  'blur',
  'cinematic',
];

export const TimelineEditor: React.FC = () => {
  const {
    project,
    currentTime,
    totalDuration,
    isPlaying,
    togglePlay,
    seek,
    activeScene,
    setActiveSceneId,
    updateScene,
    addScene,
    duplicateScene,
    deleteScene,
    reorderScenes,
    splitScene,
    syncWithVoiceover,
    uploadVoiceoverFile,
    updateVoiceoverTrack,
    updateMusicTrack,
    isVoiceSpeaking,
    isRecordingVoice,
    recordingElapsedSeconds,
    startMicrophoneRecording,
    stopMicrophoneRecording,
    testVoice,
    timelineZoom,
    setTimelineZoom,
    setActiveRightTab,
  } = useProject();

  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const voiceInputRef = useRef<HTMLInputElement | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Dragging states
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null);
  const [resizingSceneId, setResizingSceneId] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizeStartDuration, setResizeStartDuration] = useState<number>(0);

  // Pixels per second calculation based on timelineZoom
  // Base: 25px per second
  const pxPerSec = 28 * timelineZoom;
  const totalTimelineWidth = Math.max(1200, totalDuration * pxPerSec + 200);

  // Playhead scrubber position
  const playheadLeft = currentTime * pxPerSec;

  // Handle timeline background click to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContainerRef.current) return;
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const scrollLeft = timelineContainerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft - 180; // 180px track label width
    if (clickX >= 0) {
      const targetTime = clickX / pxPerSec;
      seek(targetTime);
    }
  };

  // Scene resize drag handlers
  useEffect(() => {
    if (!resizingSceneId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX;
      const deltaSecs = deltaX / pxPerSec;
      const newDuration = Math.max(1.5, Math.round((resizeStartDuration + deltaSecs) * 10) / 10);
      updateScene(resizingSceneId, { duration: newDuration });
    };

    const handleMouseUp = () => {
      setResizingSceneId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingSceneId, resizeStartX, resizeStartDuration, pxPerSec, updateScene]);

  // Voiceover file upload change
  const handleVoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadVoiceoverFile(file);
    }
  };

  // Time ruler notches (every 5 seconds)
  const rulerTicks = [];
  const totalSecondsPadded = Math.ceil(totalDuration) + 15;
  for (let s = 0; s <= totalSecondsPadded; s += 5) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const timeLabel = `${mins}:${secs.toString().padStart(2, '0')}`;
    rulerTicks.push({
      second: s,
      left: s * pxPerSec,
      label: timeLabel,
      isMajor: s % 15 === 0,
    });
  }

  return (
    <div className="h-64 bg-slate-950 border-t border-slate-800/90 flex flex-col select-none text-xs overflow-hidden">
      {/* Timeline Controls Header */}
      <div className="h-10 bg-slate-950/80 px-4 border-b border-slate-800/80 flex items-center justify-between z-20">
        {/* Left: Playhead, Split, Add Scene */}
        <div className="flex items-center gap-2">
          <button
            id="btn-timeline-play"
            onClick={togglePlay}
            className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 font-semibold text-[11px] shadow-sm"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => {
              if (activeScene) splitScene(activeScene.id, 0.5);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px]"
            title="Split selected scene at playhead"
          >
            <Scissors className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Split</span>
          </button>

          <button
            onClick={() => addScene()}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px]"
            title="Add a new scene block to timeline"
          >
            <Plus className="w-3 h-3 text-indigo-400" />
            <span>Add Scene</span>
          </button>

          <button
            onClick={syncWithVoiceover}
            className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-[11px] font-medium transition-colors"
            title="Automatically stretch/shrink scenes to match uploaded voiceover timing"
          >
            <Mic className="w-3 h-3" />
            <span>Sync To Voice</span>
          </button>
        </div>

        {/* Center: Time indicator */}
        <div className="font-mono text-slate-300 text-[11px] bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
          <span className="text-cyan-400 font-bold">{currentTime.toFixed(1)}s</span>
          <span className="text-slate-600 mx-1.5">/</span>
          <span className="text-slate-400">{totalDuration.toFixed(1)}s</span>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Zoom out timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 w-10 text-center">
            {Math.round(timelineZoom * 100)}%
          </span>
          <button
            onClick={() => setTimelineZoom(Math.min(2.5, timelineZoom + 0.25))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Zoom in timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Multi-track Scroll Container */}
      <div
        ref={timelineContainerRef}
        onClick={handleTimelineClick}
        className="flex-1 overflow-x-auto overflow-y-auto relative flex flex-col bg-slate-950 select-none custom-scrollbar"
      >
        <div
          style={{ width: `${totalTimelineWidth}px` }}
          className="relative flex flex-col min-h-full"
        >
          {/* Top Time Ruler */}
          <div className="h-6 bg-slate-900/90 border-b border-slate-800 sticky top-0 z-10 flex">
            <div className="w-44 bg-slate-950 border-r border-slate-800 shrink-0 px-3 flex items-center text-[10px] text-slate-500 font-mono">
              TRACKS / TIME
            </div>
            <div className="relative flex-1 h-full">
              {rulerTicks.map((tick) => (
                <div
                  key={tick.second}
                  style={{ left: `${tick.left}px` }}
                  className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
                >
                  <div
                    className={`w-px ${
                      tick.isMajor ? 'h-3 bg-slate-600' : 'h-1.5 bg-slate-800'
                    }`}
                  />
                  {tick.isMajor && (
                    <span className="text-[9px] font-mono text-slate-500 transform -translate-x-1/2 mb-0.5">
                      {tick.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Red Playhead Vertical Line */}
          <div
            style={{ left: `${176 + playheadLeft}px` }}
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none transition-all duration-75"
          >
            <div className="w-3 h-3 bg-rose-500 transform -translate-x-1/2 rotate-45 -mt-1 shadow-sm" />
          </div>

          {/* TRACK 1: VIDEO SCENES */}
          <div className="h-16 border-b border-slate-800/80 flex group">
            {/* Track Header Label */}
            <div className="w-44 bg-slate-950 border-r border-slate-800 shrink-0 px-3 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Video Track</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {project.scenes.length} Clips
              </span>
            </div>

            {/* Scenes Track Container */}
            <div className="relative flex items-center h-full px-2">
              {project.scenes.map((scene, idx) => {
                const isSelected = activeScene?.id === scene.id;
                const widthPx = Math.max(60, scene.duration * pxPerSec);

                return (
                  <React.Fragment key={scene.id}>
                    {/* Scene Block */}
                    <div
                      draggable
                      onDragStart={() => setDraggedSceneIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedSceneIndex !== null && draggedSceneIndex !== idx) {
                          reorderScenes(draggedSceneIndex, idx);
                          setDraggedSceneIndex(null);
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSceneId(scene.id);
                      }}
                      style={{ width: `${widthPx}px` }}
                      className={`h-12 rounded-lg relative flex items-center border overflow-hidden transition-all group/scene cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-950/80 shadow-md'
                          : 'border-slate-700 bg-slate-900/90 hover:border-slate-500 hover:bg-slate-800/90'
                      }`}
                    >
                      {/* Scene Thumbnail Preview */}
                      <div className="w-10 h-full shrink-0 bg-black/60 border-r border-slate-700/60 overflow-hidden flex items-center justify-center">
                        {scene.referenceImage ? (
                          <img
                            src={scene.referenceImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-[9px] font-mono font-bold text-slate-500">
                            #{scene.order}
                          </div>
                        )}
                      </div>

                      {/* Scene Text & Duration Badge */}
                      <div className="flex-1 px-2 overflow-hidden flex flex-col justify-center">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-200 truncate">
                            Scene {scene.order}
                          </span>
                          <span className="font-mono text-cyan-400 shrink-0 ml-1 text-[9px]">
                            {scene.duration.toFixed(1)}s
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {scene.scriptText || scene.videoPrompt}
                        </div>
                      </div>

                      {/* Right Edge Resize Handle */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingSceneId(scene.id);
                          setResizeStartX(e.clientX);
                          setResizeStartDuration(scene.duration);
                        }}
                        className="w-2.5 h-full absolute right-0 top-0 cursor-ew-resize hover:bg-indigo-500/80 transition-colors opacity-0 group-hover/scene:opacity-100 flex items-center justify-center"
                        title="Drag to resize scene duration"
                      >
                        <div className="w-0.5 h-4 bg-white/70 rounded-full" />
                      </div>
                    </div>

                    {/* Transition Badge between scenes */}
                    {idx < project.scenes.length - 1 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const curr = TRANSITIONS_LIST.indexOf(scene.transition);
                          const next = TRANSITIONS_LIST[(curr + 1) % TRANSITIONS_LIST.length];
                          updateScene(scene.id, { transition: next });
                        }}
                        className="mx-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 text-[9px] text-slate-300 hover:text-white cursor-pointer border border-slate-700 transition-colors uppercase font-mono shrink-0 shadow-sm"
                        title={`Transition: ${scene.transition} (Click to toggle)`}
                      >
                        {scene.transition.slice(0, 3)}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* TRACK 2: VOICEOVER AUDIO */}
          <div className="h-14 border-b border-slate-800/80 flex group">
            {/* Track Header */}
            <div className="w-44 bg-slate-950 border-r border-slate-800 shrink-0 px-3 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                <Mic className={`w-3.5 h-3.5 ${isVoiceSpeaking ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                <span className="truncate">Voiceover</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVoiceModalOpen(true);
                  }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300"
                  title="Open Voiceover Studio & Audio Mixer"
                >
                  <Sliders className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateVoiceoverTrack({ isMuted: !project.voiceoverTrack.isMuted });
                  }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title={project.voiceoverTrack.isMuted ? 'Unmute voiceover' : 'Mute voiceover'}
                >
                  {project.voiceoverTrack.isMuted ? (
                    <VolumeX className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-cyan-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Track Content */}
            <div className="relative flex items-center h-full px-2">
              <input
                type="file"
                ref={voiceInputRef}
                onChange={handleVoiceFileChange}
                accept="audio/mp3,audio/wav,audio/m4a,audio/*"
                className="hidden"
              />

              {isRecordingVoice ? (
                <div className="h-10 px-4 rounded-lg bg-rose-950/80 border border-rose-500/60 flex items-center gap-3 shadow-md">
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-300 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    RECORDING LIVE MIC: {Math.floor(recordingElapsedSeconds / 60).toString().padStart(2, '0')}:{(recordingElapsedSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={stopMicrophoneRecording}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>Stop Recording</span>
                  </button>
                </div>
              ) : project.voiceoverTrack.url ? (
                <div
                  style={{ width: `${Math.max(120, project.voiceoverTrack.duration * pxPerSec)}px` }}
                  className="h-10 rounded-lg bg-cyan-950/70 border border-cyan-500/40 px-3 flex items-center justify-between overflow-hidden shadow-sm shrink-0"
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <AudioWaveform className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-medium text-cyan-200 text-[11px] truncate">
                      {project.voiceoverTrack.name}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400/80 shrink-0">
                      ({project.voiceoverTrack.duration.toFixed(1)}s)
                    </span>
                  </div>

                  {/* Waveform Peaks */}
                  <div className="flex items-center gap-0.5 h-6 opacity-75">
                    {(project.voiceoverTrack.waveformPeaks || [0.4, 0.7, 0.9, 0.5, 0.8, 0.3, 0.6]).slice(0, 40).map(
                      (p, i) => (
                        <div
                          key={i}
                          style={{ height: `${Math.max(3, p * 24)}px` }}
                          className="w-1 bg-cyan-400 rounded-full"
                        />
                      )
                    )}
                  </div>
                </div>
              ) : (
                /* Live AI Voice Narration Track */
                <div className="flex items-center gap-2">
                  <div
                    style={{ width: `${Math.max(220, totalDuration * pxPerSec)}px` }}
                    onClick={() => setIsVoiceModalOpen(true)}
                    className={`h-10 rounded-lg border px-3 flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                      isVoiceSpeaking
                        ? 'bg-emerald-950/70 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-cyan-950/40 border-cyan-500/30 hover:bg-cyan-950/60 hover:border-cyan-500/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate mr-3">
                      <Mic className={`w-3.5 h-3.5 shrink-0 ${isVoiceSpeaking ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                      <span className="text-[11px] font-medium text-cyan-100 truncate">
                        {isVoiceSpeaking ? 'Narrator Speaking Live...' : 'AI Neural Voice Narrator (Live Speech)'}
                      </span>
                      <span className="text-[10px] text-cyan-400/70 font-mono hidden sm:inline">
                        (Active on Play)
                      </span>
                    </div>

                    {/* Speech animated visualizer bars */}
                    <div className="flex items-center gap-0.5 h-5 opacity-80 shrink-0">
                      {[0.4, 0.8, 0.5, 0.9, 0.6, 0.3, 0.7, 0.5, 0.8, 0.4].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            height: isVoiceSpeaking ? `${Math.max(4, Math.random() * 20 + 4)}px` : `${h * 16}px`,
                          }}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            isVoiceSpeaking ? 'bg-emerald-400' : 'bg-cyan-400/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id="btn-timeline-test-voice"
                      onClick={(e) => {
                        e.stopPropagation();
                        testVoice();
                      }}
                      className="h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-cyan-300 text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-sm"
                      title="Test Voice Output"
                    >
                      <Volume2 className="w-3 h-3 text-cyan-400" />
                      <span>Test Voice</span>
                    </button>

                    <button
                      id="btn-timeline-record-mic"
                      onClick={(e) => {
                        e.stopPropagation();
                        startMicrophoneRecording();
                      }}
                      className="h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/60 text-slate-300 hover:text-rose-300 text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-sm"
                      title="Record your microphone voiceover"
                    >
                      <Mic className="w-3 h-3 text-rose-400" />
                      <span>Record Mic</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        voiceInputRef.current?.click();
                      }}
                      className="h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-sm"
                      title="Upload existing voiceover audio file"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TRACK 3: BACKGROUND MUSIC */}
          <div className="h-14 border-b border-slate-800/80 flex group">
            {/* Track Header */}
            <div className="w-44 bg-slate-950 border-r border-slate-800 shrink-0 px-3 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                <Music className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">Music Track</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateMusicTrack({ isMuted: !project.musicTrack.isMuted });
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                title={project.musicTrack.isMuted ? 'Unmute' : 'Mute'}
              >
                {project.musicTrack.isMuted ? (
                  <VolumeX className="w-3 h-3 text-rose-400" />
                ) : (
                  <Volume2 className="w-3 h-3 text-slate-400" />
                )}
              </button>
            </div>

            {/* Track Content */}
            <div className="relative flex items-center h-full px-2">
              <div
                style={{ width: `${totalDuration * pxPerSec}px` }}
                className="h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/40 px-3 flex items-center justify-between overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Music className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium text-emerald-200 text-[11px] truncate">
                    {project.musicTrack.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Vol</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={project.musicTrack.volume}
                    onChange={(e) =>
                      updateMusicTrack({ volume: parseFloat(e.target.value) })
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 h-1 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TRACK 4: CAPTIONS / SPOKEN TEXT OVERLAY */}
          <div className="h-12 flex group">
            {/* Track Header */}
            <div
              onClick={() => setActiveRightTab('effects')}
              className="w-44 bg-slate-950 border-r border-slate-800 shrink-0 px-3 flex items-center justify-between text-slate-300 hover:bg-slate-900 cursor-pointer transition-colors"
              title="Click to customize spoken text animations & visual effects"
            >
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                <Subtitles className="w-3.5 h-3.5 text-amber-400" />
                <span>Captions & FX</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveRightTab('effects');
                }}
                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
              >
                Animate
              </button>
            </div>

            {/* Track Content */}
            <div className="relative flex items-center h-full px-2">
              {project.captions.map((cap) => {
                const startX = cap.startTime * pxPerSec;
                const widthPx = Math.max(30, (cap.endTime - cap.startTime) * pxPerSec);

                return (
                  <div
                    key={cap.id}
                    onClick={() => {
                      seek(cap.startTime);
                      setActiveRightTab('effects');
                    }}
                    style={{ left: `${startX}px`, width: `${widthPx}px` }}
                    className="h-7 absolute rounded bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 hover:border-amber-400 px-2 flex items-center overflow-hidden cursor-pointer transition-all shadow-sm"
                    title={`${cap.text} (${cap.startTime.toFixed(1)}s - ${cap.endTime.toFixed(1)}s) - Click to animate`}
                  >
                    <span className="text-[10px] text-amber-200 truncate font-medium">
                      {cap.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
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
