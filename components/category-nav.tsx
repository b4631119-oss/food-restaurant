"use client";

import type { ReactNode } from "react";

type CategoryNavProps = {
  categories: string[];
  active: string;
  searchActive: boolean;
  onSelect: (category: string) => void;
  children: ReactNode;
};

export function CategoryNav({ categories, active, searchActive, onSelect, children }: CategoryNavProps) {
  return (
    <>
      <aside className="hidden lg:block">
        <nav className="sticky top-[69px] flex flex-col gap-1" aria-label="Категории меню">
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => onSelect(category)} aria-current={active === category && !searchActive ? "true" : undefined} className={`press min-h-11 rounded-lg px-4 text-left text-sm font-semibold ${active === category && !searchActive ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface hover:text-text"}`}>
              {category}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <div className="category-strip relative -mx-4 mb-4 lg:hidden">
        <nav className="sticky top-[69px] z-30 border-y border-line bg-background/95 px-4 backdrop-blur" aria-label="Категории меню">
          <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line pr-8">
            {categories.map((category) => (
              <button key={category} type="button" onClick={() => onSelect(category)} aria-current={active === category && !searchActive ? "true" : undefined} className={`press min-h-11 shrink-0 border-b-2 px-0 text-sm font-semibold ${active === category && !searchActive ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"}`}>
                {category}
              </button>
            ))}
          </div>
        </nav>
        </div>
        {children}
      </div>
    </>
  );
}
