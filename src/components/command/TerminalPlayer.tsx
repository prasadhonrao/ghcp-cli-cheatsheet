import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  demo: string;
  commandTitle: string;
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
  commandTitle: string;
  fullscreen?: boolean;
  onOpenLightbox: (e: MouseEvent) => void;
  onError: () => void;
}

function GifBody({ imgError, playing, playKey, gifSrc, commandTitle, fullscreen = false, onOpenLightbox, onError }: GifBodyProps) {
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

export function TerminalPlayer({ demo, commandTitle }: Props) {
  const [imgError, setImgError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const gifSrc = `${import.meta.env.BASE_URL}${demo}`;

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  // Play always restarts the GIF from the beginning
  const handlePlay = (e: MouseEvent) => { e.stopPropagation(); setPlayKey(k => k + 1); setPlaying(true); };
  const handleStop = (e: MouseEvent) => { e.stopPropagation(); setPlaying(false); };
  const handleOpenLightbox = (e: MouseEvent) => { e.stopPropagation(); setLightboxOpen(true); };
  const handleCloseLightbox = (e: MouseEvent) => { e.stopPropagation(); setLightboxOpen(false); };
  const handleImgError = () => setImgError(true);

  const gifBodyProps = {
    imgError,
    playing,
    playKey,
    gifSrc,
    commandTitle,
    onOpenLightbox: handleOpenLightbox,
    onError: handleImgError,
  };

  return (
    <div className="terminal-section">
      <span className="command-section-label">
        <span className="card-section-icon">🎬</span> SEE IT IN ACTION
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
          <GifBody {...gifBodyProps} />
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
