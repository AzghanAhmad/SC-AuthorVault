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
