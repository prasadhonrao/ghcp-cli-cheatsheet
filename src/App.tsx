import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import commandsData from './data/commands.json';
import { CATEGORIES, type Command, type Theme } from './types';
import { TopBar } from './components/layout/TopBar';
import { SearchBar } from './components/search/SearchBar';
import { CategoryPills } from './components/ui/CategoryPills';
import { TipBanner } from './components/ui/TipBanner';
import { CategorySection } from './components/command/CategorySection';
import './App.css';

const COMMANDS: Command[] = commandsData as Command[];

function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.getAttribute('data-color-mode') as Theme) ?? 'dark',
  );
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const isClickScrolling = React.useRef(false);

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
    const onScroll = () => {
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
        keys: ['title', 'syntax', 'description', 'analogy', 'examples'],
        threshold: 0.35,
        includeScore: true,
      }),
    [],
  );

  const filteredCommands = useMemo<Command[]>(() => {
    if (!searchQuery.trim()) return COMMANDS;
    return fuse.search(searchQuery).map((r) => r.item);
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
        <SearchBar value={searchQuery} onChange={setSearchQuery} resultCount={filteredCommands.length} />
        <CategoryPills
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onSelect={handleCategorySelect}
          getStickyHeight={getStickyHeight}
        />
        <TipBanner />
      </div>
      <main className="main-layout">
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
    </div>
  );
}

export default App;
