import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutShellService {
  readonly mobileSidebarOpen = signal(false);

  private readonly mobileBreakpoint = 768;

  isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= this.mobileBreakpoint;
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(open => !open);
  }

  openMobileSidebar(): void {
    this.mobileSidebarOpen.set(true);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }
}
