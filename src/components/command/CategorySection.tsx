import type { Category, Command } from '../../types';
import { CommandCard } from './CommandCard';

interface Props {
  cat: Category;
  commands: Command[];
  expandedCards: Set<string>;
  onToggle: (id: string) => void;
}

export function CategorySection({ cat, commands, expandedCards, onToggle }: Props) {
  return (
    <section id={cat.id} className="category-section">
      <div className="section-header-row">
        <h2 className="section-heading">
          <span className="section-icon" aria-hidden="true">
            {cat.icon}
          </span>
          {cat.label}
        </h2>
        <span className="section-count">
          {commands.length} {commands.length === 1 ? 'command' : 'commands'}
        </span>
      </div>
      <div className="command-grid">
        {commands.map((cmd) => (
          <CommandCard
            key={cmd.id}
            cmd={cmd}
            isExpanded={expandedCards.has(cmd.id)}
            onToggle={() => onToggle(cmd.id)}
          />
        ))}
      </div>
    </section>
  );
}
