// Realtime speech synthesis, microphone voiceover recording, and audio generation engine

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female' | 'neutral';
  isDefault?: boolean;
}

class VoiceEngine {
  private currentSceneId: string | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private selectedVoiceName: string | null = null;
  private isSpeakingScene = false;
  private onSpeakingChangeCallbacks: Set<(isSpeaking: boolean) => void> = new Set();

  // MediaRecorder state for user mic recording
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Warm up voices
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }

  public subscribeSpeaking(cb: (isSpeaking: boolean) => void): () => void {
    this.onSpeakingChangeCallbacks.add(cb);
    return () => this.onSpeakingChangeCallbacks.delete(cb);
  }

  private setSpeaking(val: boolean) {
    this.isSpeakingScene = val;
    this.onSpeakingChangeCallbacks.forEach((cb) => cb(val));
  }

  // Retrieve list of available browser speech synthesis voices
  public getAvailableVoices(): VoiceOption[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [
        { id: 'ai-male', name: 'Neural Narrator (Male)', lang: 'en-US', gender: 'male', isDefault: true },
        { id: 'ai-female', name: 'Neural Narrator (Female)', lang: 'en-US', gender: 'female' },
      ];
    }

    const browserVoices = window.speechSynthesis.getVoices();
    if (browserVoices.length === 0) {
      return [
        { id: 'ai-male', name: 'Studio Narrator (Male)', lang: 'en-US', gender: 'male', isDefault: true },
        { id: 'ai-female', name: 'Studio Narrator (Female)', lang: 'en-US', gender: 'female' },
      ];
    }

    // Filter and prioritize English voices
    const englishVoices = browserVoices.filter((v) => v.lang.startsWith('en'));
    const voicesToUse = englishVoices.length > 0 ? englishVoices : browserVoices;

    return voicesToUse.map((v, idx) => {
      const lower = v.name.toLowerCase();
      let gender: 'male' | 'female' | 'neutral' = 'neutral';
      if (
        lower.includes('female') ||
        lower.includes('samantha') ||
        lower.includes('victoria') ||
        lower.includes('karen') ||
        lower.includes('zira') ||
        lower.includes('moira')
      ) {
        gender = 'female';
      } else if (
        lower.includes('male') ||
        lower.includes('david') ||
        lower.includes('daniel') ||
        lower.includes('alex') ||
        lower.includes('george') ||
        lower.includes('guy')
      ) {
        gender = 'male';
      }

      return {
        id: v.name,
        name: v.name.replace(/(Google|Microsoft|Apple)\s*/i, '').trim() || v.name,
        lang: v.lang,
        gender,
        isDefault: idx === 0,
      };
    });
  }

  public setSelectedVoice(voiceName: string) {
    this.selectedVoiceName = voiceName;
  }

  private findVoice(nameOrId?: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    if (nameOrId) {
      const matched = voices.find((v) => v.name === nameOrId || v.voiceURI === nameOrId);
      if (matched) return matched;
    }

    if (this.selectedVoiceName) {
      const matched = voices.find((v) => v.name === this.selectedVoiceName);
      if (matched) return matched;
    }

    // Best natural / high-quality English voice
    const natural = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Guy'))
    );
    if (natural) return natural;

    const anyEn = voices.find((v) => v.lang.startsWith('en'));
    return anyEn || voices[0] || null;
  }

  // Speaks active scene narrative text in sync with timeline playback
  public speakScene(
    sceneId: string,
    scriptText: string,
    options: {
      volume?: number;
      rate?: number;
      isMuted?: boolean;
      voiceId?: string;
    } = {}
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const { volume = 1.0, rate = 1.0, isMuted = false, voiceId } = options;

    if (isMuted || volume <= 0 || !scriptText.trim()) {
      this.stop();
      return;
    }

    // Avoid restarting utterance if already speaking this scene
    if (this.currentSceneId === sceneId && window.speechSynthesis.speaking) {
      return;
    }

    this.currentSceneId = sceneId;
    window.speechSynthesis.cancel();

    // Clean spoken text: remove markdown brackets, shot labels, etc.
    const cleanText = scriptText
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .trim();

    if (!cleanText) {
      this.setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voice = this.findVoice(voiceId);
    if (voice) utterance.voice = voice;

    utterance.volume = Math.max(0.1, Math.min(1.0, volume));
    utterance.rate = Math.max(0.7, Math.min(1.6, rate));
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.setSpeaking(true);
    };

    utterance.onend = () => {
      if (this.currentSceneId === sceneId) {
        this.setSpeaking(false);
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance notice:', e.error);
      this.setSpeaking(false);
    };

    this.currentUtterance = utterance;
    this.setSpeaking(true);

    try {
      window.speechSynthesis.speak(utterance);
      // Workaround for Chromium speech synthesis garbage-collection pause bug
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (err) {
      console.warn('Speech synthesis speak invocation failed:', err);
      this.setSpeaking(false);
    }
  }

  // Test voice output immediately so the user can verify their sound output works
  public testVoice(
    voiceId?: string,
    onComplete?: () => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve(false);
        return;
      }

      window.speechSynthesis.cancel();
      const testPhrase = 'Voiceover audio test. The studio sound is crystal clear and ready to narrate!';
      const utterance = new SpeechSynthesisUtterance(testPhrase);

      const voice = this.findVoice(voiceId);
      if (voice) utterance.voice = voice;

      utterance.volume = 1.0;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.setSpeaking(true);
      };

      utterance.onend = () => {
        this.setSpeaking(false);
        onComplete?.();
        resolve(true);
      };

      utterance.onerror = () => {
        this.setSpeaking(false);
        onComplete?.();
        resolve(false);
      };

      this.setSpeaking(true);
      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    });
  }

  // Stop any active speech synthesis immediately
  public stop() {
    this.currentSceneId = null;
    this.currentUtterance = null;
    this.setSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Starts recording user's microphone for voiceover
  public async startMicrophoneRecording(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser environment.');
    }

    this.stop(); // stop any playback speech
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaStream = stream;
    this.audioChunks = [];

    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined,
    });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder = recorder;
    recorder.start(100); // 100ms time slices
    return stream;
  }

  // Stops recording microphone and returns parsed audio duration, waveform, and data URL
  public stopMicrophoneRecording(): Promise<{
    duration: number;
    waveform: number[];
    dataUrl: string;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No microphone recording in progress.'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          // Release microphone hardware
          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
          }

          const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();

          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          let decoded: AudioBuffer;
          try {
            decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
          } catch {
            // Fallback: create empty buffer with estimated length
            decoded = audioCtx.createBuffer(1, 44100 * 5, 44100);
          }

          // Extract 120 waveform peaks
          const channel = decoded.getChannelData(0);
          const numPeaks = 120;
          const blockSize = Math.max(1, Math.floor(channel.length / numPeaks));
          const peaks: number[] = [];
          for (let i = 0; i < numPeaks; i++) {
            let sum = 0;
            const start = i * blockSize;
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(channel[start + j] || 0);
            }
            peaks.push(Math.min(1, (sum / blockSize) * 4));
          }

          const dataUrl = URL.createObjectURL(blob);
          this.mediaRecorder = null;
          this.audioChunks = [];

          resolve({
            duration: decoded.duration || 5.0,
            waveform: peaks,
            dataUrl,
          });
        } catch (err) {
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  // Generates a synthesized audio track from script using Web Audio API synthesis
  // Creates an actual playable audio file URL and waveform so the timeline displays real audio bars
  public generateSynthesizedAudioTrack(
    script: string,
    totalSeconds: number
  ): Promise<{ dataUrl: string; duration: number; waveform: number[] }> {
    return new Promise((resolve) => {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = 22050; // speech quality
      const duration = Math.max(10, Math.round(totalSeconds));
      const totalSamples = sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
      const data = buffer.getChannelData(0);

      // Extract words and generate speech-cadence modulated audio
      const words = script.trim().split(/\s+/).filter(Boolean);
      const wordsPerSecond = words.length > 0 ? words.length / duration : 2.5;

      let sampleIdx = 0;
      for (let s = 0; s < duration; s += 0.5) {
        // Words cadence: speech burst followed by brief syllable pause
        const isPause = Math.sin(s * Math.PI * wordsPerSecond) < -0.3;
        const baseFreq = 125 + Math.sin(s * 1.5) * 20; // Human vocal fundamental pitch ~125Hz

        for (let i = 0; i < sampleRate * 0.5 && sampleIdx < totalSamples; i++) {
          const t = i / sampleRate;
          if (isPause) {
            data[sampleIdx++] = 0.005 * (Math.random() * 2 - 1); // background room presence
          } else {
            // Formant synthesis approximation (F0: fundamental, F1: 700Hz, F2: 1200Hz, F3: 2500Hz)
            const f0 = Math.sin(2 * Math.PI * baseFreq * t);
            const f1 = 0.4 * Math.sin(2 * Math.PI * 720 * t);
            const f2 = 0.25 * Math.sin(2 * Math.PI * 1250 * t);
            const breath = 0.08 * (Math.random() * 2 - 1);
            const env = Math.sin(Math.PI * (i / (sampleRate * 0.5))); // soft syllable envelope
            data[sampleIdx++] = (f0 + f1 + f2 + breath) * env * 0.35;
          }
        }
      }

      // Convert audio buffer to WAV file Blob
      const wavBlob = audioBufferToWav(buffer);
      const dataUrl = URL.createObjectURL(wavBlob);

      // Extract waveform peaks
      const numPeaks = 120;
      const blockSize = Math.floor(totalSamples / numPeaks);
      const peaks: number[] = [];
      for (let i = 0; i < numPeaks; i++) {
        let sum = 0;
        const start = i * blockSize;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(data[start + j] || 0);
        }
        peaks.push(Math.min(1, (sum / blockSize) * 5));
      }

      resolve({
        dataUrl,
        duration,
        waveform: peaks,
      });
    });
  }
}

// Convert AudioBuffer to standard WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const channelData = buffer.getChannelData(0);
  const dataLength = channelData.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Write WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export const voiceEngine = new VoiceEngine();
