import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { TopNavbarComponent } from './components/layout/top-navbar/top-navbar.component';
import { ToastComponent } from './components/shared/toast/toast.component';
import { AuthService } from './services/auth.service';
import { LayoutShellService } from './services/layout-shell.service';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopNavbarComponent, ToastComponent],
  template: `
    <!-- Auth pages (no sidebar) -->
    <div *ngIf="isAuthPage()" class="auth-layout">
      <router-outlet />
    </div>

    <!-- App pages (with sidebar) -->
    <div *ngIf="!isAuthPage()" class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed" [style.--app-sidebar-width]="sidebarCollapsed ? '72px' : '260px'">
      <app-sidebar (collapsedChange)="sidebarCollapsed = $event" />
      @if (shell.mobileSidebarOpen()) {
        <button
          type="button"
          class="sidebar-backdrop"
          aria-label="Close navigation menu"
          (click)="shell.closeMobileSidebar()">
        </button>
      }
      <main class="app-main">
        <app-top-navbar />
        <div class="app-content">
          <router-outlet />
        </div>
      </main>
    </div>

    <app-toast />
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }

    .auth-layout {
      min-height: 100vh;
    }

    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--background);
    }

    .app-main {
      flex: 1;
      margin-left: 260px;
      background: var(--background);
      min-height: 100vh;
      transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .app-content {
      flex: 1;
      padding: calc(64px + 2rem) 2.5rem 2rem;
      overflow-y: auto;
      min-height: 100vh;
      box-sizing: border-box;
    }

    .app-layout.sidebar-collapsed .app-main {
      margin-left: 72px;
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      z-index: 45;
      border: none;
      padding: 0;
      margin: 0;
      background: rgba(15, 23, 42, 0.55);
      cursor: pointer;
      animation: backdropIn 0.2s ease-out;
    }

    @keyframes backdropIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 768px) {
      .app-main {
        margin-left: 0;
      }

      .app-layout {
        --app-sidebar-width: 0px;
      }

      .app-content {
        padding: calc(64px + 1.25rem) 1.25rem 1.25rem;
      }
    }
  `]
})
export class App {
  private router = inject(Router);
  private auth = inject(AuthService);
  readonly shell = inject(LayoutShellService);
  sidebarCollapsed = false;

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  isAuthPage = computed(() => {
    const url = this.currentUrl();
    const publicPaths = ['/login', '/signup', '/about', '/contact', '/privacy', '/terms'];
    return url === '/' || publicPaths.some(path => url.startsWith(path));
  });
}
