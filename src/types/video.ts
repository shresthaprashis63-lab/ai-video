export type VisualStyle =
  | 'cinematic'
  | 'realistic'
  | 'documentary'
  | 'anime'
  | '3d'
  | 'cartoon'
  | 'gaming'
  | 'sci-fi'
  | 'fantasy'
  | 'minimalist'
  | 'custom';

export type CameraMovement =
  | 'static'
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'tracking'
  | 'handheld'
  | 'cinematic';

export type TransitionType =
  | 'cut'
  | 'fade'
  | 'dissolve'
  | 'zoom'
  | 'slide'
  | 'blur'
  | 'cinematic';

export type AspectRatio = '9:16' | '16:9' | '1:1';
export type VideoResolution = '720p' | '1080p' | '4k';
export type ExportQuality = 'standard' | 'high' | 'maximum';
export type VideoFormat = 'mp4' | 'webm';

export type AIProviderId = 'studio_engine' | 'veo' | 'runway' | 'luma' | 'kling';

export interface Scene {
  id: string;
  order: number;
  scriptText: string;
  duration: number; // in seconds (e.g. 5.5)
  referenceImage: string | null; // data URL or image URL
  referenceImageName?: string;
  videoPrompt: string;
  cameraMovement: CameraMovement;
  transition: TransitionType;
  transitionDuration: number; // in seconds, default 0.5
  status: 'idle' | 'generating' | 'ready' | 'error';
  progress?: number; // 0 - 100
  videoUrl?: string | null; // rendered clip or animated canvas preview
  generatedPosterUrl?: string | null;
  soundEffect?: string | null;
  soundEffectVolume?: number; // 0 - 1
  lightingStyle?: string;
  motionStrength?: number; // 1 - 10
  modificationHistory?: string[];
  error?: string | null;
}

export interface AudioTrack {
  id: string;
  type: 'voiceover' | 'music' | 'sfx';
  name: string;
  url: string | null;
  duration: number; // total duration in seconds
  volume: number; // 0 to 1
  isMuted: boolean;
  trimStart: number; // in seconds
  trimEnd: number; // in seconds
  waveformPeaks?: number[]; // normalized 0 - 1 values for UI waveform
  fileData?: string | null; // data URL
  voiceId?: string; // speech synthesis voice identifier
  voiceName?: string;
  useLiveVoice?: boolean; // enable live browser speech synthesis narration
}

export interface CaptionItem {
  id: string;
  sceneId: string;
  text: string;
  startTime: number; // seconds
  endTime: number; // seconds
}

export type CaptionAnimationEffect =
  | 'karaoke_pop'
  | 'kinetic_bounce'
  | 'typewriter'
  | 'neon_glow'
  | 'slide_fade'
  | 'classic';

export interface CaptionStyle {
  font: string;
  fontSize: number; // in px
  color: string;
  highlightColor: string; // active spoken word color (e.g. #fbbf24)
  backgroundColor: string;
  position: 'bottom' | 'center' | 'top';
  showBackground: boolean;
  fontWeight: 'normal' | 'bold' | 'black';
  animationEffect: CaptionAnimationEffect;
  textCase: 'uppercase' | 'capitalize' | 'normal';
  strokeColor?: string;
  strokeWidth?: number;
  glowIntensity?: number;
}

export interface VideoVisualEffects {
  filmGrain: number; // 0 to 1
  cinematicBars: boolean; // 2.39:1 letterbox
  vignette: number; // 0 to 1
  lightLeak: boolean; // subtle warm anamorphic leak
  rgbGlitch: boolean; // chromatic aberration pulse
  atmosphericDust: boolean; // floating dust motes
}

export interface ProjectSettings {
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
  defaultVisualPreset: VisualStyle;
  customVisualPrompt: string;
  aiProvider: AIProviderId;
  maintainVisualConsistency: boolean;
  fps: number;
  effects: VideoVisualEffects;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  script: string;
  scenes: Scene[];
  voiceoverTrack: AudioTrack;
  musicTrack: AudioTrack;
  sfxTrack: AudioTrack;
  captions: CaptionItem[];
  captionStyle: CaptionStyle;
  settings: ProjectSettings;
  activeSceneId: string | null;
}

export interface AIProviderInfo {
  id: AIProviderId;
  name: string;
  company: string;
  description: string;
  maxResolution: string;
  supportedRatios: AspectRatio[];
  isAvailable: boolean;
  isExternalApi: boolean;
  requiresKey: boolean;
  keyConfigured: boolean;
}

export interface GenerationStepProgress {
  stage:
    | 'idle'
    | 'analyzing_script'
    | 'creating_scenes'
    | 'generating_prompts'
    | 'generating_clips'
    | 'syncing_voice'
    | 'adding_transitions'
    | 'rendering_preview'
    | 'completed'
    | 'error';
  message: string;
  currentSceneIndex?: number;
  totalScenes?: number;
  percentage: number;
}
