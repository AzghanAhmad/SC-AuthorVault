import { Injectable, inject } from '@angular/core';
import { Observable, of, tap, catchError } from 'rxjs';
import { ApiService } from './api.service';

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

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ApiService);

  private settings: AppSettings = {
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

  loadFromApi(): Observable<AppSettings> {
    return this.api.get<AppSettings>('/settings').pipe(
      tap(s => {
        if (s && s.email) {
          this.settings = { ...this.settings, ...s };
        } else {
          this.saveToApi(this.settings).subscribe();
        }
      }),
      catchError(() => {
        this.saveToApi(this.settings).subscribe();
        return of(this.settings);
      })
    );
  }

  getSettings(): Observable<AppSettings> {
    return of({ ...this.settings });
  }

  updateSettings(s: AppSettings): Observable<AppSettings> {
    this.settings = { ...s };
    return this.saveToApi(this.settings);
  }

  private saveToApi(s: AppSettings): Observable<AppSettings> {
    return this.api.put<AppSettings>('/settings', s).pipe(
      tap(saved => {
        if (saved) this.settings = { ...this.settings, ...saved };
      }),
      catchError(() => of(s))
    );
  }
}
