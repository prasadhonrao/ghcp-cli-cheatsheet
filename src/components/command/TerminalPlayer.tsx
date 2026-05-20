import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  demo: string;
  commandTitle: string;
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

  function ActionButton() {
    return playing
      ? <button className="terminal-action-btn" onClick={handleStop}>■ Stop</button>
      : <button className="terminal-action-btn" onClick={handlePlay}>▶ Play</button>;
  }

  function GifBody({ fullscreen = false }: { fullscreen?: boolean }) {
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
        onClick={fullscreen ? undefined : handleOpenLightbox}
        onError={() => setImgError(true)}
      />
    );
  }

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
            {!imgError && <ActionButton />}
            {!imgError && (
              <button className="terminal-action-btn" onClick={handleOpenLightbox} title="Maximize" aria-label="Maximize">⛶</button>
            )}
          </div>
        </div>
        <div className="terminal-body terminal-body--gif">
          <GifBody />
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
                {!imgError && <ActionButton />}
                <button className="terminal-action-btn" onClick={handleCloseLightbox} aria-label="Close">✕ Close</button>
              </div>
            </div>
            <div className="terminal-body terminal-body--gif">
              <GifBody fullscreen />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
