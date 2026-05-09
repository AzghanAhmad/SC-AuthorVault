import { Component, signal, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: { label: string; route: string; icon: string }[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar-logo" *ngIf="!collapsed()">
        <svg viewBox="0 0 36 36" fill="none" class="logo-icon">
          <defs><linearGradient id="slg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#a78bfa"/>
          </linearGradient></defs>
          <rect width="36" height="36" rx="10" fill="url(#slg)" opacity="0.2"/>
          <path d="M10 26V12l8-6 8 6v14H10z" stroke="url(#slg)" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
          <path d="M15 26v-6h6v6" stroke="url(#slg)" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
        </svg>
        <span class="logo-text">AuthorVault</span>
      </div>
      <div class="sidebar-logo-collapsed" *ngIf="collapsed()">
        <svg viewBox="0 0 36 36" fill="none" class="logo-icon-sm">
          <defs><linearGradient id="slg2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#a78bfa"/>
          </linearGradient></defs>
          <rect width="36" height="36" rx="10" fill="url(#slg2)" opacity="0.2"/>
          <path d="M10 26V12l8-6 8 6v14H10z" stroke="url(#slg2)" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
          <path d="M15 26v-6h6v6" stroke="url(#slg2)" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
        </svg>
      </div>

      <nav class="sidebar-nav">
        <!-- Dashboard (standalone) -->
        <a class="nav-item"
           routerLink="/dashboard"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: true }">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/>
            </svg>
          </span>
          <span class="nav-label" *ngIf="!collapsed()">Dashboard</span>
          <div class="nav-active-indicator"></div>
        </a>

        <!-- Company (with dropdown) -->
        <div class="nav-group">
          <button class="nav-group-header"
                  [class.group-active]="isGroupActive('company')"
                  [class.open]="openGroup() === 'company'"
                  (click)="toggleGroup('company')">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <path d="M9 22V12h6v10"/><path d="M8 6h.01"/><path d="M16 6h.01"/>
                <path d="M8 10h.01"/><path d="M16 10h.01"/>
              </svg>
            </span>
            <span class="nav-label" *ngIf="!collapsed()">Company</span>
            <svg *ngIf="!collapsed()" class="chevron" [class.rotated]="openGroup() === 'company'" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="nav-children" [class.open]="openGroup() === 'company' && !collapsed()">
            <a class="nav-child" routerLink="/vault/company" routerLinkActive="child-active">
              <span class="child-dot"></span>Company File
            </a>
            <a class="nav-child" routerLink="/vault/imprints" routerLinkActive="child-active">
              <span class="child-dot"></span>Imprints
            </a>
            <a class="nav-child" routerLink="/company/isbns" routerLinkActive="child-active">
              <span class="child-dot"></span>ISBNs
            </a>
            <a class="nav-child" routerLink="/company/calendar" routerLinkActive="child-active">
              <span class="child-dot"></span>Calendar
            </a>
          </div>
        </div>

        <!-- Library (with dropdown) -->
        <div class="nav-group">
          <button class="nav-group-header"
                  [class.group-active]="isGroupActive('library')"
                  [class.open]="openGroup() === 'library'"
                  (click)="toggleGroup('library')">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
            </span>
            <span class="nav-label" *ngIf="!collapsed()">Library</span>
            <svg *ngIf="!collapsed()" class="chevron" [class.rotated]="openGroup() === 'library'" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="nav-children" [class.open]="openGroup() === 'library' && !collapsed()">
            <a class="nav-child" routerLink="/books" routerLinkActive="child-active">
              <span class="child-dot"></span>Books
            </a>
            <a class="nav-child" routerLink="/vault/pen-names" routerLinkActive="child-active">
              <span class="child-dot"></span>Pen Names
            </a>
            <a class="nav-child" routerLink="/vault/series" routerLinkActive="child-active">
              <span class="child-dot"></span>Series
            </a>
            <a class="nav-child" routerLink="/vault/languages" routerLinkActive="child-active">
              <span class="child-dot"></span>Languages
            </a>
            <a class="nav-child" routerLink="/vault/formats" routerLinkActive="child-active">
              <span class="child-dot"></span>Formats
            </a>
          </div>
        </div>

        <!-- Settings -->
        <a class="nav-item"
           routerLink="/settings"
           routerLinkActive="active">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </span>
          <span class="nav-label" *ngIf="!collapsed()">Settings</span>
          <div class="nav-active-indicator"></div>
        </a>
      </nav>

      <div class="sidebar-divider"></div>

      <div class="sidebar-user" *ngIf="!collapsed()">
        <div class="profile-avatar">{{ auth.initials() }}</div>
        <div class="profile-meta">
          <div class="profile-name">{{ auth.displayName() }}</div>
          <div class="profile-email" *ngIf="auth.email()">{{ auth.email() }}</div>
        </div>
      </div>

      <button class="logout-btn" *ngIf="!collapsed()" type="button" (click)="logout()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
      </button>

      <button class="collapse-btn" (click)="toggleCollapse()" [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline *ngIf="!collapsed()" points="15 18 9 12 15 6"/>
          <polyline *ngIf="collapsed()" points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px; min-width: 260px; height: 100vh;
      background: linear-gradient(180deg, rgb(22, 38, 62) 0%, rgb(14, 24, 40) 100%);
      border-right: 1px solid rgba(255,255,255,0.08);
      display: flex; flex-direction: column;
      padding: 20px 12px 16px;
      transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      position: fixed; left: 0; top: 0; z-index: 40;
      overflow-y: auto; overflow-x: hidden;
    }
    .sidebar.collapsed { width: 72px; min-width: 72px; }

    /* Logo */
    .sidebar-logo {
      display: flex; align-items: center; gap: 10px;
      padding: 4px 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 12px;
    }
    .logo-icon { width: 32px; height: 32px; flex-shrink: 0; }
    .logo-text { font-size: 1rem; font-weight: 700; color: #fff; letter-spacing: .01em; }
    .sidebar-logo-collapsed { display: flex; justify-content: center; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 12px; }
    .logo-icon-sm { width: 32px; height: 32px; }

    /* Nav */
    .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 2px; }

    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 10px;
      font-size: 14px; font-weight: 500;
      color: rgba(255,255,255,0.75); text-decoration: none;
      transition: all 0.15s; position: relative; cursor: pointer;
    }
    .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .nav-item.active { background: rgba(59,130,246,0.25); color: #fff; }
    .nav-active-indicator {
      position: absolute; right: 0; top: 50%; transform: translateY(-50%);
      width: 3px; height: 0; background: #60a5fa; border-radius: 3px;
      transition: height 0.2s;
    }
    .nav-item.active .nav-active-indicator { height: 20px; }

    /* Group */
    .nav-group { display: flex; flex-direction: column; }
    .nav-group-header {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 10px;
      font-size: 14px; font-weight: 500;
      color: rgba(255,255,255,0.75); background: none; border: none;
      cursor: pointer; transition: all 0.15s; text-align: left; width: 100%;
    }
    .nav-group-header:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .nav-group-header.group-active { color: #fff; }
    .nav-group-header.open { background: rgba(255,255,255,0.07); color: #fff; }

    .chevron {
      width: 14px; height: 14px; margin-left: auto; flex-shrink: 0;
      fill: none; stroke: currentColor; stroke-width: 2;
      stroke-linecap: round; stroke-linejoin: round;
      transition: transform 0.2s; opacity: 0.7;
    }
    .chevron.rotated { transform: rotate(180deg); }

    .nav-children {
      max-height: 0; overflow: hidden;
      transition: max-height 0.25s cubic-bezier(0.4,0,0.2,1);
      padding-left: 14px;
    }
    .nav-children.open { max-height: 300px; }

    .nav-child {
      display: flex; align-items: center; gap: 10px;
      padding: 7px 14px; border-radius: 8px;
      font-size: 13px; font-weight: 400;
      color: rgba(255,255,255,0.6); text-decoration: none;
      transition: all 0.15s; cursor: pointer;
    }
    .nav-child:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
    .nav-child.child-active { color: #93c5fd; font-weight: 500; }
    .child-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: rgba(255,255,255,0.3); flex-shrink: 0; transition: background 0.15s;
    }
    .nav-child.child-active .child-dot { background: #60a5fa; }

    /* Icon */
    .nav-icon {
      flex-shrink: 0; width: 22px; height: 22px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .nav-icon svg {
      width: 18px; height: 18px; fill: none; stroke: currentColor;
      stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; opacity: 0.9;
    }
    .nav-label { white-space: nowrap; flex: 1; }

    /* Divider */
    .sidebar-divider { height: 1px; margin: 10px 4px 8px; background: rgba(255,255,255,0.08); }

    /* User */
    .sidebar-user {
      display: flex; align-items: center; gap: .75rem;
      margin: 0 4px 10px; padding: .625rem .75rem;
      border-radius: 12px; background: rgba(255,255,255,0.05);
    }
    .profile-avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #4f7cff 0%, #7a5af8 100%);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0;
    }
    .profile-name { color: #fff; font-size: .8125rem; font-weight: 600; line-height: 1.2; }
    .profile-email { color: rgba(255,255,255,0.5); font-size: .6875rem; margin-top: 1px; }

    /* Logout */
    .logout-btn {
      margin: 0 4px 10px; display: flex; align-items: center; gap: .625rem;
      width: calc(100% - 8px); padding: .5rem 1rem;
      background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.12);
      border-radius: 9px; color: rgba(252,165,165,0.8);
      font-size: .8125rem; font-weight: 500; font-family: inherit;
      cursor: pointer; transition: all .2s;
    }
    .logout-btn:hover { background: rgba(239,68,68,0.18); color: #fca5a5; }

    /* Collapse */
    .collapse-btn {
      margin: 0 4px; padding: 9px; border-radius: 9px;
      background: transparent; border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.6); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .collapse-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar.mobile-open { transform: translateX(0); }
    }
  `]
})
export class SidebarComponent {
  collapsed = signal(false);
  openGroup = signal<string | null>('library'); // default open
  @Output() collapsedChange = new EventEmitter<boolean>();
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  toggleCollapse() {
    this.collapsed.update(v => !v);
    this.collapsedChange.emit(this.collapsed());
  }

  toggleGroup(id: string) {
    this.openGroup.update(cur => cur === id ? null : id);
  }

  isGroupActive(group: string): boolean {
    const url = this.router.url;
    if (group === 'company') return url.startsWith('/vault/company') || url.startsWith('/vault/imprints') || url.startsWith('/company/');
    if (group === 'library') return url.startsWith('/books') || url.startsWith('/vault/pen-names') || url.startsWith('/vault/series') || url.startsWith('/vault/languages') || url.startsWith('/vault/formats');
    return false;
  }

  logout(): void {
    this.auth.clearSession();
    void this.router.navigate(['/login']);
  }
}
