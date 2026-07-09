import { Injectable, inject, signal, computed } from '@angular/core';
import { ImportantDatesService } from './important-dates.service';
import { SettingsService } from './settings.service';

export type NotificationKind = 'reminder' | 'milestone' | 'report' | 'system' | 'update';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
  route?: string;
}

const READ_KEY = 'av_notif_read';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly datesService = inject(ImportantDatesService);
  private readonly settingsService = inject(SettingsService);

  private readonly items = signal<AppNotification[]>([]);
  readonly notifications = this.items.asReadonly();
  readonly unreadCount = computed(() => this.items().filter(n => !n.read).length);

  refresh(): void {
    const settings = this.settingsService.getSnapshot();
    const readIds = this.loadReadIds();
    const now = new Date();
    const list: AppNotification[] = [];

    for (const d of this.datesService.dates()) {
      if (!d.dueDate) continue;
      const due = new Date(d.dueDate);
      if (Number.isNaN(due.getTime())) continue;
      const days = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
      if (days < -1 || days > 21) continue;

      list.push({
        id: `date-${d.id}`,
        title: d.title,
        message: days < 0
          ? `Overdue by ${Math.abs(days)} day(s) · ${d.category}`
          : days === 0
            ? `Due today · ${d.category}`
            : `Due in ${days} day(s) · ${d.category}`,
        kind: 'reminder',
        createdAt: d.dueDate,
        read: readIds.has(`date-${d.id}`),
        route: '/company/calendar',
      });
    }

    if (settings.notifMilestones) {
      list.push({
        id: 'pref-milestones',
        title: 'Milestone alerts enabled',
        message: 'You will be notified when publishing milestones are reached.',
        kind: 'milestone',
        createdAt: new Date().toISOString(),
        read: readIds.has('pref-milestones'),
        route: '/settings',
      });
    }

    if (settings.notifWeeklyReport) {
      list.push({
        id: 'pref-weekly',
        title: 'Weekly report scheduled',
        message: 'Your AuthorVault activity summary is enabled for email delivery.',
        kind: 'report',
        createdAt: new Date().toISOString(),
        read: readIds.has('pref-weekly'),
        route: '/settings',
      });
    }

    if (settings.notifBrokenLink) {
      list.push({
        id: 'pref-broken-link',
        title: 'Link monitoring on',
        message: 'Broken retailer and store links will trigger an email alert.',
        kind: 'system',
        createdAt: new Date().toISOString(),
        read: readIds.has('pref-broken-link'),
        route: '/settings',
      });
    }

    if (settings.notifProductUpdates) {
      list.push({
        id: 'pref-updates',
        title: 'Product updates',
        message: 'You are subscribed to AuthorVault release notes and feature news.',
        kind: 'update',
        createdAt: new Date().toISOString(),
        read: readIds.has('pref-updates'),
        route: '/settings',
      });
    }

    list.sort((a, b) => {
      const aTime = Date.parse(a.createdAt) || 0;
      const bTime = Date.parse(b.createdAt) || 0;
      return aTime - bTime;
    });

    this.items.set(list);
  }

  markRead(id: string): void {
    const readIds = this.loadReadIds();
    readIds.add(id);
    this.saveReadIds(readIds);
    this.items.update(list => list.map(n => (n.id === id ? { ...n, read: true } : n)));
  }

  markAllRead(): void {
    const readIds = this.loadReadIds();
    for (const n of this.items()) readIds.add(n.id);
    this.saveReadIds(readIds);
    this.items.update(list => list.map(n => ({ ...n, read: true })));
  }

  private loadReadIds(): Set<string> {
    try {
      const raw = localStorage.getItem(READ_KEY);
      return new Set(raw ? JSON.parse(raw) as string[] : []);
    } catch {
      return new Set();
    }
  }

  private saveReadIds(ids: Set<string>): void {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  }
}
