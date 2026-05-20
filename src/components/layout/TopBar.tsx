import { CopilotIcon, SunIcon, MoonIcon, MarkGithubIcon } from '@primer/octicons-react';
import type { Theme } from '../../types';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
}

export function TopBar({ theme, onToggleTheme }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <CopilotIcon size={24} />
        <div className="topbar-brand-text">
          <span className="topbar-title">GitHub Copilot CLI Cheatsheet</span>
          <span className="topbar-tagline">Your quick reference for GitHub Copilot CLI commands</span>
        </div>
      </div>
      <div className="topbar-actions">
        <a
          className="gh-link"
          href="https://github.com/prasadhonrao/ghcp-cli-cheatsheet"
          target="_blank"
          rel="noreferrer"
          aria-label="View source on GitHub"
        >
          <MarkGithubIcon size={20} />
        </a>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>
      </div>
    </header>
  );
}
