import { useState, useEffect, useRef } from 'react';
import type { TerminalDemo } from '../../types';

interface Props {
  demo: TerminalDemo;
  commandTitle: string;
}

type State = 'idle' | 'running' | 'done';

export function TerminalPlayer({ demo, commandTitle }: Props) {
  const [state, setState] = useState<State>('idle');
  const [displayedPrompt, setDisplayedPrompt] = useState('');
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const cancelRef = useRef(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [displayedLines, displayedPrompt]);

  function reset() {
    cancelRef.current = true;
    setDisplayedPrompt('');
    setDisplayedLines([]);
    setState('idle');
  }

  async function play() {
    cancelRef.current = false;
    setState('running');
    setDisplayedPrompt('');
    setDisplayedLines([]);

    // Type the prompt
    for (let i = 0; i <= demo.prompt.length; i++) {
      if (cancelRef.current) return;
      setDisplayedPrompt(demo.prompt.slice(0, i));
      await sleep(38);
    }

    await sleep(450);

    // Stream output lines
    for (let li = 0; li < demo.output.length; li++) {
      if (cancelRef.current) return;
      const line = demo.output[li];
      if (line === '') {
        setDisplayedLines((prev) => [...prev, '']);
        await sleep(80);
      } else {
        let built = '';
        for (let ci = 0; ci <= line.length; ci++) {
          if (cancelRef.current) return;
          built = line.slice(0, ci);
          setDisplayedLines((prev) => {
            const next = [...prev];
            next[li] = built;
            return next;
          });
          await sleep(22);
        }
        await sleep(60);
      }
    }

    if (!cancelRef.current) setState('done');
  }

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    if (state === 'running') {
      reset();
    } else {
      play();
    }
  }

  function handleReplay(e: React.MouseEvent) {
    e.stopPropagation();
    reset();
    setTimeout(() => {
      cancelRef.current = false;
      play();
    }, 50);
  }

  return (
    <div className="terminal-section">
      <span className="command-section-label"><span className="card-section-icon">🎬</span> SEE IT IN ACTION</span>
      <div className="terminal-window">
        {/* Header bar */}
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot terminal-dot--red" />
            <span className="terminal-dot terminal-dot--yellow" />
            <span className="terminal-dot terminal-dot--green" />
          </div>
          <span className="terminal-title">{commandTitle}</span>
          <div className="terminal-controls">
            {state === 'done' ? (
              <button className="terminal-btn" onClick={handleReplay} aria-label="Replay demo">
                ↺ Replay
              </button>
            ) : (
              <button className="terminal-btn" onClick={handlePlay} aria-label={state === 'running' ? 'Stop demo' : 'Play demo'}>
                {state === 'running' ? '■ Stop' : '▶ Play'}
              </button>
            )}
          </div>
        </div>

        {/* Output area */}
        <div className="terminal-body" ref={outputRef}>
          {state === 'idle' ? (
            <span className="terminal-idle-hint">Click ▶ Play to see this command in action</span>
          ) : (
            <pre className="terminal-pre">
              <span className="terminal-prompt-line">
                <span className="terminal-prompt-char">❯ </span>
                <span className="terminal-prompt-text">{displayedPrompt.replace(/^\$\s*/, '')}</span>
                {state !== 'done' && displayedLines.length === 0 && (
                  <span className={`terminal-cursor${showCursor ? '' : ' terminal-cursor--hidden'}`}>█</span>
                )}
              </span>
              {displayedLines.map((line, i) => (
                <span key={i} className="terminal-output-line">
                  {line}
                  {state !== 'done' && i === displayedLines.length - 1 && (
                    <span className={`terminal-cursor${showCursor ? '' : ' terminal-cursor--hidden'}`}>█</span>
                  )}
                </span>
              ))}
              {state === 'done' && (
                <span className="terminal-prompt-line terminal-prompt-line--end">
                  <span className="terminal-prompt-char">❯ </span>
                  <span className={`terminal-cursor${showCursor ? '' : ' terminal-cursor--hidden'}`}>█</span>
                </span>
              )}
            </pre>
          )}
        </div>
      </div>
      <p className="terminal-disclaimer">
        <em>Demo output is illustrative. Your actual results will vary.</em>
      </p>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
