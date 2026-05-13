import type { Command } from '../../types';

interface Props {
  cmd: Command;
  isExpanded: boolean;
  onToggle: () => void;
}

export function CommandCard({ cmd, isExpanded, onToggle }: Props) {
  return (
    <div
      className={`command-card${isExpanded ? ' command-card--expanded' : ''}`}
      onClick={onToggle}
      role="button"
      aria-expanded={isExpanded}
    >
      <div className="command-card-header">
        <code className="command-syntax">{cmd.title}</code>
        <span className="command-card-toggle" aria-hidden="true">
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>
      <p className="command-description">{cmd.description}</p>
      {isExpanded && (
        <div className="command-card-body">
          {cmd.analogy && (
            <div className="command-section">
              <span className="command-section-label">ANALOGY</span>
              <p className="command-analogy-text">{cmd.analogy}</p>
            </div>
          )}
          {cmd.syntax && (
            <div className="command-section">
              <span className="command-section-label">SYNTAX</span>
              <p className="command-inline-text command-inline-mono">{cmd.syntax}</p>
            </div>
          )}
          {cmd.examples && cmd.examples.length > 0 && (
            <div className="command-section">
              <span className="command-section-label">EXAMPLES</span>
              <ul className="command-examples-list">
                {cmd.examples.map((ex, i) => {
                  const commentIdx = ex.indexOf('  #');
                  if (commentIdx !== -1) {
                    return (
                      <li key={i} className="command-example-item">
                        <span className="command-example-cmd">{ex.slice(0, commentIdx)}</span>
                        <span className="command-example-comment">{ex.slice(commentIdx + 2)}</span>
                      </li>
                    );
                  }
                  return (
                    <li key={i} className="command-example-item">
                      <span className="command-example-cmd">{ex}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {cmd.note && (
            <div className="command-section">
              <span className="command-section-label">NOTE</span>
              <p className="command-inline-text command-note-text">{cmd.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
