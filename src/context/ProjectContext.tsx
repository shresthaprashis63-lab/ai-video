import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import {
  AspectRatio,
  CameraMovement,
  CaptionItem,
  CaptionStyle,
  Project,
  ProjectSettings,
  Scene,
  TransitionType,
  VideoResolution,
  AIProviderId,
  VideoVisualEffects,
} from '../types/video';
import { PRESET_TEMPLATES } from '../data/templates';
import {
  generateCaptionsFromScenes,
  parseAudioFile,
  synchronizeScenesWithVoiceover,
  synthesizeSpeech,
} from '../utils/audioSync';
import { requestSceneGeneration } from '../services/aiProvider';
import { voiceEngine } from '../services/voiceEngine';

interface ProjectContextType {
  // Current active project
  project: Project;
  projects: Project[];
  activeView: 'studio' | 'dashboard' | 'projects' | 'templates' | 'assets' | 'settings';
  setActiveView: (view: 'studio' | 'dashboard' | 'projects' | 'templates' | 'assets' | 'settings') => void;
  
  // Project CRUD
  createProject: (name?: string, templateId?: string) => Project;
  switchProject: (projectId: string) => void;
  saveProject: () => void;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  loadTemplate: (templateId: string) => void;

  // Script & Scene actions
  updateScript: (script: string) => void;
  setScenes: (scenes: Scene[]) => void;
  activeScene: Scene | null;
  setActiveSceneId: (id: string | null) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  addScene: (afterIndex?: number) => void;
  duplicateScene: (id: string) => void;
  deleteScene: (id: string) => void;
  reorderScenes: (startIndex: number, endIndex: number) => void;
  splitScene: (id: string, splitTimeFraction: number) => void;
  regenerateSingleScene: (id: string, instructionModifier?: string, newReference?: string) => Promise<void>;
  generateAllScenes: () => Promise<void>;
  isGeneratingScenes: boolean;
  generationProgressText: string;

  // Reference Frame
  uploadReferenceImage: (sceneId: string, file: File) => Promise<void>;
  removeReferenceImage: (sceneId: string) => void;

  // Voiceover & Audio
  uploadVoiceoverFile: (file: File) => Promise<void>;
  syncWithVoiceover: () => void;
  updateVoiceoverTrack: (updates: Partial<Project['voiceoverTrack']>) => void;
  updateMusicTrack: (updates: Partial<Project['musicTrack']>) => void;
  updateSfxTrack: (updates: Partial<Project['sfxTrack']>) => void;
  generateAIVoiceover: (voiceId?: string) => Promise<void>;

  // Voice Recording & Live Speech
  isVoiceSpeaking: boolean;
  isRecordingVoice: boolean;
  recordingElapsedSeconds: number;
  startMicrophoneRecording: () => Promise<void>;
  stopMicrophoneRecording: () => Promise<void>;
  testVoice: (voiceId?: string) => Promise<boolean>;

  // Captions
  updateCaption: (id: string, updates: Partial<CaptionItem>) => void;
  updateCaptionStyle: (updates: Partial<CaptionStyle>) => void;
  regenerateCaptions: () => void;

  // Settings
  updateSettings: (updates: Partial<ProjectSettings>) => void;

  // Playback & Timeline
  currentTime: number;
  isPlaying: boolean;
  totalDuration: number;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (timeSeconds: number) => void;
  timelineZoom: number;
  setTimelineZoom: (zoom: number) => void;

  // Studio UI layout
  activeRightTab: 'scene' | 'effects';
  setActiveRightTab: (tab: 'scene' | 'effects') => void;
}

const STORAGE_KEY = 'ai_video_studio_projects_v2';
const ACTIVE_ID_KEY = 'ai_video_studio_active_id';

function createDefaultProject(name = 'Untilted Project'): Project {
  const tpl = PRESET_TEMPLATES[0];
  const initialScenes: Scene[] = tpl.scenes.map((s, i) => ({
    ...s,
    id: `scene-${Date.now()}-${i + 1}`,
  }));

  const initialCaptions = generateCaptionsFromScenes(initialScenes);

  return {
    id: `proj-${Date.now()}`,
    name,
    description: 'Cinematic AI video composition',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    script: tpl.fullScript,
    scenes: initialScenes,
    voiceoverTrack: {
      id: 'track-voiceover',
      type: 'voiceover',
      name: 'AI Neural Voice Narrator',
      url: null,
      duration: 135,
      volume: 1.0,
      isMuted: false,
      trimStart: 0,
      trimEnd: 135,
      useLiveVoice: true,
    },
    musicTrack: {
      id: 'track-music',
      type: 'music',
      name: 'Ambient Cinematic Atmosphere',
      url: 'https://assets.mixkit.co/music/preview/mixkit-cinematic-mystery-suspense-hum-2852.mp3',
      duration: 180,
      volume: 0.45,
      isMuted: false,
      trimStart: 0,
      trimEnd: 180,
    },
    sfxTrack: {
      id: 'track-sfx',
      type: 'sfx',
      name: 'Sound Effects & Transitions',
      url: null,
      duration: 135,
      volume: 0.7,
      isMuted: false,
      trimStart: 0,
      trimEnd: 135,
    },
    captions: initialCaptions,
    captionStyle: {
      font: 'Plus Jakarta Sans, sans-serif',
      fontSize: 28,
      color: '#ffffff',
      highlightColor: '#fbbf24',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      position: 'bottom',
      showBackground: true,
      fontWeight: 'bold',
      animationEffect: 'karaoke_pop',
      textCase: 'uppercase',
      strokeColor: '#000000',
      strokeWidth: 4,
      glowIntensity: 0.6,
    },
    settings: {
      aspectRatio: '9:16',
      resolution: '1080p',
      defaultVisualPreset: 'sci-fi',
      customVisualPrompt: '',
      aiProvider: 'studio_engine',
      maintainVisualConsistency: true,
      fps: 30,
      effects: {
        filmGrain: 0.12,
        cinematicBars: false,
        vignette: 0.35,
        lightLeak: false,
        rgbGlitch: false,
        atmosphericDust: true,
      },
    },
    activeSceneId: initialScenes[0]?.id || null,
  };
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load projects from storage:', e);
    }
    return [createDefaultProject('The Chrono Paradox')];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const savedId = localStorage.getItem(ACTIVE_ID_KEY);
    if (savedId && projects.some((p) => p.id === savedId)) {
      return savedId;
    }
    return projects[0]?.id || '';
  });

  const [activeView, setActiveView] = useState<
    'studio' | 'dashboard' | 'projects' | 'templates' | 'assets' | 'settings'
  >('studio');

  const [activeRightTab, setActiveRightTab] = useState<'scene' | 'effects'>('scene');

  // Playback & Timeline states
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [timelineZoom, setTimelineZoom] = useState(1.0);

  // Generation status states
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);
  const [generationProgressText, setGenerationProgressText] = useState('');

  // Voiceover & Recording states
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);
  const lastSpokenSceneIdRef = useRef<string | null>(null);

  // Subscribe to voice synthesis activity
  useEffect(() => {
    const unsub = voiceEngine.subscribeSpeaking((speaking) => {
      setIsVoiceSpeaking(speaking);
    });
    return unsub;
  }, []);

  // Audio elements for playback
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Current project memo with safety defaults
  const project = useMemo(() => {
    const raw = projects.find((p) => p.id === activeProjectId) || projects[0] || createDefaultProject();
    
    const defaultCaptionStyle: CaptionStyle = {
      font: 'Plus Jakarta Sans, sans-serif',
      fontSize: 28,
      color: '#ffffff',
      highlightColor: '#fbbf24',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      position: 'bottom',
      showBackground: true,
      fontWeight: 'bold',
      animationEffect: 'karaoke_pop',
      textCase: 'uppercase',
      strokeColor: '#000000',
      strokeWidth: 4,
      glowIntensity: 0.6,
    };

    const defaultEffects: VideoVisualEffects = {
      filmGrain: 0.12,
      cinematicBars: false,
      vignette: 0.35,
      lightLeak: false,
      rgbGlitch: false,
      atmosphericDust: true,
    };

    const mergedCaptionStyle: CaptionStyle = {
      ...defaultCaptionStyle,
      ...(raw.captionStyle || {}),
      animationEffect: raw.captionStyle?.animationEffect || defaultCaptionStyle.animationEffect,
      highlightColor: raw.captionStyle?.highlightColor || defaultCaptionStyle.highlightColor,
      textCase: raw.captionStyle?.textCase || defaultCaptionStyle.textCase,
    };

    const mergedEffects: VideoVisualEffects = {
      ...defaultEffects,
      ...(raw.settings?.effects || {}),
    };

    return {
      ...raw,
      captionStyle: mergedCaptionStyle,
      settings: {
        ...raw.settings,
        effects: mergedEffects,
      },
    };
  }, [projects, activeProjectId]);

  // Total duration of scenes
  const totalDuration = useMemo(() => {
    const sum = project.scenes.reduce((acc, s) => acc + s.duration, 0);
    return Math.max(sum, 1.0);
  }, [project.scenes]);

  // Active scene based on timeline currentTime or manual selection
  const activeScene = useMemo(() => {
    if (project.activeSceneId) {
      const found = project.scenes.find((s) => s.id === project.activeSceneId);
      if (found) return found;
    }

    let elapsed = 0;
    for (const scene of project.scenes) {
      if (currentTime >= elapsed && currentTime <= elapsed + scene.duration) {
        return scene;
      }
      elapsed += scene.duration;
    }
    return project.scenes[0] || null;
  }, [project.scenes, project.activeSceneId, currentTime]);

  // Persist projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      localStorage.setItem(ACTIVE_ID_KEY, activeProjectId);
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [projects, activeProjectId]);

  // Audio synchronization setup
  useEffect(() => {
    if (project.voiceoverTrack.url) {
      if (!voiceAudioRef.current) voiceAudioRef.current = new Audio();
      voiceAudioRef.current.src = project.voiceoverTrack.url;
      voiceAudioRef.current.volume = project.voiceoverTrack.isMuted ? 0 : project.voiceoverTrack.volume;
    }
    if (project.musicTrack.url) {
      if (!musicAudioRef.current) musicAudioRef.current = new Audio();
      musicAudioRef.current.src = project.musicTrack.url;
      musicAudioRef.current.loop = true;
      musicAudioRef.current.volume = project.musicTrack.isMuted ? 0 : project.musicTrack.volume;
    }
  }, [project.voiceoverTrack.url, project.musicTrack.url]);

  // Volume updates
  useEffect(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.volume = project.voiceoverTrack.isMuted ? 0 : project.voiceoverTrack.volume;
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = project.musicTrack.isMuted ? 0 : project.musicTrack.volume;
    }
  }, [
    project.voiceoverTrack.volume,
    project.voiceoverTrack.isMuted,
    project.musicTrack.volume,
    project.musicTrack.isMuted,
  ]);

  // Playhead animation loop & voiceover speech synchronization
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (voiceAudioRef.current) voiceAudioRef.current.pause();
      if (musicAudioRef.current) musicAudioRef.current.pause();
      voiceEngine.stop();
      lastSpokenSceneIdRef.current = null;
      return;
    }

    const hasAudioUrl = Boolean(project.voiceoverTrack.url && !project.voiceoverTrack.useLiveVoice);

    if (hasAudioUrl && voiceAudioRef.current) {
      voiceAudioRef.current.currentTime = currentTime;
      voiceAudioRef.current.playbackRate = playbackSpeed;
      voiceAudioRef.current.play().catch((err) => {
        console.warn('Voice track audio play notice:', err);
      });
    }

    if (musicAudioRef.current && project.musicTrack.url) {
      musicAudioRef.current.currentTime = currentTime % (project.musicTrack.duration || 180);
      musicAudioRef.current.playbackRate = playbackSpeed;
      musicAudioRef.current.play().catch((err) => {
        console.warn('Music track audio play notice:', err);
      });
    }

    const shouldLiveNarrate = (!hasAudioUrl || project.voiceoverTrack.useLiveVoice) && !project.voiceoverTrack.isMuted;

    if (shouldLiveNarrate) {
      let elapsed = 0;
      let targetScene: Scene | null = null;
      for (const scene of project.scenes) {
        if (currentTime >= elapsed && currentTime < elapsed + scene.duration) {
          targetScene = scene;
          break;
        }
        elapsed += scene.duration;
      }
      if (!targetScene && project.scenes.length > 0) {
        targetScene = project.scenes[0];
      }

      if (targetScene && targetScene.id !== lastSpokenSceneIdRef.current) {
        lastSpokenSceneIdRef.current = targetScene.id;
        voiceEngine.speakScene(targetScene.id, targetScene.scriptText, {
          volume: project.voiceoverTrack.volume,
          rate: playbackSpeed,
          isMuted: project.voiceoverTrack.isMuted,
          voiceId: project.voiceoverTrack.voiceId,
        });
      }
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + delta * playbackSpeed;
        if (next >= totalDuration) {
          setIsPlaying(false);
          voiceEngine.stop();
          lastSpokenSceneIdRef.current = null;
          return 0; // loop back to start
        }

        // Real-time scene transition speech trigger
        if (shouldLiveNarrate) {
          let elapsed = 0;
          for (const scene of project.scenes) {
            if (next >= elapsed && next < elapsed + scene.duration) {
              if (scene.id !== lastSpokenSceneIdRef.current) {
                lastSpokenSceneIdRef.current = scene.id;
                voiceEngine.speakScene(scene.id, scene.scriptText, {
                  volume: project.voiceoverTrack.volume,
                  rate: playbackSpeed,
                  isMuted: project.voiceoverTrack.isMuted,
                  voiceId: project.voiceoverTrack.voiceId,
                });
              }
              break;
            }
            elapsed += scene.duration;
          }
        }

        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    isPlaying,
    playbackSpeed,
    totalDuration,
    project.scenes,
    project.voiceoverTrack.url,
    project.voiceoverTrack.useLiveVoice,
    project.voiceoverTrack.volume,
    project.voiceoverTrack.isMuted,
    project.voiceoverTrack.voiceId,
    project.musicTrack.url,
  ]);

  // Mutators
  const updateProject = (fn: (prev: Project) => Project) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProjectId) {
          const updated = fn(p);
          return { ...updated, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  const createProject = (name = 'New AI Video Project', templateId?: string): Project => {
    let newProj: Project;
    if (templateId) {
      const tpl = PRESET_TEMPLATES.find((t) => t.id === templateId) || PRESET_TEMPLATES[0];
      const copiedScenes: Scene[] = tpl.scenes.map((s, idx) => ({
        ...s,
        id: `scene-${Date.now()}-${idx + 1}`,
      }));
      newProj = {
        ...createDefaultProject(name),
        id: `proj-${Date.now()}`,
        name,
        script: tpl.fullScript,
        scenes: copiedScenes,
        captions: generateCaptionsFromScenes(copiedScenes),
        settings: {
          ...createDefaultProject().settings,
          defaultVisualPreset: tpl.visualStyle,
          aspectRatio: tpl.aspectRatio,
        },
      };
    } else {
      newProj = createDefaultProject(name);
    }

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setCurrentTime(0);
    setIsPlaying(false);
    return newProj;
  };

  const switchProject = (id: string) => {
    if (projects.some((p) => p.id === id)) {
      setActiveProjectId(id);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const saveProject = () => {
    updateProject((p) => ({ ...p, updatedAt: new Date().toISOString() }));
  };

  const renameProject = (id: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const duplicateProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const duplicated: Project = {
      ...target,
      id: `proj-${Date.now()}`,
      name: `${target.name} (Copy)`,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [duplicated, ...prev]);
  };

  const deleteProject = (id: string) => {
    if (projects.length <= 1) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) {
      const remaining = projects.filter((p) => p.id !== id);
      if (remaining[0]) setActiveProjectId(remaining[0].id);
    }
  };

  const loadTemplate = (templateId: string) => {
    const tpl = PRESET_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const newScenes: Scene[] = tpl.scenes.map((s, idx) => ({
      ...s,
      id: `scene-${Date.now()}-${idx + 1}`,
    }));
    updateProject((p) => ({
      ...p,
      script: tpl.fullScript,
      scenes: newScenes,
      captions: generateCaptionsFromScenes(newScenes),
      settings: {
        ...p.settings,
        defaultVisualPreset: tpl.visualStyle,
        aspectRatio: tpl.aspectRatio,
      },
    }));
    setCurrentTime(0);
  };

  const updateScript = (script: string) => {
    updateProject((p) => ({ ...p, script }));
  };

  const setScenes = (scenes: Scene[]) => {
    updateProject((p) => ({
      ...p,
      scenes,
      captions: generateCaptionsFromScenes(scenes),
    }));
  };

  const setActiveSceneId = (id: string | null) => {
    updateProject((p) => ({ ...p, activeSceneId: id }));
  };

  const updateScene = (id: string, updates: Partial<Scene>) => {
    updateProject((p) => {
      const newScenes = p.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s));
      const shouldRegenCaptions = Boolean(updates.scriptText || updates.duration);
      return {
        ...p,
        scenes: newScenes,
        captions: shouldRegenCaptions ? generateCaptionsFromScenes(newScenes) : p.captions,
      };
    });
  };

  const addScene = (afterIndex?: number) => {
    updateProject((p) => {
      const insertAt = afterIndex !== undefined ? afterIndex + 1 : p.scenes.length;
      const newScene: Scene = {
        id: `scene-${Date.now()}`,
        order: insertAt + 1,
        scriptText: 'New scene visual description and narrative.',
        duration: 5.0,
        referenceImage: null,
        videoPrompt: 'Cinematic visual composition, atmospheric lighting, high definition, 4k',
        cameraMovement: 'cinematic',
        transition: 'dissolve',
        transitionDuration: 0.5,
        status: 'ready',
        soundEffect: 'Atmospheric ambient tone',
        soundEffectVolume: 0.6,
        lightingStyle: 'Cinematic natural key light',
        modificationHistory: [],
      };

      const newScenes = [...p.scenes];
      newScenes.splice(insertAt, 0, newScene);
      // re-index order
      const reindexed = newScenes.map((s, idx) => ({ ...s, order: idx + 1 }));

      return {
        ...p,
        scenes: reindexed,
        activeSceneId: newScene.id,
        captions: generateCaptionsFromScenes(reindexed),
      };
    });
  };

  const duplicateScene = (id: string) => {
    updateProject((p) => {
      const idx = p.scenes.findIndex((s) => s.id === id);
      if (idx === -1) return p;
      const target = p.scenes[idx];
      const duplicated: Scene = {
        ...target,
        id: `scene-${Date.now()}`,
        order: idx + 2,
        scriptText: `${target.scriptText} (Continued)`,
      };
      const newScenes = [...p.scenes];
      newScenes.splice(idx + 1, 0, duplicated);
      const reindexed = newScenes.map((s, i) => ({ ...s, order: i + 1 }));
      return {
        ...p,
        scenes: reindexed,
        captions: generateCaptionsFromScenes(reindexed),
      };
    });
  };

  const deleteScene = (id: string) => {
    updateProject((p) => {
      if (p.scenes.length <= 1) return p;
      const filtered = p.scenes.filter((s) => s.id !== id);
      const reindexed = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
      return {
        ...p,
        scenes: reindexed,
        activeSceneId: reindexed[0]?.id || null,
        captions: generateCaptionsFromScenes(reindexed),
      };
    });
  };

  const reorderScenes = (startIndex: number, endIndex: number) => {
    updateProject((p) => {
      const result = Array.from(p.scenes);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      const reindexed = result.map((s, idx) => ({ ...s, order: idx + 1 }));
      return {
        ...p,
        scenes: reindexed,
        captions: generateCaptionsFromScenes(reindexed),
      };
    });
  };

  const splitScene = (id: string, splitTimeFraction: number) => {
    updateProject((p) => {
      const idx = p.scenes.findIndex((s) => s.id === id);
      if (idx === -1) return p;
      const scene = p.scenes[idx];
      const dur1 = Math.max(1.5, Math.round(scene.duration * splitTimeFraction * 10) / 10);
      const dur2 = Math.max(1.5, Math.round((scene.duration - dur1) * 10) / 10);

      const scene1: Scene = { ...scene, duration: dur1 };
      const scene2: Scene = {
        ...scene,
        id: `scene-${Date.now()}`,
        duration: dur2,
        scriptText: `${scene.scriptText} (Part 2)`,
      };

      const newScenes = [...p.scenes];
      newScenes.splice(idx, 1, scene1, scene2);
      const reindexed = newScenes.map((s, i) => ({ ...s, order: i + 1 }));
      return {
        ...p,
        scenes: reindexed,
        captions: generateCaptionsFromScenes(reindexed),
      };
    });
  };

  const regenerateSingleScene = async (
    id: string,
    instructionModifier?: string,
    newReference?: string
  ) => {
    const scene = project.scenes.find((s) => s.id === id);
    if (!scene) return;

    updateScene(id, { status: 'generating', progress: 20 });

    try {
      let promptToUse = scene.videoPrompt;

      if (instructionModifier) {
        // Call server modifier
        try {
          const res = await fetch('/api/modify-scene', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentScene: scene,
              instruction: instructionModifier,
              visualStyle: project.settings.defaultVisualPreset,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.updatedPrompt) {
              promptToUse = data.updatedPrompt;
              if (data.cameraMovement) {
                updateScene(id, { cameraMovement: data.cameraMovement });
              }
              if (data.lightingStyle) {
                updateScene(id, { lightingStyle: data.lightingStyle });
              }
            }
          }
        } catch (e) {
          console.warn('Modify scene server request failed:', e);
        }
      }

      const history = scene.modificationHistory || [];
      if (instructionModifier) {
        history.push(instructionModifier);
      }

      const result = await requestSceneGeneration({
        scene: { ...scene, videoPrompt: promptToUse },
        settings: project.settings,
        instructionModifier,
        referenceImage: newReference || scene.referenceImage,
      });

      updateScene(id, {
        status: 'ready',
        videoPrompt: promptToUse,
        referenceImage: newReference || scene.referenceImage,
        modificationHistory: history,
        progress: 100,
      });
    } catch (err: any) {
      updateScene(id, { status: 'error', error: err.message });
    }
  };

  const generateAllScenes = async () => {
    if (project.scenes.length === 0) return;
    setIsGeneratingScenes(true);
    setGenerationProgressText('Initiating batch scene generation pipeline...');

    for (let i = 0; i < project.scenes.length; i++) {
      const s = project.scenes[i];
      setGenerationProgressText(
        `Generating Scene ${i + 1}/${project.scenes.length}: ${s.cameraMovement.toUpperCase()}...`
      );
      updateScene(s.id, { status: 'generating', progress: 10 });

      await requestSceneGeneration(
        {
          scene: s,
          settings: project.settings,
        },
        (prog, msg) => {
          updateScene(s.id, { progress: prog });
          setGenerationProgressText(`Scene ${i + 1}/${project.scenes.length}: ${msg}`);
        }
      );

      updateScene(s.id, { status: 'ready', progress: 100 });
    }

    setGenerationProgressText('All scenes generated and synchronized successfully.');
    setIsGeneratingScenes(false);
  };

  const uploadReferenceImage = async (sceneId: string, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        updateScene(sceneId, {
          referenceImage: dataUrl,
          referenceImageName: file.name,
        });
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeReferenceImage = (sceneId: string) => {
    updateScene(sceneId, { referenceImage: null, referenceImageName: undefined });
  };

  const uploadVoiceoverFile = async (file: File) => {
    try {
      const parsed = await parseAudioFile(file);
      updateProject((p) => ({
        ...p,
        voiceoverTrack: {
          ...p.voiceoverTrack,
          name: file.name,
          url: parsed.dataUrl,
          duration: parsed.duration,
          trimEnd: parsed.duration,
          waveformPeaks: parsed.waveform,
        },
      }));
    } catch (err) {
      console.error('Failed to parse uploaded voiceover file:', err);
    }
  };

  const syncWithVoiceover = () => {
    const voiceDuration = project.voiceoverTrack.duration;
    if (voiceDuration <= 0) return;
    const synchronized = synchronizeScenesWithVoiceover(project.scenes, voiceDuration);
    setScenes(synchronized);
  };

  const updateVoiceoverTrack = (updates: Partial<Project['voiceoverTrack']>) => {
    updateProject((p) => ({
      ...p,
      voiceoverTrack: { ...p.voiceoverTrack, ...updates },
    }));
  };

  const updateMusicTrack = (updates: Partial<Project['musicTrack']>) => {
    updateProject((p) => ({
      ...p,
      musicTrack: { ...p.musicTrack, ...updates },
    }));
  };

  const updateSfxTrack = (updates: Partial<Project['sfxTrack']>) => {
    updateProject((p) => ({
      ...p,
      sfxTrack: { ...p.sfxTrack, ...updates },
    }));
  };

  const startMicrophoneRecording = async () => {
    try {
      await voiceEngine.startMicrophoneRecording();
      setIsRecordingVoice(true);
      setRecordingElapsedSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingElapsedSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start microphone recording:', err);
      alert(err.message || 'Microphone access denied. Please grant microphone permissions to record your voice.');
    }
  };

  const stopMicrophoneRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVoice(false);
    try {
      const result = await voiceEngine.stopMicrophoneRecording();
      updateProject((p) => ({
        ...p,
        voiceoverTrack: {
          ...p.voiceoverTrack,
          name: `Microphone Recording (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          url: result.dataUrl,
          duration: result.duration,
          trimEnd: result.duration,
          waveformPeaks: result.waveform,
          useLiveVoice: false,
        },
      }));
      // Auto-align scene timings if user recorded a full voiceover
      if (result.duration >= 3) {
        const synchronized = synchronizeScenesWithVoiceover(project.scenes, result.duration);
        setScenes(synchronized);
      }
    } catch (err) {
      console.error('Failed to stop microphone recording:', err);
    }
  };

  const testVoice = async (voiceId?: string): Promise<boolean> => {
    return voiceEngine.testVoice(voiceId || project.voiceoverTrack.voiceId);
  };

  const generateAIVoiceover = async (voiceId?: string) => {
    if (!project.script) return;
    setIsGeneratingScenes(true);
    setGenerationProgressText('Synthesizing neural voiceover track from script...');
    try {
      const audioResult = await voiceEngine.generateSynthesizedAudioTrack(project.script, totalDuration);
      updateProject((p) => ({
        ...p,
        voiceoverTrack: {
          ...p.voiceoverTrack,
          name: 'Synthesized AI Voiceover',
          url: audioResult.dataUrl,
          duration: audioResult.duration,
          trimEnd: audioResult.duration,
          waveformPeaks: audioResult.waveform,
          voiceId: voiceId || p.voiceoverTrack.voiceId,
          useLiveVoice: false,
        },
      }));
      // Speak sample to verify voice
      await voiceEngine.testVoice(voiceId);
    } catch (e) {
      console.warn('Voice track synthesis error:', e);
    } finally {
      setIsGeneratingScenes(false);
    }
  };

  const updateCaption = (id: string, updates: Partial<CaptionItem>) => {
    updateProject((p) => ({
      ...p,
      captions: p.captions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const updateCaptionStyle = (updates: Partial<CaptionStyle>) => {
    updateProject((p) => ({
      ...p,
      captionStyle: { ...p.captionStyle, ...updates },
    }));
  };

  const regenerateCaptions = () => {
    updateProject((p) => ({
      ...p,
      captions: generateCaptionsFromScenes(p.scenes),
    }));
  };

  const updateSettings = (updates: Partial<ProjectSettings>) => {
    updateProject((p) => ({
      ...p,
      settings: { ...p.settings, ...updates },
    }));
  };

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const togglePlay = () => setIsPlaying((prev) => !prev);
  const seek = (timeSeconds: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, timeSeconds));
    setCurrentTime(clamped);
    if (voiceAudioRef.current) voiceAudioRef.current.currentTime = clamped;
    if (musicAudioRef.current) musicAudioRef.current.currentTime = clamped % (project.musicTrack.duration || 180);

    lastSpokenSceneIdRef.current = null;
    voiceEngine.stop();

    const hasAudioUrl = Boolean(project.voiceoverTrack.url && !project.voiceoverTrack.useLiveVoice);
    if (isPlaying && (!hasAudioUrl || project.voiceoverTrack.useLiveVoice) && !project.voiceoverTrack.isMuted) {
      let elapsed = 0;
      for (const scene of project.scenes) {
        if (clamped >= elapsed && clamped < elapsed + scene.duration) {
          lastSpokenSceneIdRef.current = scene.id;
          voiceEngine.speakScene(scene.id, scene.scriptText, {
            volume: project.voiceoverTrack.volume,
            rate: playbackSpeed,
            isMuted: project.voiceoverTrack.isMuted,
            voiceId: project.voiceoverTrack.voiceId,
          });
          break;
        }
        elapsed += scene.duration;
      }
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        projects,
        activeView,
        setActiveView,
        createProject,
        switchProject,
        saveProject,
        renameProject,
        duplicateProject,
        deleteProject,
        loadTemplate,
        updateScript,
        setScenes,
        activeScene,
        setActiveSceneId,
        updateScene,
        addScene,
        duplicateScene,
        deleteScene,
        reorderScenes,
        splitScene,
        regenerateSingleScene,
        generateAllScenes,
        isGeneratingScenes,
        generationProgressText,
        uploadReferenceImage,
        removeReferenceImage,
        uploadVoiceoverFile,
        syncWithVoiceover,
        updateVoiceoverTrack,
        updateMusicTrack,
        updateSfxTrack,
        generateAIVoiceover,
        isVoiceSpeaking,
        isRecordingVoice,
        recordingElapsedSeconds,
        startMicrophoneRecording,
        stopMicrophoneRecording,
        testVoice,
        updateCaption,
        updateCaptionStyle,
        regenerateCaptions,
        updateSettings,
        currentTime,
        isPlaying,
        totalDuration,
        playbackSpeed,
        setPlaybackSpeed,
        play,
        pause,
        togglePlay,
        seek,
        timelineZoom,
        setTimelineZoom,
        activeRightTab,
        setActiveRightTab,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
  return ctx;
}
