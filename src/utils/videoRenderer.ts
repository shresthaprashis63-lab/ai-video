import {
  AspectRatio,
  CameraMovement,
  CaptionItem,
  CaptionStyle,
  ExportQuality,
  Scene,
  TransitionType,
  VideoResolution,
  VideoVisualEffects,
} from '../types/video';

export interface RenderDimensions {
  width: number;
  height: number;
}

export function getResolutionDimensions(
  resolution: VideoResolution,
  aspectRatio: AspectRatio
): RenderDimensions {
  let baseLong = 1920;
  if (resolution === '4k') baseLong = 3840;
  if (resolution === '720p') baseLong = 1280;

  if (aspectRatio === '9:16') {
    const width = Math.round((baseLong * 9) / 16);
    return { width, height: baseLong };
  } else if (aspectRatio === '1:1') {
    const side = Math.min(baseLong, resolution === '4k' ? 2160 : 1080);
    return { width: side, height: side };
  } else {
    // 16:9
    const height = Math.round((baseLong * 9) / 16);
    return { width: baseLong, height };
  }
}

// Preloads image safely into an HTMLImageElement
export async function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Draws a scene frame with camera movement and post-processing
export function drawSceneFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  scene: Scene,
  progress: number, // 0.0 to 1.0 inside this scene
  width: number,
  height: number,
  visualStyle?: string
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Background fallback
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, width, height);

  if (!img) {
    // Elegant procedural cinematic placeholder if no reference image uploaded yet
    drawProceduralSceneBackground(ctx, scene, progress, width, height, visualStyle);
    ctx.restore();
    return;
  }

  // Calculate Camera Transform
  ctx.save();
  applyCameraMovement(ctx, scene.cameraMovement, progress, width, height);

  // Draw image to cover
  drawImageToCover(ctx, img, width, height);
  ctx.restore();

  // Subtle atmospheric lighting / vignette
  applyAtmosphere(ctx, scene, progress, width, height);

  ctx.restore();
}

function applyCameraMovement(
  ctx: CanvasRenderingContext2D,
  movement: CameraMovement,
  progress: number,
  width: number,
  height: number
) {
  const cx = width / 2;
  const cy = height / 2;

  switch (movement) {
    case 'zoom_in': {
      const scale = 1.0 + progress * 0.18; // 1.0 -> 1.18
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
      break;
    }
    case 'zoom_out': {
      const scale = 1.18 - progress * 0.18; // 1.18 -> 1.0
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
      break;
    }
    case 'pan_left': {
      const scale = 1.12;
      const dx = (progress - 0.5) * (width * 0.08);
      ctx.translate(cx + dx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
      break;
    }
    case 'pan_right': {
      const scale = 1.12;
      const dx = (0.5 - progress) * (width * 0.08);
      ctx.translate(cx + dx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
      break;
    }
    case 'tracking': {
      const scale = 1.15;
      const dx = (progress - 0.5) * (width * 0.06);
      const dy = (progress - 0.5) * (height * 0.04);
      ctx.translate(cx + dx, cy + dy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
      break;
    }
    case 'handheld': {
      const scale = 1.08;
      // Organic sine wave micro-jitter
      const time = progress * Math.PI * 4;
      const dx = Math.sin(time) * (width * 0.008);
      const dy = Math.cos(time * 0.7) * (height * 0.008);
      ctx.translate(cx + dx, cy + dy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
      break;
    }
    case 'cinematic':
    default: {
      const scale = 1.0 + progress * 0.12;
      const dx = (progress - 0.5) * (width * 0.03);
      ctx.translate(cx + dx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
      break;
    }
  }
}

function drawImageToCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
) {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = w / h;

  let dw = w;
  let dh = h;
  let dx = 0;
  let dy = 0;

  if (imgAspect > canvasAspect) {
    dw = h * imgAspect;
    dx = (w - dw) / 2;
  } else {
    dh = w / imgAspect;
    dy = (h - dh) / 2;
  }

  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawProceduralSceneBackground(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  progress: number,
  width: number,
  height: number,
  visualStyle = 'cinematic'
) {
  // Rich gradient palette
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (visualStyle === 'sci-fi') {
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#121829');
    grad.addColorStop(1, '#081726');
  } else if (visualStyle === 'anime') {
    grad.addColorStop(0, '#1a1c2e');
    grad.addColorStop(0.5, '#291e3b');
    grad.addColorStop(1, '#1b2a47');
  } else {
    grad.addColorStop(0, '#0d1117');
    grad.addColorStop(0.5, '#161b22');
    grad.addColorStop(1, '#090d13');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Light beam motion
  const beamX = width * (0.2 + progress * 0.6);
  const radial = ctx.createRadialGradient(beamX, height * 0.35, 10, beamX, height * 0.35, width * 0.7);
  radial.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
  radial.addColorStop(0.6, 'rgba(99, 102, 241, 0.05)');
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // Scene Typography & Visual Prompt Preview
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Scene index badge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = `600 ${Math.max(12, Math.round(width * 0.022))}px sans-serif`;
  ctx.fillText(`SCENE ${scene.order.toString().padStart(2, '0')} • ${scene.cameraMovement.toUpperCase()}`, width / 2, height * 0.38);

  // Script text excerpt
  ctx.fillStyle = '#f8fafc';
  const fontSize = Math.max(16, Math.round(width * 0.035));
  ctx.font = `500 ${fontSize}px sans-serif`;
  const text = scene.scriptText || scene.videoPrompt;
  const words = text.split(' ');
  const line = words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');
  ctx.fillText(line, width / 2, height * 0.46);

  // Prompt note
  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.font = `400 ${Math.max(11, Math.round(width * 0.02))}px sans-serif`;
  ctx.fillText(scene.lightingStyle || 'Cinematic Lighting Mode', width / 2, height * 0.54);
}

function applyAtmosphere(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  progress: number,
  width: number,
  height: number
) {
  // Vignette
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.3,
    width / 2,
    height / 2,
    width * 0.75
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

// Draws Visual Video Effects (Film grain, Cinematic bars, Vignette, Light leak, Atmospheric dust)
export function drawVisualEffects(
  ctx: CanvasRenderingContext2D,
  effects: VideoVisualEffects | undefined,
  width: number,
  height: number,
  time: number
) {
  if (!effects) return;

  // 1. Film Grain
  if (effects.filmGrain && effects.filmGrain > 0) {
    ctx.save();
    const grainAlpha = effects.filmGrain * 0.12;
    ctx.fillStyle = `rgba(255, 255, 255, ${grainAlpha})`;
    const grainStep = 6;
    const seed = Math.floor(time * 24) * 31;
    for (let x = 0; x < width; x += grainStep) {
      for (let y = 0; y < height; y += grainStep) {
        const rand = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
        if (rand - Math.floor(rand) > 0.6) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    ctx.restore();
  }

  // 2. Light Leak (warm golden bloom drifting across frame)
  if (effects.lightLeak) {
    ctx.save();
    const leakProgress = (time * 0.3) % (Math.PI * 2);
    const leakX = width * (0.15 + Math.sin(leakProgress) * 0.15);
    const leakY = height * (0.2 + Math.cos(leakProgress * 0.7) * 0.1);
    const leakRadius = Math.max(width, height) * 0.6;

    const leakGradient = ctx.createRadialGradient(
      leakX,
      leakY,
      10,
      leakX,
      leakY,
      leakRadius
    );
    const leakAlpha = 0.2 + Math.sin(leakProgress * 1.5) * 0.08;
    leakGradient.addColorStop(0, `rgba(255, 170, 70, ${leakAlpha})`);
    leakGradient.addColorStop(0.4, `rgba(255, 90, 40, ${leakAlpha * 0.5})`);
    leakGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = leakGradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 3. Atmospheric Dust Motes
  if (effects.atmosphericDust) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const numParticles = 28;
    for (let i = 0; i < numParticles; i++) {
      const pSeed = i * 47.19;
      const speedY = 12 + (i % 5) * 4;
      const pY = height - (((time * speedY + pSeed * 20) % (height + 50)) - 25);
      const pX = (Math.sin(time * 0.5 + pSeed) * 0.5 + 0.5) * width;
      const radius = 1.2 + (i % 3) * 1.0;
      const alpha = 0.25 + Math.sin(time + pSeed) * 0.15;

      ctx.fillStyle = `rgba(255, 235, 190, ${Math.max(0.05, alpha)})`;
      ctx.beginPath();
      ctx.arc(pX, pY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 4. RGB Glitch Pulse
  if (effects.rgbGlitch) {
    const glitchTrigger = Math.sin(time * 3.7) > 0.94;
    if (glitchTrigger) {
      ctx.save();
      ctx.globalCompositeOperation = 'color-dodge';
      ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
      ctx.fillRect(0, (time * 200) % height, width, 8);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.1)';
      ctx.fillRect(0, (time * 310) % height, width, 12);
      ctx.restore();
    }
  }

  // 5. Vignette (smooth corner shading)
  if (effects.vignette && effects.vignette > 0) {
    ctx.save();
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const grad = ctx.createRadialGradient(cx, cy, maxR * 0.45, cx, cy, maxR);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${effects.vignette * 0.75})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 6. Cinematic Bars (2.39:1 Widescreen Letterbox)
  if (effects.cinematicBars) {
    ctx.save();
    const barHeight = Math.round(height * 0.11);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, barHeight);
    ctx.fillRect(0, height - barHeight, width, barHeight);
    ctx.restore();
  }
}

// Draws Spoken Voiceover Text Overlay with animated word-by-word karaoke & effects
export function drawCaptions(
  ctx: CanvasRenderingContext2D,
  caption: CaptionItem | null,
  style: CaptionStyle,
  width: number,
  height: number,
  currentTime = 0
) {
  if (!caption || !caption.text.trim()) return;

  ctx.save();

  // Apply text case
  let rawText = caption.text.trim();
  if (style.textCase === 'uppercase') {
    rawText = rawText.toUpperCase();
  } else if (style.textCase === 'capitalize') {
    rawText = rawText.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const fontSize = Math.max(18, Math.round(width * 0.042 * (style.fontSize / 28)));
  const fontWeight = style.fontWeight === 'black' ? '900' : style.fontWeight === 'bold' ? '700' : '500';
  ctx.font = `${fontWeight} ${fontSize}px ${style.font || 'Plus Jakarta Sans, sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Position calculation
  let y = height * 0.82;
  if (style.position === 'top') y = height * 0.16;
  if (style.position === 'center') y = height * 0.5;

  const duration = Math.max(0.1, caption.endTime - caption.startTime);
  const captionProgress = Math.min(1, Math.max(0, (currentTime - caption.startTime) / duration));

  const anim = style.animationEffect || 'karaoke_pop';
  const highlightColor = style.highlightColor || '#fbbf24';

  // TYPEWRITER ANIMATION EFFECT
  if (anim === 'typewriter') {
    const charCount = Math.floor(captionProgress * rawText.length);
    const visibleText = rawText.slice(0, charCount) + (captionProgress < 0.95 ? '▌' : '');

    const metrics = ctx.measureText(visibleText);
    const boxWidth = metrics.width + fontSize * 1.2;
    const boxHeight = fontSize * 1.5;

    if (style.showBackground) {
      ctx.fillStyle = style.backgroundColor || 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect((width - boxWidth) / 2, y - boxHeight / 2, boxWidth, boxHeight, 8);
      ctx.fill();
    } else {
      ctx.strokeStyle = style.strokeColor || '#000000';
      ctx.lineWidth = fontSize * 0.18;
      ctx.lineJoin = 'round';
      ctx.strokeText(visibleText, width / 2, y);
    }

    ctx.fillStyle = style.color || '#ffffff';
    ctx.fillText(visibleText, width / 2, y);
    ctx.restore();
    return;
  }

  // NEON GLOW ANIMATION EFFECT
  if (anim === 'neon_glow') {
    const pulse = 0.8 + Math.sin(currentTime * 8) * 0.2;
    ctx.save();
    ctx.shadowColor = highlightColor;
    ctx.shadowBlur = 18 * pulse;
    ctx.fillStyle = highlightColor;
    ctx.fillText(rawText, width / 2, y);
    ctx.shadowBlur = 8 * pulse;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(rawText, width / 2, y);
    ctx.restore();
    ctx.restore();
    return;
  }

  // WORD-BY-WORD SPOKEN VOICE KARAOKE & KINETIC BOUNCE
  const words = rawText.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    ctx.restore();
    return;
  }

  const activeWordIdx = Math.min(
    words.length - 1,
    Math.floor(captionProgress * words.length)
  );

  // Measure word widths and spacing
  const spaceWidth = ctx.measureText(' ').width;
  const wordMeasurements = words.map((w) => ({
    text: w,
    width: ctx.measureText(w).width,
  }));

  const totalTextWidth =
    wordMeasurements.reduce((acc, m) => acc + m.width, 0) +
    (words.length - 1) * spaceWidth;

  // Background Box
  if (style.showBackground) {
    const boxPadX = fontSize * 0.8;
    const boxPadY = fontSize * 0.45;
    const boxWidth = totalTextWidth + boxPadX * 2;
    const boxHeight = fontSize * 1.55;

    ctx.fillStyle = style.backgroundColor || 'rgba(0, 0, 0, 0.78)';
    ctx.beginPath();
    ctx.roundRect((width - boxWidth) / 2, y - boxHeight / 2, boxWidth, boxHeight, 10);
    ctx.fill();
  }

  // Render each word with dynamic state (spoken, active, upcoming)
  let currentX = (width - totalTextWidth) / 2;

  words.forEach((word, idx) => {
    const wWidth = wordMeasurements[idx].width;
    const wordCenterX = currentX + wWidth / 2;
    const isPast = idx < activeWordIdx;
    const isActive = idx === activeWordIdx;
    const isFuture = idx > activeWordIdx;

    ctx.save();

    let wordY = y;
    let wordScale = 1.0;

    if (isActive) {
      if (anim === 'karaoke_pop' || anim === 'kinetic_bounce') {
        // High impact bounce on the active spoken word
        const wordTimeFrac = (captionProgress * words.length) % 1;
        const popBounce = Math.sin(wordTimeFrac * Math.PI);
        wordScale = 1.0 + popBounce * 0.2;
        wordY = y - popBounce * (fontSize * 0.2);
      }

      ctx.translate(wordCenterX, wordY);
      ctx.scale(wordScale, wordScale);
      ctx.translate(-wordCenterX, -wordY);

      // Glowing aura on active spoken word
      ctx.shadowColor = highlightColor;
      ctx.shadowBlur = 14;

      // Stroke outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = fontSize * 0.2;
      ctx.lineJoin = 'round';
      ctx.strokeText(word, wordCenterX, wordY);

      // Fill in vivid highlight color
      ctx.fillStyle = highlightColor;
      ctx.fillText(word, wordCenterX, wordY);
    } else {
      // Past or upcoming words
      if (isPast) {
        ctx.fillStyle = '#ffffff';
      } else {
        // Future words have slightly muted opacity
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      }

      // Stroke outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = fontSize * 0.16;
      ctx.lineJoin = 'round';
      ctx.strokeText(word, wordCenterX, wordY);

      ctx.fillText(word, wordCenterX, wordY);
    }

    ctx.restore();
    currentX += wWidth + spaceWidth;
  });

  ctx.restore();
}

// Renders transitions between two canvas buffers
export function blendTransition(
  targetCtx: CanvasRenderingContext2D,
  currentCanvas: HTMLCanvasElement,
  nextCanvas: HTMLCanvasElement,
  transition: TransitionType,
  progress: number, // 0.0 to 1.0
  width: number,
  height: number
) {
  targetCtx.clearRect(0, 0, width, height);

  switch (transition) {
    case 'cut': {
      targetCtx.drawImage(progress < 0.5 ? currentCanvas : nextCanvas, 0, 0);
      break;
    }
    case 'fade': {
      // Fade to black then fade in
      if (progress < 0.5) {
        const alpha = 1.0 - progress * 2;
        targetCtx.globalAlpha = Math.max(0, alpha);
        targetCtx.drawImage(currentCanvas, 0, 0);
      } else {
        const alpha = (progress - 0.5) * 2;
        targetCtx.globalAlpha = Math.min(1, alpha);
        targetCtx.drawImage(nextCanvas, 0, 0);
      }
      targetCtx.globalAlpha = 1.0;
      break;
    }
    case 'dissolve': {
      targetCtx.drawImage(currentCanvas, 0, 0);
      targetCtx.globalAlpha = progress;
      targetCtx.drawImage(nextCanvas, 0, 0);
      targetCtx.globalAlpha = 1.0;
      break;
    }
    case 'slide': {
      const offsetX = progress * width;
      targetCtx.drawImage(currentCanvas, -offsetX, 0);
      targetCtx.drawImage(nextCanvas, width - offsetX, 0);
      break;
    }
    case 'zoom': {
      const scaleOut = 1.0 + progress * 0.4;
      targetCtx.save();
      targetCtx.translate(width / 2, height / 2);
      targetCtx.scale(scaleOut, scaleOut);
      targetCtx.translate(-width / 2, -height / 2);
      targetCtx.drawImage(currentCanvas, 0, 0);
      targetCtx.restore();

      targetCtx.globalAlpha = progress;
      targetCtx.drawImage(nextCanvas, 0, 0);
      targetCtx.globalAlpha = 1.0;
      break;
    }
    case 'cinematic':
    default: {
      // Cross dissolve with light bloom flash
      targetCtx.drawImage(currentCanvas, 0, 0);
      targetCtx.globalAlpha = progress;
      targetCtx.drawImage(nextCanvas, 0, 0);

      // Light flash peak at progress = 0.5
      const flash = Math.sin(progress * Math.PI) * 0.35;
      if (flash > 0) {
        targetCtx.globalAlpha = flash;
        targetCtx.fillStyle = '#ffffff';
        targetCtx.fillRect(0, 0, width, height);
      }
      targetCtx.globalAlpha = 1.0;
      break;
    }
  }
}

// Exports the complete project to downloadable high-quality video (MP4/WebM)
export async function exportCompleteVideo(
  scenes: Scene[],
  captions: CaptionItem[],
  captionStyle: CaptionStyle,
  resolution: VideoResolution,
  aspectRatio: AspectRatio,
  quality: ExportQuality,
  audioBlobUrl?: string | null,
  effects?: VideoVisualEffects,
  onProgress?: (progress: number, statusText: string) => void
): Promise<Blob> {
  const dims = getResolutionDimensions(resolution, aspectRatio);
  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext('2d')!;

  // Preload all reference images
  onProgress?.(5, 'Preloading scene assets and reference frames...');
  const imageMap = new Map<string, HTMLImageElement>();
  for (const scene of scenes) {
    if (scene.referenceImage) {
      try {
        const img = await preloadImage(scene.referenceImage);
        imageMap.set(scene.id, img);
      } catch (err) {
        console.warn(`Could not preload image for scene ${scene.id}`, err);
      }
    }
  }

  const fps = 30;
  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const totalFrames = Math.ceil(totalDuration * fps);

  // Bitrate based on quality
  let bitrate = 8_000_000;
  if (quality === 'high') bitrate = 16_000_000;
  if (quality === 'maximum') bitrate = 28_000_000;

  // Setup MediaStream & Audio
  const stream = canvas.captureStream(fps);

  // Audio mix setup
  let audioContext: AudioContext | null = null;
  let audioSource: AudioBufferSourceNode | null = null;
  if (audioBlobUrl) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const resp = await fetch(audioBlobUrl);
      const arrayBuf = await resp.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuf);
      const dest = audioContext.createMediaStreamDestination();
      audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.connect(dest);
      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    } catch (audioErr) {
      console.warn('Audio export integration fallback:', audioErr);
    }
  }

  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: bitrate,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise(async (resolve, reject) => {
    recorder.onstop = () => {
      onProgress?.(100, 'Packaging high-quality video...');
      const outputBlob = new Blob(chunks, { type: mimeType });
      resolve(outputBlob);
    };

    recorder.onerror = (e) => reject(e);

    recorder.start();
    if (audioSource) audioSource.start();

    // Render loop frame by frame
    const frameIntervalMs = 1000 / fps;
    let currentFrame = 0;

    const renderNextFrame = () => {
      if (currentFrame >= totalFrames) {
        recorder.stop();
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
        return;
      }

      const currentTime = currentFrame / fps;

      // Find active scene
      let elapsed = 0;
      let activeSceneIndex = 0;
      for (let i = 0; i < scenes.length; i++) {
        if (currentTime < elapsed + scenes[i].duration || i === scenes.length - 1) {
          activeSceneIndex = i;
          break;
        }
        elapsed += scenes[i].duration;
      }

      const scene = scenes[activeSceneIndex];
      const sceneElapsed = currentTime - elapsed;
      const sceneProgress = Math.min(1, Math.max(0, sceneElapsed / scene.duration));

      const img = imageMap.get(scene.id) || null;
      drawSceneFrame(ctx, img, scene, sceneProgress, dims.width, dims.height);

      // Render visual video effects (grain, light leaks, vignette, etc)
      if (effects) {
        drawVisualEffects(ctx, effects, dims.width, dims.height, currentTime);
      }

      // Find active caption and render with animated spoken word effects
      const activeCaption =
        captions.find((c) => currentTime >= c.startTime && currentTime <= c.endTime) || null;
      drawCaptions(ctx, activeCaption, captionStyle, dims.width, dims.height, currentTime);

      currentFrame++;
      const percent = Math.round((currentFrame / totalFrames) * 90) + 5;
      if (currentFrame % 15 === 0) {
        onProgress?.(
          percent,
          `Rendering frame ${currentFrame}/${totalFrames} (Scene ${activeSceneIndex + 1}/${scenes.length})...`
        );
      }

      setTimeout(renderNextFrame, frameIntervalMs / 2); // faster-than-realtime render
    };

    renderNextFrame();
  });
}
