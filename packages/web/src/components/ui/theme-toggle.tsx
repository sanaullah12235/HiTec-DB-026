'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-nav)] bg-[var(--icon-badge-bg)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-[var(--border-card)]"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 text-amber-400 transition-all duration-300 dark:hidden" />
      <Moon className="hidden h-4 w-4 text-indigo-400 transition-all duration-300 dark:block" />
    </button>
  );
}
