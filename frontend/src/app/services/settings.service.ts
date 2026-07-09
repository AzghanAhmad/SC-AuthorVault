import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { ApiService } from './api.service';
import { getApiErrorMessage } from '../utils/api-error.util';

export interface AppSettings {
  name: string;
  email: string;
  authorName: string;
  defaultCountry: string;
  defaultFormat: string;
  enableBridgePage: boolean;
  autoGeoRouting: boolean;
  theme: string;
  defaultLandingPage: string;
  compactSidebar: boolean;
  notifBrokenLink: boolean;
  notifMilestones: boolean;
  notifWeeklyReport: boolean;
  notifProductUpdates: boolean;
}

export type NotificationPreferenceKey =
  | 'notifBrokenLink'
  | 'notifMilestones'
  | 'notifWeeklyReport'
  | 'notifProductUpdates';

export interface NotificationPreferenceDefinition {
  key: NotificationPreferenceKey;
  title: string;
  description: string;
  category: 'email' | 'in-app';
}

export const NOTIFICATION_PREFERENCE_DEFINITIONS: NotificationPreferenceDefinition[] = [
  {
    key: 'notifBrokenLink',
    title: 'Broken Link Alerts',
    description: 'Email when a retailer or store link stops working',
    category: 'email',
  },
  {
    key: 'notifMilestones',
    title: 'Publishing Milestones',
    description: 'Celebrate launches, pre-orders, and release milestones',
    category: 'email',
  },
  {
    key: 'notifWeeklyReport',
    title: 'Weekly Activity Report',
    description: 'Summary of vault edits, uploads, and catalog changes',
    category: 'email',
  },
  {
    key: 'notifProductUpdates',
    title: 'Product Updates',
    description: 'News about new AuthorVault features and improvements',
    category: 'email',
  },
];

export interface NotificationPreferenceState extends NotificationPreferenceDefinition {
  enabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  name: 'Author User',
  email: 'author@scribecount.com',
  authorName: 'Author User',
  defaultCountry: 'US',
  defaultFormat: 'ebook',
  enableBridgePage: false,
  autoGeoRouting: true,
  theme: 'light',
  defaultLandingPage: 'dashboard',
  compactSidebar: false,
  notifBrokenLink: true,
  notifMilestones: true,
  notifWeeklyReport: true,
  notifProductUpdates: false
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ApiService);
  private settings: AppSettings = { ...DEFAULT_SETTINGS };

  getSnapshot(): AppSettings {
    return { ...this.settings };
  }

  buildNotificationPreferences(settings: Partial<AppSettings> = this.settings): NotificationPreferenceState[] {
    const merged = this.normalize(settings);
    return NOTIFICATION_PREFERENCE_DEFINITIONS.map(def => ({
      ...def,
      enabled: !!merged[def.key],
    }));
  }

  notificationPrefsToPayload(prefs: NotificationPreferenceState[]): Partial<AppSettings> {
    const patch: Partial<AppSettings> = {};
    for (const pref of prefs) {
      patch[pref.key] = pref.enabled;
    }
    return patch;
  }

  loadFromApi(): Observable<AppSettings> {
    return this.api.get<Partial<AppSettings>>('/settings').pipe(
      map(raw => this.normalize(raw)),
      tap(s => { this.settings = s; }),
      catchError(err => {
        console.error('Settings load failed', err);
        return throwError(() => ({ message: getApiErrorMessage(err, 'Failed to load settings.') }));
      })
    );
  }

  updateSettings(partial: Partial<AppSettings>): Observable<AppSettings> {
    const merged = { ...this.settings, ...partial };
    this.settings = merged;
    return this.api.put<Partial<AppSettings>>('/settings', merged).pipe(
      map(raw => this.normalize({ ...merged, ...raw })),
      tap(saved => { this.settings = saved; }),
      catchError(err => throwError(() => ({ message: getApiErrorMessage(err, 'Failed to save settings.') })))
    );
  }

  private normalize(raw: Partial<AppSettings> | null | undefined): AppSettings {
    return { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  }
}
