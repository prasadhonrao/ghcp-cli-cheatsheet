import { useState } from 'react';
import { CopyIcon, CheckIcon, IssueOpenedIcon, LightBulbIcon } from '@primer/octicons-react';
import type { Command } from '../../types';
import { TerminalPlayer } from './TerminalPlayer';

interface Props {
  cmd: Command;
  isExpanded: boolean;
  onToggle: () => void;
}

const REPO_URL = 'https://github.com/prasadhonrao/ghcp-cli-cheatsheet';

type FeedbackKind = 'issue' | 'suggestion';

function buildFeedbackUrl(cmd: Command, kind: FeedbackKind): string {
  const context = [
    `**Command:** \`${cmd.title}\``,
    `**Syntax:** \`${cmd.syntax}\``,
    `**Category:** ${cmd.category}`,
    `**Entry:** \`${cmd.id}\` in \`src/data/categories/${cmd.category}.json\``,
  ].join('\n');

  const body = kind === 'issue'
    ? `${context}\n**Copilot CLI version:** <!-- output of \`copilot --version\` -->\n\n### What is wrong or missing?\n<!-- e.g. outdated syntax, incorrect description, broken example or demo -->\n\n### What did you expect?\n`
    : `${context}\n\n### What would make this entry better?\n<!-- e.g. a clearer analogy, more examples, a demo video -->\n`;

  const params = new URLSearchParams({
    title: kind === 'issue' ? `[${cmd.title}] ` : `[${cmd.title}] Suggestion: `,
    body,
    labels: kind === 'issue' ? 'documentation' : 'enhancement',
  });
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

// Links sit inside a clickable card, so stop clicks and Enter/Space from toggling it.
function FeedbackLink({ cmd, kind }: { cmd: Command; kind: FeedbackKind }) {
  const isIssue = kind === 'issue';
  return (
    <a
      className="feedback-link"
      href={buildFeedbackUrl(cmd, kind)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      aria-label={`${isIssue ? 'Report an issue with' : 'Suggest an edit for'} ${cmd.title} (opens GitHub in a new tab)`}
    >
      {isIssue ? <IssueOpenedIcon size={14} /> : <LightBulbIcon size={14} />}
      {isIssue ? 'Report an issue' : 'Suggest an edit'}
    </a>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // clipboard write failed (e.g. non-secure context or permission denied)
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
              <TerminalPlayer
                demo={cmd.terminalDemo}
                video={cmd.terminalVideo}
                captions={cmd.terminalCaptions}
                commandTitle={cmd.title}
              />
            </div>
          )}
          <div className="command-section command-feedback">
            <span className="command-feedback-prompt">Feedback:</span>
            <FeedbackLink cmd={cmd} kind="issue" />
            <FeedbackLink cmd={cmd} kind="suggestion" />
          </div>
        </div>
      )}
    </div>
  );
}
