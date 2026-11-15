import { useState, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  demo: string;
  video?: string;
  captions?: string;
  commandTitle: string;
}

const MUTED_KEY = 'ghcp-demo-muted';

function readMuted(): boolean {
  try { return localStorage.getItem(MUTED_KEY) === 'true'; } catch { return false; }
}

function saveMuted(muted: boolean) {
  try { localStorage.setItem(MUTED_KEY, String(muted)); } catch { /* storage unavailable */ }
}

interface ActionButtonProps {
  playing: boolean;
  onPlay: (e: MouseEvent) => void;
  onStop: (e: MouseEvent) => void;
}

function ActionButton({ playing, onPlay, onStop }: ActionButtonProps) {
  return playing
    ? <button className="terminal-action-btn" onClick={onStop}>■ Stop</button>
    : <button className="terminal-action-btn" onClick={onPlay}>▶ Play</button>;
}

interface GifBodyProps {
  imgError: boolean;
  playing: boolean;
  playKey: number;
  gifSrc: string;
  videoSrc?: string;
  captionsSrc?: string;
  suspended?: boolean;
  initialMuted: boolean;
  commandTitle: string;
  fullscreen?: boolean;
  onOpenLightbox: (e: MouseEvent) => void;
  onError: () => void;
  onVideoError: () => void;
  onVideoTime: (time: number) => void;
  onVideoReady: (video: HTMLVideoElement) => void;
  onMutedChange: (muted: boolean) => void;
}

function GifBody({
  imgError, playing, playKey, gifSrc, videoSrc, captionsSrc, suspended = false, initialMuted,
  commandTitle, fullscreen = false, onOpenLightbox, onError, onVideoError, onVideoTime, onVideoReady, onMutedChange,
}: GifBodyProps) {
  if (imgError) {
    return (
      <span className="terminal-play-hint">
        Recording not yet available — run <code>npm run generate:demos</code> to produce GIFs.
      </span>
    );
  }
  if (!playing) {
    return (
      <span className="terminal-play-hint">
        <strong>▶ Play</strong> to see this command in action
      </span>
    );
  }
  if (videoSrc) {
    // Only one video may play at a time, otherwise the narration would be doubled.
    if (suspended) {
      return <span className="terminal-play-hint">Playing in fullscreen…</span>;
    }
    return (
      <video
        key={playKey}
        className={fullscreen ? 'terminal-video-fullscreen' : 'terminal-video'}
        src={videoSrc}
        controls
        autoPlay
        playsInline
        preload="metadata"
        muted={initialMuted}
        aria-label={`${commandTitle} narrated terminal demo`}
        onLoadedMetadata={e => onVideoReady(e.currentTarget)}
        onTimeUpdate={e => onVideoTime(e.currentTarget.currentTime)}
        onVolumeChange={e => onMutedChange(e.currentTarget.muted)}
        onError={onVideoError}
      >
        {captionsSrc && <track kind="captions" src={captionsSrc} srcLang="en" label="English" />}
      </video>
    );
  }
  return (
    <img
      key={playKey}
      src={gifSrc}
      alt={`${commandTitle} terminal demo`}
      className={fullscreen ? 'terminal-gif-fullscreen' : 'terminal-gif'}
      loading="lazy"
      onClick={fullscreen ? undefined : onOpenLightbox}
      onError={onError}
    />
  );
}

export function TerminalPlayer({ demo, video, captions, commandTitle }: Props) {
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialMuted, setInitialMuted] = useState(readMuted);
  const videoTime = useRef(0);

  const base = import.meta.env.BASE_URL;
  const gifSrc = `${base}${demo}`;
  const videoSrc = video && !videoError ? `${base}${video}` : undefined;
  const captionsSrc = captions ? `${base}${captions}` : undefined;

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  // Play always restarts the demo from the beginning
  const handlePlay = (e: MouseEvent) => { e.stopPropagation(); videoTime.current = 0; setPlayKey(k => k + 1); setPlaying(true); };
  const handleStop = (e: MouseEvent) => { e.stopPropagation(); setPlaying(false); };
  const handleOpenLightbox = (e: MouseEvent) => { e.stopPropagation(); setLightboxOpen(true); };
  const handleCloseLightbox = (e: MouseEvent) => { e.stopPropagation(); setLightboxOpen(false); };
  const handleImgError = () => setImgError(true);
  const handleVideoError = () => setVideoError(true);
  const handleVideoTime = (time: number) => { videoTime.current = time; };
  // Continue from where the other player (inline / fullscreen) left off
  const handleVideoReady = (el: HTMLVideoElement) => { el.currentTime = videoTime.current; };
  const handleMutedChange = (muted: boolean) => { saveMuted(muted); setInitialMuted(muted); };

  const gifBodyProps = {
    imgError,
    playing,
    playKey,
    gifSrc,
    videoSrc,
    captionsSrc,
    initialMuted,
    commandTitle,
    onOpenLightbox: handleOpenLightbox,
    onError: handleImgError,
    onVideoError: handleVideoError,
    onVideoTime: handleVideoTime,
    onVideoReady: handleVideoReady,
    onMutedChange: handleMutedChange,
  };

  return (
    <div className="terminal-section">
      <span className="command-section-label">
        <span className="card-section-icon">🎬</span> SEE IT IN ACTION
        {videoSrc && <span className="terminal-audio-badge" title="Narrated demo with captions">🔊 Narrated</span>}
      </span>

      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot terminal-dot--red" />
            <span className="terminal-dot terminal-dot--yellow" />
            <span className="terminal-dot terminal-dot--green" />
          </div>
          <span className="terminal-title">{commandTitle}</span>
          <div className="terminal-header-actions">
            {!imgError && <ActionButton playing={playing} onPlay={handlePlay} onStop={handleStop} />}
            {!imgError && (
              <button className="terminal-action-btn" onClick={handleOpenLightbox} title="Maximize" aria-label="Maximize">⛶</button>
            )}
          </div>
        </div>
        <div className="terminal-body terminal-body--gif">
          <GifBody {...gifBodyProps} suspended={lightboxOpen} />
        </div>
      </div>

      <span className="terminal-disclaimer">Demo output is illustrative. Your actual results will vary.</span>

      {lightboxOpen && createPortal(
        <div
          className="terminal-gif-overlay"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${commandTitle} demo — fullscreen`}
        >
          <div className="terminal-gif-dialog" onClick={e => e.stopPropagation()}>
            <div className="terminal-gif-dialog-header">
              <div className="terminal-dots">
                <span className="terminal-dot terminal-dot--red" />
                <span className="terminal-dot terminal-dot--yellow" />
                <span className="terminal-dot terminal-dot--green" />
              </div>
              <span className="terminal-title">{commandTitle}</span>
              <div className="terminal-header-actions">
                {!imgError && <ActionButton playing={playing} onPlay={handlePlay} onStop={handleStop} />}
                <button className="terminal-action-btn" onClick={handleCloseLightbox} aria-label="Close">✕ Close</button>
              </div>
            </div>
            <div className="terminal-body terminal-body--gif">
              <GifBody {...gifBodyProps} fullscreen />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
