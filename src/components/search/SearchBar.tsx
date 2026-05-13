import { forwardRef } from 'react';

interface Props {
  value: string;
  onChange: (query: string) => void;
  resultCount: number;
}

export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { value, onChange, resultCount },
  ref,
) {
  return (
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
          ref={ref}
          className="search-bar-input"
          type="search"
          placeholder="Search commands, shortcuts, or topics… (Press / to focus)"
          aria-label="Search commands. Press / to focus, Escape to clear."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="search-count" aria-hidden="true">
          {resultCount} {resultCount === 1 ? 'command' : 'commands'}
        </span>
        {value && (
          <button className="search-clear-btn" aria-label="Clear search" onClick={() => onChange('')}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});
