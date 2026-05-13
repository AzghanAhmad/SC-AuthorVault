import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { SettingsService } from '../../../services/settings.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Configure your AuthorVault preferences</p>
      </div>

      <div class="settings-layout">
        <!-- Settings Navigation -->
        <nav class="settings-nav">
          <button *ngFor="let section of sections"
                  class="nav-item"
                  [class.active]="activeSection === section.id"
                  (click)="activeSection = section.id">
            <div class="nav-icon" [innerHTML]="section.icon"></div>
            {{ section.label }}
          </button>
        </nav>

        <!-- Settings Content -->
        <div class="settings-content">
          <!-- Workspace -->
          <div class="settings-section" *ngIf="activeSection === 'workspace'">
            <div class="card">
              <h2 class="section-title">AuthorVAULT Defaults</h2>
              <p class="section-desc">Account, security, and payment settings are managed by the OS. Keep only AuthorVAULT-specific defaults here.</p>
              <div class="form-group">
                <label class="form-label">Author/Brand Name</label>
                <input type="text" class="form-input" [(ngModel)]="authorName">
              </div>
              <div class="form-group">
                <label class="form-label">Default Landing Page</label>
                <select class="form-input" [(ngModel)]="defaultPage">
                  <option value="dashboard">Dashboard</option>
                  <option value="books">Books</option>
                  <option value="vault">AuthorVAULT</option>
                </select>
              </div>
              <button class="btn-primary" style="margin-top: 0.75rem;" (click)="saveSettings()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>

          <!-- Notifications -->
          <div class="settings-section" *ngIf="activeSection === 'notifications'">
            <div class="card">
              <h2 class="section-title">Email Notifications</h2>
              <p class="section-desc">Choose which emails you want to receive</p>
              <div class="setting-item" *ngFor="let notif of emailNotifications">
                <div class="setting-info">
                  <span class="setting-label">{{ notif.title }}</span>
                  <span class="setting-desc">{{ notif.description }}</span>
                </div>
                <input type="checkbox" class="toggle" [(ngModel)]="notif.enabled">
              </div>
              <button class="btn-primary" style="margin-top: 0.75rem;" (click)="saveSettings()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>

          <!-- Appearance -->
          <div class="settings-section" *ngIf="activeSection === 'appearance'">
            <div class="card">
              <h2 class="section-title">Theme</h2>
              <p class="section-desc">Change how the website looks</p>
              <div class="theme-options">
                <div class="theme-option" [class.active]="theme === 'light'" (click)="theme = 'light'">
                  <div class="theme-preview light">
                    <div class="preview-header"></div>
                    <div class="preview-sidebar"></div>
                    <div class="preview-content"></div>
                  </div>
                  <span class="theme-label">Light</span>
                </div>
                <div class="theme-option" [class.active]="theme === 'dark'" (click)="theme = 'dark'">
                  <div class="theme-preview dark">
                    <div class="preview-header"></div>
                    <div class="preview-sidebar"></div>
                    <div class="preview-content"></div>
                  </div>
                  <span class="theme-label">Dark</span>
                </div>
                <div class="theme-option" [class.active]="theme === 'auto'" (click)="theme = 'auto'">
                  <div class="theme-preview auto">
                    <div class="preview-header"></div>
                    <div class="preview-sidebar"></div>
                    <div class="preview-content"></div>
                  </div>
                  <span class="theme-label">Auto</span>
                </div>
              </div>
              <button class="btn-primary" style="margin-top: 0.75rem;" (click)="saveSettings()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>

            <div class="card">
              <h2 class="section-title">Dashboard Preferences</h2>
              <p class="section-desc">Set layout preferences for the app shell</p>
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">Compact Sidebar</span>
                  <span class="setting-desc">Use a narrower sidebar for more content space</span>
                </div>
                <input type="checkbox" class="toggle" [(ngModel)]="compactSidebar">
              </div>
              <button class="btn-primary" style="margin-top: 0.75rem;" (click)="saveSettings()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Toast -->
      <div class="toast" [class.show]="showToast">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        {{ toastMessage }}
      </div>
    </div>
  `,
  styles: [`
    .page {
      width: 100%;
      animation: fadeIn 0.3s ease-out;
    }

    .page-header { margin-bottom: 2rem; }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .page-subtitle {
      font-size: 1rem;
      color: var(--text-muted);
      margin: 0;
    }

    .settings-layout {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 2rem;
    }

    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      position: sticky;
      top: 1rem;
      align-self: flex-start;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      font-family: inherit;
    }

    .nav-item:hover {
      background: rgba(59, 130, 246, 0.05);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: rgba(59, 130, 246, 0.08);
      color: var(--accent-blue);
      font-weight: 600;
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .section-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0 0 1rem 0;
    }

    .form-group { margin-bottom: 1rem; }

    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: var(--background);
      border-radius: 12px;
      margin-bottom: 0.5rem;
    }

    .setting-label { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); display: block; }
    .setting-desc { font-size: 0.8125rem; color: var(--text-muted); }

    .theme-options {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .theme-option {
      flex: 1;
      padding: 1rem;
      background: transparent;
      border: 2px solid var(--border-color);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .theme-option:hover { border-color: var(--text-muted); }

    .theme-option.active {
      border-color: var(--accent-blue);
      background: rgba(59, 130, 246, 0.04);
    }

    .theme-preview {
      width: 100%;
      height: 64px;
      border-radius: 8px;
      overflow: hidden;
      display: grid;
      grid-template-columns: 20px 1fr;
      grid-template-rows: 10px 1fr;
      gap: 2px;
      background: var(--border-color);
      margin-bottom: 0.75rem;
    }

    .preview-header { grid-column: 1 / -1; background: #1c2e4a; }
    .preview-sidebar { background: #1c2e4a; }
    .preview-content { background: #f5f7fa; }
    .theme-preview.dark .preview-content { background: #0f172a; }
    .theme-preview.auto .preview-content { background: linear-gradient(135deg, #f5f7fa 50%, #0f172a 50%); }
    .theme-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-primary); }

    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.25rem;
      background: rgb(28,46,74);
      color: white;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: 0 12px 32px rgba(0,0,0,0.2);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      z-index: 1000;
    }
    .toast.show { transform: translateY(0); opacity: 1; }
    .toast svg { width: 18px; height: 18px; color: #6ee7b7; }

    @media (max-width: 768px) {
      .settings-layout { grid-template-columns: 1fr; }
      .settings-nav { flex-direction: row; overflow-x: auto; position: static; }
      .theme-options { flex-direction: column; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class SettingsComponent implements OnInit {
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

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
    private themeService: ThemeService
  ) {
    // Pre-populate immediately from cached auth so content shows on first render
    const user = this.authService.user();
    if (user) {
      this.accountName = user.name;
      this.accountEmail = user.email;
      this.authorName = user.name;
    }
  }

  ngOnInit() {
    this.settingsService.getSettings().subscribe({
      next: (s) => {
        this.accountName = s.name;
        this.accountEmail = s.email;
        this.authorName = s.authorName;
        this.theme = s.theme;
        this.defaultPage = s.defaultLandingPage;
        this.compactSidebar = s.compactSidebar;
        this.emailNotifications[0].enabled = s.notifBrokenLink;
        this.emailNotifications[1].enabled = s.notifMilestones;
        this.emailNotifications[2].enabled = s.notifWeeklyReport;
        this.emailNotifications[3].enabled = s.notifProductUpdates;
        this.themeService.applyThemeFromSettings(s.theme, s.compactSidebar);
      },
      error: () => {
        const user = this.authService.user();
        if (user) {
          this.accountName = user.name;
          this.accountEmail = user.email;
          this.authorName = user.name;
        }
      }
    });
  }

  saveSettings() {
    this.saving = true;
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
      notifBrokenLink: this.emailNotifications[0].enabled,
      notifMilestones: this.emailNotifications[1].enabled,
      notifWeeklyReport: this.emailNotifications[2].enabled,
      notifProductUpdates: this.emailNotifications[3].enabled
    }).subscribe({
      next: () => {
        this.saving = false;
        this.authService.updateCachedUser({ name: this.accountName, email: this.accountEmail });
        this.themeService.setTheme(this.theme as 'light' | 'dark' | 'auto');
        this.showToastMsg('Settings saved!');
      },
      error: (err) => {
        this.saving = false;
        this.showToastMsg('Failed: ' + (err?.message || 'Could not save'));
      }
    });
  }

  private showToastMsg(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 2500);
  }

  sections = [
    { id: 'workspace', label: 'Workspace', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>' },
    { id: 'notifications', label: 'Notifications', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
    { id: 'appearance', label: 'Appearance', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' }
  ];

  emailNotifications = [
    { title: 'New File Upload Alerts', description: 'Get notified when a collaborator uploads new files', enabled: true },
    { title: 'Publishing Milestones', description: 'Notifications when you hit publishing milestones', enabled: true },
    { title: 'Weekly Asset Reports', description: 'Summary of your AuthorVault activity', enabled: true },
    { title: 'Product Updates', description: 'News about AuthorVault features', enabled: false }
  ];

}
