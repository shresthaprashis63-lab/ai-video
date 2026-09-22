import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { AspectRatio, ExportQuality, VideoFormat, VideoResolution } from '../../types/video';
import {
  X,
  Download,
  CheckCircle2,
  Film,
  Sparkles,
  Smartphone,
  Tv,
  Square,
  Clock,
  HardDrive,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { exportCompleteVideo } from '../../utils/videoRenderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { project, totalDuration } = useProject();

  const [resolution, setResolution] = useState<VideoResolution>(project.settings.resolution || '1080p');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.settings.aspectRatio || '9:16');
  const [quality, setQuality] = useState<ExportQuality>('high');
  const [format, setFormat] = useState<VideoFormat>('mp4');

  // Export progress states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState('');

  if (!isOpen) return null;

  // Estimated file size calculation
  // 1080p high bitrate ~ 16 Mbps -> ~2 MB/s
  const mbPerSec = quality === 'maximum' ? 3.5 : quality === 'high' ? 2.0 : 1.0;
  const estimatedMb = Math.round(totalDuration * mbPerSec);

  const handleStartExport = async () => {
    setIsExporting(true);
    setExportProgress(2);
    setExportStatusText('Initializing canvas compositor & audio mixers...');
    setDownloadUrl(null);

    try {
      const videoBlob = await exportCompleteVideo(
        project.scenes,
        project.captions,
        project.captionStyle,
        resolution,
        aspectRatio,
        quality,
        project.voiceoverTrack.url || project.musicTrack.url,
        project.settings.effects,
        (prog, text) => {
          setExportProgress(prog);
          setExportStatusText(text);
        }
      );

      const url = URL.createObjectURL(videoBlob);
      const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const filename = `${safeName}_${resolution}_${aspectRatio.replace(':', 'x')}.${format}`;

      setDownloadUrl(url);
      setDownloadFileName(filename);
      setExportStatusText('Render completed successfully!');
    } catch (err: any) {
      console.error('Export error:', err);
      setExportStatusText(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = downloadFileName || 'ai_studio_video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-200 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export Final Video</h3>
              <p className="text-[11px] text-slate-400">
                High-quality rendering with synchronized voice, audio, and transitions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Video Specs Card */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> Total Duration
              </div>
              <div className="font-mono text-xs font-semibold text-slate-200">
                {Math.floor(totalDuration / 60)}m {Math.floor(totalDuration % 60)}s
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <Film className="w-3 h-3 text-indigo-400" /> Scene Count
              </div>
              <div className="font-mono text-xs font-semibold text-slate-200">
                {project.scenes.length} Scenes
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-emerald-400" /> Approx. Size
              </div>
              <div className="font-mono text-xs font-semibold text-slate-200">
                ~{estimatedMb} MB
              </div>
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 text-xs">Aspect Ratio (Format)</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>9:16 Vertical</span>
                </div>
                <div className="text-[10px] text-slate-500">TikTok, Reels, Shorts</div>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Tv className="w-3.5 h-3.5 text-indigo-400" />
                  <span>16:9 Landscape</span>
                </div>
                <div className="text-[10px] text-slate-500">YouTube, Presentations</div>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  aspectRatio === '1:1'
                    ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Square className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1:1 Square</span>
                </div>
                <div className="text-[10px] text-slate-500">Instagram, Feed</div>
              </button>
            </div>
          </div>

          {/* Resolution & Quality Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Resolution */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 text-xs">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as VideoResolution)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="1080p">1080p Full HD (Recommended)</option>
                <option value="4k">4K Ultra HD (Studio Master)</option>
                <option value="720p">720p HD (Fast Render)</option>
              </select>
            </div>

            {/* Quality Preset */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 text-xs">Bitrate Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as ExportQuality)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="high">High (16 Mbps, Production)</option>
                <option value="maximum">Maximum (28 Mbps, Master)</option>
                <option value="standard">Standard (8 Mbps, Web)</option>
              </select>
            </div>
          </div>

          {/* Rendering Progress Section */}
          {(isExporting || exportProgress > 0) && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  {isExporting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{exportStatusText}</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold">{exportProgress}%</span>
              </div>

              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${exportProgress}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full transition-all duration-150"
                />
              </div>
            </div>
          )}

          {/* Download Complete Action Card */}
          {downloadUrl && (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Ready to Save
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{downloadFileName}</div>
              </div>

              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Video</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800"
          >
            Close
          </button>

          {!downloadUrl ? (
            <button
              id="btn-start-render"
              onClick={handleStartExport}
              disabled={isExporting}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                isExporting
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-500 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/25 active:scale-95'
              }`}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering Video Frames...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Rendering Video</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MP4 Video</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
