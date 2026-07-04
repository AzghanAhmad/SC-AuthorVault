import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<'light' | 'dark' | 'auto'>('light');
  readonly theme = this._theme.asReadonly();

  constructor() {
    const stored = localStorage.getItem('av_theme') as 'light' | 'dark' | 'auto' | null;
    if (stored) {
      this.setTheme(stored);
    }
  }

  setTheme(t: 'light' | 'dark' | 'auto'): void {
    this._theme.set(t);
    localStorage.setItem('av_theme', t);
    this.applyTheme(t);
  }

  toggleTheme(): void {
    const current = this._theme();
    const next = current === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  private applyTheme(t: 'light' | 'dark' | 'auto'): void {
    const doc = document.documentElement;
    if (t === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      doc.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      doc.setAttribute('data-theme', t);
    }
  }

  applyThemeFromSettings(theme: string, compact: boolean): void {
    this.setTheme(theme as 'light' | 'dark' | 'auto');
    this.setCompactSidebar(compact);
  }

  setCompactSidebar(compact: boolean): void {
    localStorage.setItem('av_compact_sidebar', compact ? '1' : '0');
    document.documentElement.classList.toggle('compact-sidebar', compact);
  }

  loadCompactSidebarFromStorage(): boolean {
    const compact = localStorage.getItem('av_compact_sidebar') === '1';
    document.documentElement.classList.toggle('compact-sidebar', compact);
    return compact;
  }
}
