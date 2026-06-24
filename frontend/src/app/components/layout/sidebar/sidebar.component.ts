import { Component, signal, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
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
      <div class="sidebar-top-row">
        <div class="sidebar-logo" *ngIf="!collapsed()">
          <span class="logo-mark" style="background:transparent;box-shadow:none;width:32px;height:32px;">
            <svg viewBox="0 0 36 36" fill="none" style="width:32px;height:32px;"><defs><linearGradient id="lg-sidebar" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60a5fa"/><stop offset="50%" stop-color="#818cf8"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs><rect width="36" height="36" rx="10" fill="url(#lg-sidebar)" opacity="0.15"/><path d="M13 14.5a3.5 3.5 0 0 1 5.25.38l1.75-1.75a3.5 3.5 0 0 0-4.95-4.95l-2 2" stroke="url(#lg-sidebar)" stroke-width="2.2" stroke-linecap="round"/><path d="M23 21.5a3.5 3.5 0 0 1-5.25-.38l-1.75 1.75a3.5 3.5 0 0 0 4.95 4.95l2-2" stroke="url(#lg-sidebar)" stroke-width="2.2" stroke-linecap="round"/><line x1="14" y1="22" x2="22" y2="14" stroke="url(#lg-sidebar)" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 3"/></svg>
          </span>
          <div class="logo-text-wrap">
            <span class="logo-text">ScribeCount</span>
            <span class="logo-sub">AUTHORVAULT</span>
          </div>
        </div>
        <div class="sidebar-logo-collapsed" *ngIf="collapsed()" style="padding-bottom:12px;">
          <span class="logo-mark" style="background:transparent;box-shadow:none;width:32px;height:32px;margin:0 auto;">
            <svg viewBox="0 0 36 36" fill="none" style="width:32px;height:32px;"><defs><linearGradient id="lg-sidebar-col" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60a5fa"/><stop offset="50%" stop-color="#818cf8"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs><rect width="36" height="36" rx="10" fill="url(#lg-sidebar-col)" opacity="0.15"/><path d="M13 14.5a3.5 3.5 0 0 1 5.25.38l1.75-1.75a3.5 3.5 0 0 0-4.95-4.95l-2 2" stroke="url(#lg-sidebar-col)" stroke-width="2.2" stroke-linecap="round"/><path d="M23 21.5a3.5 3.5 0 0 1-5.25-.38l-1.75 1.75a3.5 3.5 0 0 0 4.95 4.95l2-2" stroke="url(#lg-sidebar-col)" stroke-width="2.2" stroke-linecap="round"/><line x1="14" y1="22" x2="22" y2="14" stroke="url(#lg-sidebar-col)" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 3"/></svg>
          </span>
        </div>
        <button class="collapse-btn" (click)="toggleCollapse()" [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline *ngIf="!collapsed()" points="15 18 9 12 15 6"/>
            <polyline *ngIf="collapsed()" points="9 18 15 12 9 6"/>
          </svg>
        </button>
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

        <!-- Company section (always expanded) -->
        <div class="nav-group">
          <div class="nav-section-label" *ngIf="!collapsed()">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.5 21h19"/>
                <path d="M4.5 21V11.5h3.5V21"/>
                <path d="M6.25 13.5v5"/>
                <path d="M8.5 21V6h7V21"/>
                <path d="M12 6V2.75"/>
                <path d="M9.75 8h4.5"/><path d="M9.75 9.75h4.5"/><path d="M9.75 11.5h4.5"/>
                <path d="M9.75 13.25h4.5"/><path d="M9.75 15h4.5"/><path d="M9.75 16.75h4.5"/>
                <path d="M9.75 18.5h4.5"/>
                <path d="M16 21V11.5h3.5V21"/>
                <path d="M17.75 13.5v5"/>
              </svg>
            </span>
            <span class="nav-label">Company</span>
          </div>
          <div class="nav-children always-open" [class.visible]="!collapsed()">
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
              <span class="child-dot"></span>Important Dates
            </a>
          </div>
        </div>

        <!-- Library section (always expanded) -->
        <div class="nav-group">
          <div class="nav-section-label" *ngIf="!collapsed()">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
            </span>
            <span class="nav-label">Library</span>
          </div>
          <div class="nav-children always-open" [class.visible]="!collapsed()">
            <a class="nav-child" routerLink="/vault/pen-names" routerLinkActive="child-active">
              <span class="child-dot"></span>Pen Names
            </a>
            <a class="nav-child" routerLink="/vault/series" routerLinkActive="child-active">
              <span class="child-dot"></span>Series
            </a>
            <a class="nav-child" routerLink="/vault/languages" routerLinkActive="child-active">
              <span class="child-dot"></span>Languages
            </a>
            <a class="nav-child" routerLink="/books" routerLinkActive="child-active">
              <span class="child-dot"></span>Books
            </a>
            <a class="nav-child" routerLink="/vault/formats" routerLinkActive="child-active">
              <span class="child-dot"></span>Formats
            </a>
          </div>
        </div>
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

    /* Top Row */
    .sidebar-top-row {
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 12px;
    }
    .sidebar-logo {
      display: flex; align-items: center; gap: 10px;
    }
    .logo-mark {
      width: 36px; height: 36px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: #fff; border-radius: 10px; padding: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }
    .logo-icon { width: 100%; height: 100%; object-fit: contain; display: block; }
    .logo-text-wrap { display: flex; flex-direction: column; gap: 0; }
    .logo-text { font-size: 1.05rem; font-weight: 700; color: #fff; letter-spacing: .01em; line-height: 1.2; }
    .logo-sub { font-size: 0.6rem; font-weight: 700; color: #38bdf8; letter-spacing: .14em; text-transform: uppercase; line-height: 1.2; }
    .sidebar-logo-collapsed { display: flex; justify-content: center; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 12px; }
    .sidebar-logo-collapsed .logo-mark { width: 32px; height: 32px; border-radius: 8px; padding: 3px; }
    .logo-icon-sm { width: 100%; height: 100%; object-fit: contain; display: block; }

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
    .nav-group { display: flex; flex-direction: column; margin-bottom: 0.25rem; }
    .nav-section-label {
      display: flex; align-items: center; gap: 12px;
      padding: 8px 14px 4px;
      font-size: 11px; font-weight: 700;
      color: rgba(255,255,255,0.45);
      text-transform: uppercase; letter-spacing: 0.08em;
    }
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
    .nav-children.always-open {
      max-height: none; overflow: visible; padding-left: 14px;
    }
    .nav-children.always-open:not(.visible) {
      max-height: 0; overflow: hidden; padding-left: 0;
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
export class SidebarComponent implements OnInit, OnDestroy {
  collapsed = signal(false);
  openGroup = signal<string | null>('library');
  @Output() collapsedChange = new EventEmitter<boolean>();
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private navSub?: Subscription;

  ngOnInit(): void {
    this.syncOpenGroup();
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.syncOpenGroup());
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  /** Keep the submenu expanded for the section that matches the current route. */
  private syncOpenGroup(): void {
    const url = this.router.url;
    if (
      url.startsWith('/vault/company') ||
      url.startsWith('/vault/imprints') ||
      url.startsWith('/company/')
    ) {
      this.openGroup.set('company');
    } else if (
      url.startsWith('/books') ||
      url.startsWith('/vault/pen-names') ||
      url.startsWith('/vault/series') ||
      url.startsWith('/vault/languages') ||
      url.startsWith('/vault/formats')
    ) {
      this.openGroup.set('library');
    }
  }

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
