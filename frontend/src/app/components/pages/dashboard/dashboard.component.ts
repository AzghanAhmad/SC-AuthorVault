import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { AuthService } from '../../../services/auth.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { ImportantDatesService, ImportantDate } from '../../../services/important-dates.service';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PageActionBarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  })
export class DashboardComponent implements OnInit {
  readonly vs = inject(AuthorVaultService);
  readonly auth = inject(AuthService);
  private readonly fileUpload = inject(FileUploadService);
  private readonly datesService = inject(ImportantDatesService);

  upcomingDates = signal<any[]>([]);
  editMode = signal(false);

  activeHoverSegment: 'draft' | 'editing' | 'preorder' | 'published' | null = null;

  ngOnInit() {
    this.loadUpcomingDates();
  }

  get stats() {
    return this.vs.pipelineStats();
  }

  get currentDay(): string {
    return new Date().getDate().toString();
  }

  get currentMonth(): string {
    return new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  loadUpcomingDates() {
    this.datesService.load().subscribe({
      next: list => {
        if (Array.isArray(list) && list.length > 0) {
          this.applyUpcomingDates(list);
        } else {
          this.upcomingDates.set([]);
        }
      },
      error: () => this.upcomingDates.set([])
    });
  }

  private applyUpcomingDates(list: ImportantDate[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mapped = list
      .map(d => {
        const due = new Date(d.dueDate + 'T00:00:00');
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...d,
          daysAway: diffDays,
          urgency: diffDays < 0 ? 'overdue' : diffDays <= 30 ? 'high' : diffDays <= 90 ? 'medium' : 'low'
        };
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);

    this.upcomingDates.set(mapped);
  }

  getDayNumber(dateStr: string): string {
    try {
      return new Date(dateStr + 'T00:00:00').getDate().toString();
    } catch {
      return '';
    }
  }

  getMonthAbbr(dateStr: string): string {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleString('default', { month: 'short' }).toUpperCase();
    } catch {
      return '';
    }
  }

  getCountdownLabel(daysAway: number): string {
    if (daysAway === 0) return 'Today';
    if (daysAway < 0) return 'Overdue';
    if (daysAway === 1) return 'Tomorrow';
    return `${daysAway} days left`;
  }

  initials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  countBooks(pn: any): number {
    return pn.series?.reduce((a: number, s: any) => a + (s.books?.length || 0), 0) || 0;
  }

  get companyInitials(): string {
    return this.initials(this.vs.company()?.identity?.legalName || '');
  }

  companyAvatarUrl(): string {
    const url = this.vs.company().identity.avatarUrl;
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    return this.fileUpload.resolveFileUrl(url);
  }

  hasCompany(): boolean {
    const identity = this.vs.company()?.identity;
    if (!identity) return false;
    const name = (identity.legalName || identity.dbaNames || '').trim();
    return name.length > 0 || (this.vs.company()?.imprints?.length ?? 0) > 0;
  }

  getPercentage(legalIsbn: any): number {
    const total = legalIsbn?.isbnBlockCount || 100;
    const assigned = legalIsbn?.isbnsAssigned || 0;
    return Math.min(100, Math.max(0, Math.round((assigned / total) * 100)));
  }

  getDashArray(legalIsbn: any): string {
    const pct = this.getPercentage(legalIsbn);
    return `${pct}, 100`;
  }

  onCompanyAvatar(event: Event): void {
    if (!this.editMode()) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.vs.setCompanyAvatar(reader.result as string);
      this.fileUpload.upload(file, 'company-avatar').subscribe({
        next: uploaded => {
          const resolvedUrl = this.fileUpload.resolveFileUrl(uploaded.url);
          this.vs.patchIdentity({ avatarUrl: resolvedUrl, avatarFileId: uploaded.id });
        },
        error: () => alert('Logo upload failed. Preview shown but may not persist after reload.'),
      });
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  onImprintAvatar(event: Event, imprintId: string): void {
    if (!this.editMode()) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.vs.setImprintAvatar(imprintId, reader.result as string);
    reader.readAsDataURL(file);
  }

  onPenNameAvatar(event: Event, penNameId: string): void {
    if (!this.editMode()) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.vs.setPenNameAvatar(penNameId, reader.result as string);
    reader.readAsDataURL(file);
  }

  deleteCompanyTree(): void {
    if (!confirm('Delete your entire company tree (imprints, pen names, series, and books)? This cannot be undone.')) return;
    this.vs.resetCompany();
    this.editMode.set(false);
  }
}
