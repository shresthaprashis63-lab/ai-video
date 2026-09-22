import { CaptionItem, Scene } from '../types/video';

// Extracts waveform peaks from an AudioBuffer for timeline visualization
export function extractWaveformPeaks(buffer: AudioBuffer, numPeaks = 120): number[] {
  const channelData = buffer.getChannelData(0);
  const totalSamples = channelData.length;
  const blockSize = Math.floor(totalSamples / numPeaks);
  const peaks: number[] = [];

  for (let i = 0; i < numPeaks; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j] || 0);
    }
    const avg = sum / blockSize;
    peaks.push(Math.min(1, avg * 3.5)); // slight gain for visual clarity
  }

  return peaks;
}

// Parses uploaded audio file (MP3, WAV, M4A) and returns duration, waveform, and data URL
export async function parseAudioFile(
  file: File
): Promise<{ duration: number; waveform: number[]; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        const peaks = extractWaveformPeaks(decoded, 120);

        // create persistent dataUrl for playback
        const blob = new Blob([arrayBuffer], { type: file.type || 'audio/mp3' });
        const dataUrl = URL.createObjectURL(blob);

        resolve({
          duration: decoded.duration,
          waveform: peaks,
          dataUrl,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Intelligently synchronizes scene durations with voiceover track
export function synchronizeScenesWithVoiceover(
  scenes: Scene[],
  voiceoverDuration: number
): Scene[] {
  if (scenes.length === 0 || voiceoverDuration <= 0) return scenes;

  // Calculate proportional weight based on word count of each scene's script text
  const sceneWordCounts = scenes.map((s) => {
    const count = s.scriptText.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(count, 3); // minimum weight
  });

  const totalWords = sceneWordCounts.reduce((acc, c) => acc + c, 0);

  let allocated = 0;
  const synchronized = scenes.map((scene, idx) => {
    const weight = sceneWordCounts[idx] / totalWords;
    let dur = Math.round(weight * voiceoverDuration * 10) / 10;
    // ensure at least 2.5s minimum per scene
    dur = Math.max(dur, 2.5);
    allocated += dur;
    return {
      ...scene,
      duration: dur,
    };
  });

  // Adjust difference on the last scene
  const diff = Math.round((voiceoverDuration - allocated) * 10) / 10;
  if (synchronized.length > 0 && Math.abs(diff) > 0.2) {
    const last = synchronized[synchronized.length - 1];
    last.duration = Math.max(2.5, Math.round((last.duration + diff) * 10) / 10);
  }

  return synchronized;
}

// Generates captions synchronized with scene durations and scripts
export function generateCaptionsFromScenes(scenes: Scene[]): CaptionItem[] {
  const captions: CaptionItem[] = [];
  let currentTime = 0;

  scenes.forEach((scene, index) => {
    const text = scene.scriptText.trim();
    if (!text) {
      currentTime += scene.duration;
      return;
    }

    // Break longer sentences into short readable subtitle chunks (~6-8 words max)
    const words = text.split(/\s+/);
    if (words.length <= 8) {
      captions.push({
        id: `cap-${scene.id}-${index}`,
        sceneId: scene.id,
        text: text,
        startTime: Math.round(currentTime * 10) / 10,
        endTime: Math.round((currentTime + scene.duration) * 10) / 10,
      });
    } else {
      const chunkSize = 7;
      const totalChunks = Math.ceil(words.length / chunkSize);
      const chunkDuration = scene.duration / totalChunks;

      for (let c = 0; c < totalChunks; c++) {
        const chunkWords = words.slice(c * chunkSize, (c + 1) * chunkSize).join(' ');
        const start = currentTime + c * chunkDuration;
        const end = start + chunkDuration;

        captions.push({
          id: `cap-${scene.id}-${index}-${c}`,
          sceneId: scene.id,
          text: chunkWords,
          startTime: Math.round(start * 10) / 10,
          endTime: Math.round(end * 10) / 10,
        });
      }
    }

    currentTime += scene.duration;
  });

  return captions;
}

// Synthesizes voiceover from script using Web Speech API (fallback or preview)
export function synthesizeSpeech(
  text: string,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve('');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      onProgress?.(100);
      resolve('speech-synthesized');
    };

    utterance.onerror = () => {
      resolve('');
    };

    window.speechSynthesis.speak(utterance);
  });
}
