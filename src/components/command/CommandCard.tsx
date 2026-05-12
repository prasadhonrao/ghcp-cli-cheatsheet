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
        <>
          {cmd.analogy && (
            <div className="command-analogy">
              <span className="command-section-label">ANALOGY</span>
              <p className="command-analogy-text">{cmd.analogy}</p>
            </div>
          )}
          {cmd.note && (
            <div className="command-note">
              <span className="command-section-label">NOTE</span>
              <span>{cmd.note}</span>
            </div>
          )}
          {cmd.docUrl && (
            <div className="command-docs-link">
              <a href={cmd.docUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                Official docs ↗
              </a>
            </div>
          )}
          {cmd.examples && cmd.examples.length > 0 && (
            <div className="command-examples">
              <span className="command-section-label">EXAMPLE</span>
              <pre className="command-code-block">
                {cmd.examples.flatMap((ex, i) => [
                  ...ex.split('\n').map((line, j) => {
                    const isFullComment = line.trimStart().startsWith('#');
                    if (isFullComment) {
                      return (
                        <span key={`${i}-${j}`} className="code-line-comment">
                          {line + '\n'}
                        </span>
                      );
                    }
                    // Split inline trailing comment: "cmd arg  # explanation"
                    const commentIdx = line.indexOf('  #');
                    if (commentIdx !== -1) {
                      return (
                        <span key={`${i}-${j}`} className="code-line-command">
                          {line.slice(0, commentIdx)}
                          <span className="code-inline-comment">{line.slice(commentIdx) + '\n'}</span>
                        </span>
                      );
                    }
                    return (
                      <span key={`${i}-${j}`} className="code-line-command">
                        {line + '\n'}
                      </span>
                    );
                  }),
                  i < cmd.examples.length - 1 ? <span key={`sep-${i}`}>{'\n'}</span> : null,
                ])}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
