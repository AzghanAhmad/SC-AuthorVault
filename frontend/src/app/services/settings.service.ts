import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

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

  getSettings(): Observable<AppSettings> {
    return of({ ...this.settings }).pipe(delay(300));
  }

  updateSettings(s: AppSettings): Observable<AppSettings> {
    this.settings = { ...s };
    return of(this.settings).pipe(delay(500));
  }

}
