import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import {
  SettingsService,
  AppSettings,
  NotificationPreferenceState,
} from '../../../services/settings.service';
import { ThemeService } from '../../../services/theme.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly settingsService = inject(SettingsService);
  private readonly themeService = inject(ThemeService);
  private readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  activeSection = 'workspace';
  accountName = '';
  accountEmail = '';
  authorName = '';
  theme = 'light';
  defaultPage = 'dashboard';
  compactSidebar = false;
  showToast = false;
  toastMessage = '';
  saving = false;

  notificationPreferences: NotificationPreferenceState[] = [];

  get enabledNotificationCount(): number {
    return this.notificationPreferences.filter(p => p.enabled).length;
  }

  constructor() {
    const user = this.authService.user();
    if (user) {
      this.accountName = user.name;
      this.accountEmail = user.email;
      this.authorName = user.name;
    }
  }

  ngOnInit() {
    this.settingsService.loadFromApi().subscribe({
      next: (s: AppSettings) => this.applySettings(s),
      error: () => {
        const user = this.authService.user();
        if (user) {
          this.accountName = user.name;
          this.accountEmail = user.email;
          this.authorName = user.name;
        }
        this.notificationPreferences = this.settingsService.buildNotificationPreferences();
      },
    });
  }

  private applySettings(s: AppSettings) {
    this.accountName = s.name;
    this.accountEmail = s.email;
    this.authorName = s.authorName;
    this.theme = s.theme;
    this.defaultPage = s.defaultLandingPage;
    this.compactSidebar = s.compactSidebar;
    this.notificationPreferences = this.settingsService.buildNotificationPreferences(s);
    this.themeService.applyThemeFromSettings(s.theme, s.compactSidebar);
    this.notificationService.refresh();
    this.cdr.detectChanges();
  }

  saveSettings() {
    this.saving = true;
    this.cdr.detectChanges();
    this.settingsService.updateSettings({
      name: this.accountName,
      email: this.accountEmail,
      authorName: this.authorName,
      defaultCountry: 'US',
      defaultFormat: 'ebook',
      enableBridgePage: false,
      autoGeoRouting: true,
      theme: this.theme,
      defaultLandingPage: this.defaultPage,
      compactSidebar: this.compactSidebar,
      ...this.settingsService.notificationPrefsToPayload(this.notificationPreferences),
    }).subscribe({
      next: (s) => {
        this.saving = false;
        this.authService.updateCachedUser({ name: this.accountName, email: this.accountEmail });
        this.themeService.setTheme(this.theme as 'light' | 'dark' | 'auto');
        this.applySettings(s);
        this.showToastMsg('Settings saved!');
      },
      error: (err) => {
        this.saving = false;
        this.showToastMsg('Failed: ' + (err?.message || 'Could not save'));
        this.cdr.detectChanges();
      },
    });
  }

  onNotificationToggle(pref: NotificationPreferenceState, enabled: boolean): void {
    pref.enabled = enabled;
    this.notificationService.refresh();
    this.cdr.detectChanges();
  }

  private showToastMsg(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  sections = [
    { id: 'workspace', label: 'Workspace', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>' },
    { id: 'notifications', label: 'Notifications', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
    { id: 'appearance', label: 'Appearance', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' },
  ];
}
