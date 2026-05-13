import { useState } from 'react';
import { CopyIcon, CheckIcon } from '@primer/octicons-react';
import type { Command } from '../../types';
import { TerminalPlayer } from './TerminalPlayer';

interface Props {
  cmd: Command;
  isExpanded: boolean;
  onToggle: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      className={`copy-btn${copied ? ' copy-btn--copied' : ''}`}
      onClick={handleCopy}
      aria-label="Copy command"
      title="Copy"
    >
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
    </button>
  );
}

export function CommandCard({ cmd, isExpanded, onToggle }: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  }

  return (
    <div
      className={`command-card${isExpanded ? ' command-card--expanded' : ''}`}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`${cmd.title} — ${cmd.description}`}
    >
      <div className="command-card-header">
        <code className="command-syntax">{cmd.title}</code>
        <span className="command-card-toggle" aria-hidden="true">
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>
      {!isExpanded && <p className="command-description">{cmd.description}</p>}
      {isExpanded && (
        <div className="command-card-body">
          <div className="command-section">
            <span className="command-section-label">DESCRIPTION</span>
            <p className="command-inline-text command-section-description">{cmd.description}</p>
          </div>
          {cmd.analogy && (
            <div className="command-section">
              <span className="command-section-label">ANALOGY</span>
              <p className="command-inline-text command-section-analogy">{cmd.analogy}</p>
            </div>
          )}
          {cmd.syntax && (
            <div className="command-section">
              <span className="command-section-label">SYNTAX</span>
              <p className="command-inline-text command-inline-mono command-section-syntax">{cmd.syntax}</p>
            </div>
          )}
          {cmd.examples && cmd.examples.length > 0 && (
            <div className="command-section">
              <span className="command-section-label">EXAMPLES</span>
              <ul className="command-examples-list">
                {cmd.examples.map((ex, i) => {
                  const commentIdx = ex.indexOf('  #');
                  const cmdText = commentIdx !== -1 ? ex.slice(0, commentIdx) : ex;
                  if (commentIdx !== -1) {
                    return (
                      <li key={i} className="command-example-item">
                        <span className="command-example-cmd">{cmdText}</span>
                        <span className="command-example-comment">{ex.slice(commentIdx + 2)}</span>
                        <CopyButton text={cmdText} />
                      </li>
                    );
                  }
                  return (
                    <li key={i} className="command-example-item">
                      <span className="command-example-cmd">{ex}</span>
                      <CopyButton text={ex} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {cmd.note && (
            <div className="command-section">
              <span className="command-section-label">NOTE</span>
              <p className="command-inline-text command-section-note">{cmd.note}</p>
            </div>
          )}
          {cmd.terminalDemo && (
            <div className="command-section">
              <TerminalPlayer demo={cmd.terminalDemo} commandTitle={cmd.title} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
