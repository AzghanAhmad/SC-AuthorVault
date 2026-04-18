import { Component, signal, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section-label" *ngIf="!collapsed()">AuthorVault</div>
        @for (item of navItems; track item.route) {
          <a class="nav-item"
             [routerLink]="item.route"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }">
            <span class="nav-icon" [ngSwitch]="item.icon">
              <svg *ngSwitchCase="'home'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 10.5 12 3l9 7.5"></path>
                <path d="M5 9.8V21h14V9.8"></path>
              </svg>
              <svg *ngSwitchCase="'book'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
              <svg *ngSwitchCase="'files'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <svg *ngSwitchCase="'metadata'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
              <svg *ngSwitchCase="'platforms'" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
              </svg>
              <svg *ngSwitchCase="'marketing'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12h2l2-6 4 12 2-6h6"/>
              </svg>
              <svg *ngSwitchCase="'ai'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2a4 4 0 0 0-4 4c0 2.5 2 4 4 6 2-2 4-3.5 4-6a4 4 0 0 0-4-4z"/>
                <circle cx="12" cy="18" r="4"/><path d="M12 14v0"/>
              </svg>
              <svg *ngSwitchCase="'settings'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <svg *ngSwitchDefault viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </span>
            <span class="nav-label" *ngIf="!collapsed()">{{ item.label }}</span>
            <div class="nav-active-indicator"></div>
          </a>
        }
      </nav>

      <div class="sidebar-divider"></div>

      <div class="sidebar-user" *ngIf="!collapsed()">
        <div class="profile-avatar">{{ auth.initials() }}</div>
        <div class="profile-meta">
          <div class="profile-name">{{ auth.displayName() }}</div>
          <div class="profile-email" *ngIf="auth.email()">{{ auth.email() }}</div>
        </div>
      </div>

      <button class="logout-btn" *ngIf="!collapsed()" type="button" (click)="logout()">Logout</button>

      <button class="collapse-btn" (click)="toggleCollapse()" [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
        <span>{{ collapsed() ? '→' : '←' }}</span>
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      min-width: 260px;
      height: 100vh;
      background: linear-gradient(180deg, rgb(22, 38, 62) 0%, rgb(14, 24, 40) 100%);
      border-right: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      flex-direction: column;
      padding: 24px 12px 20px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: fixed;
      left: 0;
      top: 0;
      z-index: 40;
    }

    .sidebar.collapsed {
      width: 72px;
      min-width: 72px;
    }

    .nav-section-label {
      padding: 4px 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
    }

    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
      padding-top: 12px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      cursor: pointer;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    .nav-item.active {
      background: rgba(59, 130, 246, 0.25);
      color: #ffffff;
    }

    .nav-active-indicator {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 0;
      background: #ffffff;
      border-radius: 3px;
      transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-item.active .nav-active-indicator {
      height: 20px;
    }

    .nav-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      text-align: center;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .nav-icon svg {
      width: 20px;
      height: 20px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      opacity: 0.92;
    }

    .nav-label {
      white-space: nowrap;
    }

    .sidebar-divider {
      height: 1px;
      margin: 12px 4px 10px;
      background: rgba(255, 255, 255, 0.1);
    }

    .sidebar-user {
      display: flex;
      align-items: center;
      gap: .75rem;
      margin: 0 4px 12px;
      padding: .625rem .75rem;
      border-radius: 14px;
      background: #ffffff0a;
      transition: background .2s;
    }

    .profile-avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f7cff 0%, #7a5af8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 18px;
      flex-shrink: 0;
    }

    .profile-name {
      color: #fff;
      font-size: .8125rem;
      line-height: 1.2;
      font-weight: 700;
    }

    .profile-email {
      color: rgba(255, 255, 255, 0.6);
      font-size: .6875rem;
      margin-top: 2px;
      line-height: 1.2;
    }

    .logout-btn {
      margin: 0 4px 12px;
      display: flex;
      align-items: center;
      gap: .75rem;
      width: calc(100% - 8px);
      padding: .625rem 1rem;
      background: #ef444414;
      border: 1px solid rgba(239, 68, 68, .1);
      border-radius: 10px;
      color: #fca5a5cc;
      font-size: .8125rem;
      font-weight: 500;
      font-family: Inter, sans-serif;
      text-align: left;
      cursor: pointer;
      transition: all .25s cubic-bezier(.4, 0, .2, 1);
    }

    .logout-btn:hover {
      background: rgba(55, 28, 40, 0.6);
      color: #ffb1bb;
    }

    .collapse-btn {
      margin: 0 4px;
      padding: 10px;
      border-radius: 10px;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.75);
      cursor: pointer;
      font-size: 16px;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .collapse-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .sidebar.mobile-open {
        transform: translateX(0);
      }
    }
  `]
})
export class SidebarComponent {
  collapsed = signal(false);
  @Output() collapsedChange = new EventEmitter<boolean>();
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'home', route: '/dashboard' },
    { label: 'Books', icon: 'book', route: '/books' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  toggleCollapse() {
    this.collapsed.update(v => !v);
    this.collapsedChange.emit(this.collapsed());
  }

  logout(): void {
    this.auth.clearSession();
    void this.router.navigate(['/login']);
  }
}
