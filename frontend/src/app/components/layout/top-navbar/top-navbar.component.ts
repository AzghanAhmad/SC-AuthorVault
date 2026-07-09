import { Component, inject, signal, HostListener, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { LayoutShellService } from '../../../services/layout-shell.service';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/books': 'Books',
  '/books/new': 'New Book',
  '/settings': 'Settings',
  '/vault/company': 'Company File',
  '/vault/imprints': 'Imprints',
  '/vault/pen-names': 'Pen Names',
  '/vault/series': 'Series',
  '/vault/languages': 'Languages',
  '/vault/formats': 'Formats',
  '/company/isbns': 'ISBN Master',
  '/company/calendar': 'Important Dates',
};

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-navbar.component.html',
  styleUrls: ['./top-navbar.component.css'],
})
export class TopNavbarComponent implements OnInit {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  readonly shell = inject(LayoutShellService);

  notifOpen = signal(false);
  profileOpen = signal(false);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects.split('?')[0])
    ),
    { initialValue: this.router.url.split('?')[0] }
  );

  pageTitle = computed(() => {
    const url = this.currentUrl();
    if (PAGE_TITLES[url]) return PAGE_TITLES[url];
    if (url.startsWith('/books/')) return 'Book Detail';
    return 'AuthorVault';
  });

  ngOnInit(): void {
    this.notifications.refresh();
  }

  toggleMobileMenu(): void {
    this.shell.toggleMobileSidebar();
    this.notifOpen.set(false);
    this.profileOpen.set(false);
  }

  toggleNotifPanel(): void {
    if (this.shell.isMobileViewport()) this.shell.closeMobileSidebar();
    this.notifOpen.update(v => !v);
    this.profileOpen.set(false);
    if (this.notifOpen()) this.notifications.refresh();
  }

  toggleProfileMenu(): void {
    if (this.shell.isMobileViewport()) this.shell.closeMobileSidebar();
    this.profileOpen.update(v => !v);
    this.notifOpen.set(false);
  }

  openNotification(id: string, route?: string): void {
    this.notifications.markRead(id);
    this.notifOpen.set(false);
    if (route) this.router.navigateByUrl(route);
  }

  logout(): void {
    this.profileOpen.set(false);
    this.auth.clearSession();
    void this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar-notif-wrap')) this.notifOpen.set(false);
    if (!target.closest('.navbar-profile-wrap')) this.profileOpen.set(false);
  }
}
