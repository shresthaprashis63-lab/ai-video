import { GoogleGenAI } from '@google/genai';
import { CameraMovement, Scene, TransitionType, VisualStyle, AIProviderId } from '../types/video';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export async function handleAnalyzeScript(reqBody: {
  script: string;
  visualStyle?: VisualStyle;
  aspectRatio?: string;
  targetDurationSeconds?: number;
}) {
  const { script, visualStyle = 'cinematic', targetDurationSeconds } = reqBody;

  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `You are a world-class cinematic film director and AI video prompt engineer.
Analyze the following video script and break it down into an sequential series of visually striking scenes/shots.
Make sure the scenes together cover the entire script smoothly, maintaining visual consistency in characters, environment, color palette, and mood.

Visual Style: ${visualStyle}
${targetDurationSeconds ? `Target Total Duration: ~${targetDurationSeconds} seconds.` : ''}

Script to analyze:
"""${script}"""

Return a JSON array of scene objects ONLY, with the following exact structure:
[
  {
    "order": 1,
    "scriptText": "The exact voiceover or narrative line corresponding to this scene",
    "duration": 5.0, // estimated spoken duration in seconds (between 3.0 and 9.0)
    "videoPrompt": "Highly descriptive text-to-video prompt detailing subject, lighting, environment, textures, colors, and camera angle suitable for a video generation model",
    "cameraMovement": "static" | "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "tracking" | "handheld" | "cinematic",
    "transition": "cut" | "fade" | "dissolve" | "zoom" | "slide" | "blur" | "cinematic",
    "soundEffect": "Short ambient sound or SFX description like 'whoosh', 'thunder', 'gentle wind', etc.",
    "lightingStyle": "e.g. golden hour volumetric light, neon chiaroscuro, soft diffused studio"
  }
]
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return {
            success: true,
            scenes: parsed.map((item, idx) => ({
              id: `scene-${Date.now()}-${idx + 1}`,
              order: idx + 1,
              scriptText: item.scriptText || '',
              duration: Number(item.duration) || 5.0,
              referenceImage: null,
              videoPrompt: item.videoPrompt || item.scriptText,
              cameraMovement: (item.cameraMovement as CameraMovement) || 'cinematic',
              transition: (item.transition as TransitionType) || (idx === 0 ? 'cut' : 'dissolve'),
              transitionDuration: 0.5,
              status: 'idle',
              soundEffect: item.soundEffect || null,
              soundEffectVolume: 0.7,
              lightingStyle: item.lightingStyle || 'Cinematic High Key',
              modificationHistory: [],
            })),
            source: 'gemini',
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API script analysis error, utilizing intelligent heuristic breakdown:', err);
    }
  }

  // Intelligent fallback breakdown engine when API key is missing or offline
  return {
    success: true,
    scenes: fallbackScriptBreakdown(script, visualStyle),
    source: 'engine_heuristic',
  };
}

export async function handleModifyScene(reqBody: {
  currentScene: Scene;
  instruction: string;
  visualStyle?: VisualStyle;
}) {
  const { currentScene, instruction, visualStyle = 'cinematic' } = reqBody;
  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `You are an AI video director. A video scene has the current prompt:
"${currentScene.videoPrompt}"
Camera Movement: ${currentScene.cameraMovement}
Script text: "${currentScene.scriptText}"
Visual style: ${visualStyle}

The user gave the following modification instruction:
"${instruction}"

Modify the scene parameters to reflect this change precisely while preserving consistency.
Return a JSON object ONLY with:
{
  "updatedPrompt": "new enhanced prompt incorporating the instruction",
  "cameraMovement": "static" | "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "tracking" | "handheld" | "cinematic",
  "lightingStyle": "updated lighting style",
  "soundEffect": "suggested sound effect if relevant or keep existing"
}`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        return {
          success: true,
          updatedPrompt: parsed.updatedPrompt || `${currentScene.videoPrompt}, ${instruction}`,
          cameraMovement: parsed.cameraMovement || currentScene.cameraMovement,
          lightingStyle: parsed.lightingStyle || currentScene.lightingStyle,
          soundEffect: parsed.soundEffect || currentScene.soundEffect,
        };
      }
    } catch (err) {
      console.warn('Gemini modify scene error:', err);
    }
  }

  // Fallback heuristic modification
  const updatedPrompt = `${currentScene.videoPrompt}, ${instruction}, enhanced aesthetic detail`;
  let movement = currentScene.cameraMovement;
  const lower = instruction.toLowerCase();
  if (lower.includes('pan')) movement = lower.includes('left') ? 'pan_left' : 'pan_right';
  else if (lower.includes('zoom in')) movement = 'zoom_in';
  else if (lower.includes('zoom out')) movement = 'zoom_out';
  else if (lower.includes('handheld') || lower.includes('shake')) movement = 'handheld';
  else if (lower.includes('cinematic')) movement = 'cinematic';
  else if (lower.includes('tracking') || lower.includes('follow')) movement = 'tracking';

  return {
    success: true,
    updatedPrompt,
    cameraMovement: movement,
    lightingStyle: lower.includes('dark') ? 'Moody low-key cinematic shadows' : currentScene.lightingStyle,
    soundEffect: currentScene.soundEffect,
  };
}

export function handleGetProvidersStatus() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  return {
    success: true,
    providers: {
      studio_engine: {
        id: 'studio_engine',
        name: 'Studio Motion & Neural Engine',
        company: 'AuraVision Native',
        description: 'Instant client & server canvas animator. Animates reference frames with fluid camera dynamics, particle ambience, and lighting shaders.',
        maxResolution: '4K',
        supportedRatios: ['9:16', '16:9', '1:1'],
        isAvailable: true,
        isExternalApi: false,
        requiresKey: false,
        keyConfigured: true,
      },
      veo: {
        id: 'veo',
        name: 'Google Veo 2 / Video FX',
        company: 'Google DeepMind',
        description: 'Cinematic video synthesis with reference frame grounding and camera direction.',
        maxResolution: '4K',
        supportedRatios: ['16:9', '9:16', '1:1'],
        isAvailable: true,
        isExternalApi: true,
        requiresKey: true,
        keyConfigured: hasGemini,
      },
      runway: {
        id: 'runway',
        name: 'Runway Gen-3 Alpha',
        company: 'RunwayML',
        description: 'High fidelity motion brush and text-to-video.',
        maxResolution: '1080p',
        supportedRatios: ['16:9', '9:16', '1:1'],
        isAvailable: true,
        isExternalApi: true,
        requiresKey: true,
        keyConfigured: Boolean(process.env.RUNWAY_API_KEY),
      },
      luma: {
        id: 'luma',
        name: 'Luma Dream Machine',
        company: 'Luma AI',
        description: 'Physically accurate camera motion simulation.',
        maxResolution: '1080p',
        supportedRatios: ['16:9', '9:16', '1:1'],
        isAvailable: true,
        isExternalApi: true,
        requiresKey: true,
        keyConfigured: Boolean(process.env.LUMA_API_KEY),
      },
      kling: {
        id: 'kling',
        name: 'Kling 1.5 Pro',
        company: 'Kuaishou Technology',
        description: 'Deep reference frame consistency and temporal stability.',
        maxResolution: '1080p',
        supportedRatios: ['16:9', '9:16'],
        isAvailable: true,
        isExternalApi: true,
        requiresKey: true,
        keyConfigured: Boolean(process.env.KLING_API_KEY),
      },
    },
  };
}

// Fallback intelligent cinematic breaker
function fallbackScriptBreakdown(script: string, visualStyle: VisualStyle): Scene[] {
  const paragraphs = script
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  let segments: string[] = [];

  if (paragraphs.length >= 3) {
    segments = paragraphs;
  } else {
    // Split by sentence groups
    const sentences = script
      .replace(/([.?!])\s*(?=[A-Z0-9"'])/g, '$1|')
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    if (sentences.length <= 3) {
      segments = sentences;
    } else {
      // Chunk sentences into 1-2 sentence scenes
      for (let i = 0; i < sentences.length; i += 2) {
        segments.push(sentences.slice(i, i + 2).join(' '));
      }
    }
  }

  if (segments.length === 0) {
    segments = ['Imagine waking up one morning to a transformed world.'];
  }

  const cameraMotions: CameraMovement[] = [
    'cinematic',
    'zoom_in',
    'tracking',
    'pan_left',
    'zoom_out',
    'handheld',
    'pan_right',
  ];

  const transitions: TransitionType[] = [
    'cut',
    'dissolve',
    'fade',
    'zoom',
    'cinematic',
    'slide',
    'blur',
  ];

  return segments.map((seg, idx) => {
    const wordCount = seg.split(/\s+/).length;
    // Spoken speech rate: ~2.5 words per second
    const estimatedDuration = Math.max(3.5, Math.min(12, Math.round((wordCount / 2.3) * 10) / 10));
    const motion = cameraMotions[idx % cameraMotions.length];
    const trans = idx === 0 ? 'cut' : transitions[idx % transitions.length];

    const stylePrefix = getStylePromptPrefix(visualStyle);
    const videoPrompt = `${stylePrefix} ${seg.replace(/"/g, '')}, 8k resolution, photorealistic cinematic lighting, highly detailed textures, masterwork frame composition, ${motion} camera movement`;

    return {
      id: `scene-${Date.now()}-${idx + 1}`,
      order: idx + 1,
      scriptText: seg,
      duration: estimatedDuration,
      referenceImage: null,
      videoPrompt,
      cameraMovement: motion,
      transition: trans,
      transitionDuration: 0.5,
      status: 'idle',
      soundEffect: idx % 2 === 0 ? 'Cinematic sub-bass swell' : 'Subtle atmospheric ambience',
      soundEffectVolume: 0.6,
      lightingStyle: idx % 2 === 0 ? 'Atmospheric golden hour' : 'Deep contrast cinematic chiaroscuro',
      modificationHistory: [],
    };
  });
}

function getStylePromptPrefix(style: VisualStyle): string {
  switch (style) {
    case 'anime':
      return 'Makoto Shinkai studio anime style, vibrant emotive skies, delicate line art, cel shaded:';
    case 'sci-fi':
      return 'Futuristic cyberpunk sci-fi, volumetric neon reflections, hyper-technological architectural detailing:';
    case 'realistic':
      return 'Raw 35mm documentary photography, natural depth of field, authentic film grain, pristine realism:';
    case 'documentary':
      return 'National Geographic documentary 4K footage, authentic natural lighting, wide cinematic angle:';
    case '3d':
      return 'Pixar Unreal Engine 5 render, subsurface scattering, tactile 3D realism, rich lighting:';
    case 'cartoon':
      return 'Stylized graphic animated aesthetic, expressive character dynamics, clean color palettes:';
    case 'gaming':
      return 'Next-gen raytraced gameplay cinematic, dynamic motion blur, high action visual effects:';
    case 'fantasy':
      return 'High fantasy epic cinematic, ethereal mystical glow, ancient monolithic architectures, rich atmospheric mist:';
    case 'minimalist':
      return 'Minimalist architectural cinematography, clean geometric lines, neutral tone balance, expansive negative space:';
    case 'custom':
    case 'cinematic':
    default:
      return 'Cinematic Panavision anamorphic shot, Arri Alexa 65, pristine color grading, volumetric lighting:';
  }
}
