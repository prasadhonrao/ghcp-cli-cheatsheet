import type { Category } from '../../types';

interface Props {
  categories: Category[];
  activeCategory: string;
  onSelect: (id: string) => void;
  getStickyHeight: () => number;
}

export function CategoryPills({ categories, activeCategory, onSelect, getStickyHeight }: Props) {
  return (
    <nav className="category-bar" aria-label="Categories">
      {categories.map((cat) => (
        <a
          key={cat.id}
          href={`#${cat.id}`}
          className={`cat-pill${activeCategory === cat.id ? ' cat-pill--active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSelect(cat.id);
            const target = document.getElementById(cat.id);
            if (target) {
              const y = target.getBoundingClientRect().top + window.scrollY - getStickyHeight() - 16;
              window.scrollTo({ top: y, behavior: 'smooth' });
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
  );
}
