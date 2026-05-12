import React, { useState, useEffect, useMemo } from 'react';
import { CopilotIcon, SunIcon, MoonIcon, MarkGithubIcon } from '@primer/octicons-react';
import './App.css';

type Theme = 'dark' | 'light';

interface Command {
  title: string;
  description: string;
  category: string;
}

// Placeholder — will be loaded from JSON in the future
const COMMANDS: Command[] = [];

const CATEGORIES = [
  { label: 'Installation', id: 'installation', icon: '📦' },
  { label: 'Authentication', id: 'authentication', icon: '🔐' },
  { label: 'Modes', id: 'modes', icon: '🎛️' },
  { label: 'Shortcuts', id: 'shortcuts', icon: '⚡' },
  { label: 'Flags', id: 'flags', icon: '🚩' },
  { label: 'Slash Commands', id: 'slash-commands', icon: '⌨️' },
  { label: 'Prefixes', id: 'prefixes', icon: '🔤' },
  { label: 'Agents', id: 'agents', icon: '🤖' },
  { label: 'MCP', id: 'mcp', icon: '🔌' },
  { label: 'Plugins', id: 'plugins', icon: '🧩' },
  { label: 'Instructions', id: 'instructions', icon: '📝' },
  { label: 'Recipes', id: 'recipes', icon: '📖' },
  { label: 'Tips', id: 'tips', icon: '💡' },
  { label: 'Troubleshooting', id: 'troubleshooting', icon: '🔧' },
  { label: 'Resources', id: 'resources', icon: '📚' },
];

function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.getAttribute('data-color-mode') as Theme) ?? 'dark',
  );
  const [activeCategory, setActiveCategory] = useState('installation');
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const isClickScrolling = React.useRef(false);

  /** Return the current pixel height of the sticky header block */
  const getStickyHeight = () => stickyRef.current?.offsetHeight ?? 0;

  useEffect(() => {
    document.documentElement.setAttribute('data-color-mode', theme);
    localStorage.setItem('ghcp-theme', theme);
  }, [theme]);

  // Reset active to first category when scrolled back to top
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY < 80) setActiveCategory('installation');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight pill matching the section currently in view
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
    // Defer observer start so it doesn't fire on mount before layout settles
    const timerId = setTimeout(() => {
      const headerH = getStickyHeight();
      const observer = new IntersectionObserver(
        (entries) => {
          if (isClickScrolling.current) return;
          const visibleSet = new Set<string>();
          entries.forEach((e) => {
            if (e.isIntersecting) visibleSet.add(e.target.id);
          });
          for (const s of sections) {
            if (visibleSet.has(s.id)) {
              setActiveCategory(s.id);
              break;
            }
          }
        },
        { rootMargin: `-${headerH + 16}px 0px -40% 0px`, threshold: 0 },
      );
      sections.forEach((s) => observer.observe(s));
      // Store cleanup
      (timerId as unknown as { obs?: IntersectionObserver }).obs = observer;
    }, 100);

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const totalCommands = COMMANDS.length;
  const commandsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      map[cat.id] = COMMANDS.filter((c) => c.category === cat.id).length;
    }
    return map;
  }, []);

  return (
    <div className="app-shell">
      <div className="sticky-header" ref={stickyRef}>
        <header className="topbar">
          <div className="topbar-brand">
            <CopilotIcon size={24} />
            <div className="topbar-brand-text">
              <span className="topbar-title">GHCP CLI Cheatsheet</span>
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
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
          </div>
        </header>
        {/* Search — inside sticky header, below topbar */}
        <div className="search-wrapper">
          <div className="search-bar">
            <span className="search-bar-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <defs>
                  <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d2a8ff" />
                    <stop offset="100%" stopColor="#58a6ff" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#sg)"
                  d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749
                    0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499
                    4.499 0 0 0 11.5 7Z"
                />
              </svg>
            </span>
            <input
              className="search-bar-input"
              type="search"
              placeholder="Search commands, shortcuts, or topics…"
              aria-label="Search"
              readOnly
            />
            <span className="search-count" aria-hidden="true">
              {totalCommands} commands
            </span>
          </div>
        </div>

        {/* Category pills — sticky, below search */}
        <nav className="category-bar" aria-label="Categories">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className={`cat-pill${activeCategory === cat.id ? ' cat-pill--active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveCategory(cat.id);
                const target = document.getElementById(cat.id);
                if (target) {
                  const y = target.getBoundingClientRect().top + window.scrollY - getStickyHeight() - 16;
                  isClickScrolling.current = true;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                  setTimeout(() => {
                    isClickScrolling.current = false;
                  }, 800);
                }
              }}
            >
              <span className="cat-pill-icon" aria-hidden="true">
                {cat.icon}
              </span>
              {cat.label}
            </a>
          ))}
        </nav>

        {/* Tip */}
        <div className="tip-banner">
          <span className="tip-icon" aria-hidden="true">
            💡
          </span>
          <span>Tip: Click any command card to expand the full explanation and usage example.</span>
        </div>
      </div>
      <main className="main-layout">
        {/* Category sections */}
        {CATEGORIES.map((cat) => (
          <section key={cat.id} id={cat.id} className="category-section">
            <div className="section-header-row">
              <h2 className="section-heading">
                <span className="section-icon" aria-hidden="true">
                  {cat.icon}
                </span>
                {cat.label}
              </h2>
              <span className="section-count">{commandsByCategory[cat.id] || 0} commands</span>
            </div>
            <p className="placeholder-text">Commands coming soon.</p>
          </section>
        ))}
      </main>
    </div>
  );
}

export default App;
