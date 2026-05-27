import { useState, useEffect, useMemo, useRef } from 'react';
import Fuse, { type FuseResult } from 'fuse.js';
import { EyeIcon, PeopleIcon } from '@primer/octicons-react';
import commandsData from './data/index';
import { CATEGORIES, type Command, type Theme } from './types';
import { TopBar } from './components/layout/TopBar';
import { SearchBar } from './components/search/SearchBar';
import { CategoryPills } from './components/ui/CategoryPills';
import { TipBanner } from './components/ui/TipBanner';
import { CategorySection } from './components/command/CategorySection';
import './App.css';

const COMMANDS: Command[] = commandsData;

const normalizeSearchText = (value: string) => value.trim().toLowerCase();

const stripLeadingSlash = (value: string) => value.replace(/^\/+/, '');

const COMMAND_ALIAS_PATTERN = /\/[a-z0-9][a-z0-9-]*/gi;

const getSearchVariants = (value: string) => {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];

  const withoutSlash = stripLeadingSlash(normalized);
  const variants = new Set<string>([normalized, withoutSlash]);

  if (withoutSlash) {
    variants.add(`/${withoutSlash}`);
  }

  return Array.from(variants).filter(Boolean);
};

const normalizeCommandValue = (value: string) => stripLeadingSlash(normalizeSearchText(value));

const extractCommandAliases = (command: Command) => {
  const aliasSet = new Set<string>();

  const addMatches = (value?: string) => {
    if (!value) return;

    const matches = value.match(COMMAND_ALIAS_PATTERN) ?? [];
    for (const match of matches) {
      aliasSet.add(normalizeCommandValue(match));
    }
  };

  addMatches(command.title);
  addMatches(command.syntax);
  addMatches(command.note);
  command.examples.forEach(addMatches);

  return Array.from(aliasSet).filter(Boolean);
};

const getCommandMatchPriority = (command: Command, rawQuery: string) => {
  const query = normalizeCommandValue(rawQuery);
  if (!query) return Number.MAX_SAFE_INTEGER;

  const title = normalizeCommandValue(command.title);
  const syntax = normalizeCommandValue(command.syntax);
  const aliases = extractCommandAliases(command);

  if (aliases.some((alias) => alias === query)) return 0;
  if (aliases.some((alias) => alias.startsWith(query))) return 1;
  if (aliases.some((alias) => alias.includes(query))) return 2;

  if (title === query) return 0;
  if (title.startsWith(query)) return 1;
  if (title.includes(query)) return 2;
  if (syntax === query) return 3;
  if (syntax.startsWith(query)) return 4;
  if (syntax.includes(query)) return 5;

  return 6;
};

interface TrafficStats {
  totalViews: number;
  totalUniques: number;
  updatedAt: string;
}

function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.getAttribute('data-color-mode') as Theme) ?? 'dark',
  );
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [trafficStats, setTrafficStats] = useState<TrafficStats | null>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isClickScrolling = useRef(false);

  const getStickyHeight = () => stickyRef.current?.offsetHeight ?? 0;

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    document.documentElement.setAttribute('data-color-mode', theme);
    localStorage.setItem('ghcp-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetch('/ghcp-cli-cheatsheet/traffic.json')
      .then((res) => {
        if (!res.ok) return undefined;
        return res.json() as Promise<TrafficStats>;
      })
      .then((data) => {
        if (data && typeof data.totalViews === 'number' && typeof data.totalUniques === 'number') {
          setTrafficStats(data);
        }
      })
      .catch(() => {
        // Stats are optional — silently ignore any fetch/parse error
      });
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;

      if (e.key === '/' && !isEditable) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (isClickScrolling.current) return;
      if (window.scrollY < 80) setActiveCategory('getting-started');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
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
    }, 100);
    return () => clearTimeout(timerId);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(COMMANDS, {
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'syntax', weight: 0.25 },
          { name: 'description', weight: 0.12 },
          { name: 'examples', weight: 0.08 },
          { name: 'analogy', weight: 0.03 },
          { name: 'note', weight: 0.02 },
        ],
        threshold: 0.35,
        includeScore: true,
      }),
    [],
  );

  const filteredCommands = useMemo<Command[]>(() => {
    if (!searchQuery.trim()) return COMMANDS;

    const resultsById = new Map<string, FuseResult<Command>>();

    for (const queryVariant of getSearchVariants(searchQuery)) {
      for (const result of fuse.search(queryVariant)) {
        const existing = resultsById.get(result.item.id);
        if (!existing || (result.score ?? Number.MAX_SAFE_INTEGER) < (existing.score ?? Number.MAX_SAFE_INTEGER)) {
          resultsById.set(result.item.id, result);
        }
      }
    }

    const rankedResults = Array.from(resultsById.values()).sort((a, b) => {
      const priorityDiff = getCommandMatchPriority(a.item, searchQuery) - getCommandMatchPriority(b.item, searchQuery);
      if (priorityDiff !== 0) return priorityDiff;

      const scoreA = a.score ?? Number.MAX_SAFE_INTEGER;
      const scoreB = b.score ?? Number.MAX_SAFE_INTEGER;
      if (scoreA !== scoreB) return scoreA - scoreB;

      return a.item.title.localeCompare(b.item.title);
    });

    const strongCommandMatches = rankedResults.filter(
      (result) => getCommandMatchPriority(result.item, searchQuery) < 6,
    );
    const visibleResults = strongCommandMatches.length > 0 ? strongCommandMatches : rankedResults;

    return visibleResults.map((r) => r.item);
  }, [searchQuery, fuse]);

  const commandsByCategory = useMemo(() => {
    const map: Record<string, Command[]> = {};
    for (const cat of CATEGORIES) {
      map[cat.id] = filteredCommands.filter((c) => c.category === cat.id);
    }
    return map;
  }, [filteredCommands]);

  const visibleCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    return CATEGORIES.filter((cat) => (commandsByCategory[cat.id]?.length ?? 0) > 0);
  }, [searchQuery, commandsByCategory]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setActiveCategory('getting-started');
    } else if (visibleCategories.length > 0) {
      setActiveCategory(visibleCategories[0].id);
    }
  }, [searchQuery, visibleCategories]);

  const handleCategorySelect = (id: string) => {
    setActiveCategory(id);
    isClickScrolling.current = true;
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  return (
    <div className="app-shell">
      <div className="sticky-header" ref={stickyRef}>
        <TopBar theme={theme} onToggleTheme={toggleTheme} />
      </div>
      <main className="main-layout">
        <div className="search-controls">
          <SearchBar
            ref={searchInputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={filteredCommands.length}
          />
          <CategoryPills
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelect={handleCategorySelect}
            getStickyHeight={getStickyHeight}
          />
          <TipBanner />
        </div>
        {searchQuery.trim() && visibleCategories.length === 0 && (
          <p className="no-results">
            No commands match "<strong>{searchQuery}</strong>"
          </p>
        )}
        {visibleCategories.map((cat) => (
          <CategorySection
            key={cat.id}
            cat={cat}
            commands={commandsByCategory[cat.id] ?? []}
            expandedCards={expandedCards}
            onToggle={toggleCard}
          />
        ))}
      </main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-left">
            {trafficStats && trafficStats.totalViews > 0 && (
              <span className="site-footer-stats">
                <span className="site-footer-stat">
                  <EyeIcon size={12} />
                  {trafficStats.totalViews.toLocaleString()} views
                </span>
                <span className="site-footer-divider" aria-hidden="true">
                  ·
                </span>
                <span className="site-footer-stat">
                  <PeopleIcon size={12} />
                  {trafficStats.totalUniques.toLocaleString()} unique visitors
                </span>
              </span>
            )}
          </div>
          <div className="site-footer-center">
            <a
              href="https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference"
              target="_blank"
              rel="noopener noreferrer"
            >
              Official GitHub Copilot CLI Docs
            </a>
          </div>
          <div className="site-footer-right" aria-hidden="true" />
        </div>
      </footer>
    </div>
  );
}

export default App;
