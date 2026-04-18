import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { ToastComponent } from './components/shared/toast/toast.component';
import { AuthService } from './services/auth.service';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ToastComponent],
  template: `
    <!-- Auth pages (no sidebar) -->
    <div *ngIf="isAuthPage()" class="auth-layout">
      <router-outlet />
    </div>

    <!-- App pages (with sidebar) -->
    <div *ngIf="!isAuthPage()" class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed">
      <app-sidebar (collapsedChange)="sidebarCollapsed = $event" />
      <main class="app-main">
        <router-outlet />
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
      padding: 2rem 2.5rem;
      background: var(--background);
      min-height: 100vh;
      transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      overflow-y: auto;
    }

    .app-layout.sidebar-collapsed .app-main {
      margin-left: 72px;
    }

    @media (max-width: 768px) {
      .app-main {
        margin-left: 0;
        padding: 1.25rem;
      }
    }
  `]
})
export class App {
  private router = inject(Router);
  private auth = inject(AuthService);
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
    return url.startsWith('/login') || url.startsWith('/signup') || url === '/';
  });
}
