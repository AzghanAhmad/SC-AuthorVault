import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { BookService } from '../../../services/book.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">AuthorVault Overview</h1>
          <p class="page-subtitle">A live snapshot of your publishing vault. Navigate via the sidebar to manage anything.</p>
        </div>
      </div>

      <!-- ── TIER 1: Company ── -->
      <div class="tier tier-1">
        <div class="tier-label">Company</div>
        <div class="company-card">
          <div class="company-logo">
            <svg viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="rgba(59,130,246,0.12)"/>
              <path d="M12 40V20l12-10 12 10v20H12z" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/>
              <path d="M20 40V30h8v10" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="company-info">
            <h2 class="company-name">{{ vs.company().identity.legalName }}</h2>
            <div class="company-meta">
              <span class="meta-chip">{{ vs.company().identity.entityType }}</span>
              <span class="meta-chip">{{ vs.company().identity.stateOfIncorporation }}</span>
              <span class="meta-chip status-active">{{ vs.company().identity.companyStatus }}</span>
            </div>
            <p class="company-detail">{{ vs.company().identity.primaryEmail }} · {{ vs.company().identity.website }}</p>
          </div>
        </div>
      </div>

      <!-- connector -->
      <div class="tier-connector"><div class="connector-line"></div></div>

      <!-- ── TIER 2: Imprints ── -->
      <div class="tier tier-2">
        <div class="tier-label">Imprints</div>
        <div class="imprint-row">
          <div class="imprint-card" *ngFor="let imp of vs.company().imprints">
            <div class="imprint-logo">
              <svg viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="rgba(139,92,246,0.12)"/>
                <path d="M8 28V14l10-8 10 8v14H8z" stroke="#8b5cf6" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M15 28v-6h6v6" stroke="#8b5cf6" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="imprint-info">
              <div class="imprint-name">{{ imp.identity.name }}</div>
              <div class="imprint-focus">{{ imp.identity.purposeGenreFocus }}</div>
              <div class="imprint-stats">
                <span>{{ imp.penNames.length }} pen name{{ imp.penNames.length !== 1 ? 's' : '' }}</span>
                <span class="dot">·</span>
                <span>{{ imp.legalIsbn.isbnsRemaining }} ISBNs left</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- connector -->
      <div class="tier-connector"><div class="connector-line"></div></div>

      <!-- ── TIER 3: Pen Names ── -->
      <div class="tier tier-3">
        <div class="tier-label">Pen Names</div>
        <div class="penname-row">
          <ng-container *ngFor="let imp of vs.company().imprints">
            <div class="penname-card" *ngFor="let pn of imp.penNames">
              <div class="penname-avatar">{{ initials(pn.identity.displayName) }}</div>
              <div class="penname-info">
                <div class="penname-name">{{ pn.identity.displayName }}</div>
                <div class="penname-genre">{{ pn.identity.genre }}</div>
                <div class="penname-sub">{{ pn.series.length }} series · {{ countBooks(pn) }} books</div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- connector -->
      <div class="tier-connector"><div class="connector-line"></div></div>

      <!-- ── TIER 4: Stats Row ── -->
      <div class="tier tier-4">
        <div class="tier-label">Library Stats</div>
        <div class="stats-grid">
          <div class="stat-card blue">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m12 2 10 6.5-10 6.5L2 8.5Z"/>
                <path d="m2 15.5 10 6.5 10-6.5"/>
                <path d="m2 12 10 6.5L22 12"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ vs.totalSeries() }}</span>
              <span class="stat-label">Series</span>
            </div>
          </div>
          <div class="stat-card indigo">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ vs.totalBooks() }}</span>
              <span class="stat-label">Total Books</span>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ publishedCount() }}</span>
              <span class="stat-label">Published</span>
            </div>
          </div>
          <div class="stat-card amber">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ draftCount() }}</span>
              <span class="stat-label">In Draft</span>
            </div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ vs.totalPenNames() }}</span>
              <span class="stat-label">Pen Names</span>
            </div>
          </div>
          <div class="stat-card teal">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ vs.totalImprints() }}</span>
              <span class="stat-label">Imprints</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Quick Nav hint ── -->
      <div class="nav-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Use the sidebar to navigate to <strong>Company</strong> or <strong>Library</strong> to manage your vault.
      </div>
    </div>
  `,
  styles: [`
    .page { width: 100%; animation: fadeInUp .5s ease both; }

    .page-header { margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .25rem; }
    .page-subtitle { font-size: .9375rem; color: var(--text-muted); margin: 0; }

    /* ── Tier wrapper ── */
    .tier { width: 100%; margin-bottom: 0; }
    .tier-label {
      font-size: .6875rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .08em; color: var(--text-muted); margin-bottom: .875rem;
    }

    /* Connector */
    .tier-connector { display: flex; justify-content: center; padding: .375rem 0; }
    .connector-line { width: 2px; height: 24px; background: var(--border-color); border-radius: 2px; }

    /* ── Company Card — full width ── */
    .company-card {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 1.5rem;
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 18px;
      padding: 1.75rem 2rem;
      box-shadow: var(--shadow-sm);
    }
    .company-logo svg { width: 60px; height: 60px; flex-shrink: 0; }
    .company-name { font-size: 1.375rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .5rem; }
    .company-meta { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .4rem; }
    .meta-chip {
      font-size: .6875rem; font-weight: 600; padding: 3px 10px;
      border-radius: 100px; background: var(--primary-light);
      border: 1px solid var(--border-color); color: var(--text-secondary);
    }
    .status-active { background: rgba(16,185,129,.1); color: #059669; border-color: rgba(16,185,129,.2); }
    .company-detail { font-size: .8125rem; color: var(--text-muted); margin: 0; }

    /* ── Imprints — equal columns ── */
    .imprint-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      width: 100%;
    }
    .imprint-card {
      display: flex; align-items: center; gap: 1rem;
      background: var(--surface); border: 1px solid var(--border-light);
      border-radius: 14px; padding: 1.125rem 1.25rem; box-shadow: var(--shadow-sm);
      transition: box-shadow .2s, transform .2s;
    }
    .imprint-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .imprint-logo svg { width: 42px; height: 42px; flex-shrink: 0; }
    .imprint-name { font-size: .9375rem; font-weight: 700; color: var(--text-primary); margin-bottom: .2rem; }
    .imprint-focus { font-size: .8125rem; color: var(--text-muted); margin-bottom: .4rem; }
    .imprint-stats { font-size: .75rem; color: var(--text-secondary); display: flex; align-items: center; gap: .375rem; }
    .dot { color: var(--text-muted); }

    /* ── Pen Names — equal columns ── */
    .penname-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: .875rem;
      width: 100%;
    }
    .penname-card {
      display: flex; align-items: center; gap: .875rem;
      background: var(--surface); border: 1px solid var(--border-light);
      border-radius: 12px; padding: 1rem 1.125rem; box-shadow: var(--shadow-sm);
      transition: box-shadow .2s, transform .2s;
    }
    .penname-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .penname-avatar {
      width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 14px;
    }
    .penname-name { font-size: .875rem; font-weight: 600; color: var(--text-primary); }
    .penname-genre { font-size: .75rem; color: var(--text-muted); margin: .15rem 0; }
    .penname-sub { font-size: .75rem; color: var(--text-secondary); }

    /* ── Stats Grid — 6 equal columns ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 1rem;
      width: 100%;
    }
    .stat-card {
      background: var(--surface); border: 1px solid var(--border-light);
      border-radius: 14px; padding: 1.25rem 1rem;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; gap: .625rem;
      box-shadow: var(--shadow-sm); transition: all .25s;
    }
    .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }
    .stat-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon svg { width: 20px; height: 20px; }
    .stat-body { display: flex; flex-direction: column; align-items: center; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); line-height: 1.1; }
    .stat-label { font-size: .75rem; color: var(--text-muted); margin-top: .2rem; }

    .stat-card.blue .stat-icon   { background: rgba(59,130,246,.1);  color: #3b82f6; }
    .stat-card.indigo .stat-icon { background: rgba(99,102,241,.1);  color: #6366f1; }
    .stat-card.green .stat-icon  { background: rgba(16,185,129,.1);  color: #10b981; }
    .stat-card.amber .stat-icon  { background: rgba(245,158,11,.1);  color: #f59e0b; }
    .stat-card.purple .stat-icon { background: rgba(139,92,246,.1);  color: #8b5cf6; }
    .stat-card.teal .stat-icon   { background: rgba(20,184,166,.1);  color: #14b8a6; }

    /* Nav hint */
    .nav-hint {
      display: flex; align-items: center; gap: .5rem;
      margin-top: 2rem; padding: .875rem 1.25rem;
      background: var(--primary-light); border: 1px solid var(--border-color);
      border-radius: 12px; font-size: .8125rem; color: var(--text-secondary);
    }
    .nav-hint strong { color: var(--text-primary); }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Responsive ── */
    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
      .imprint-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .company-card { grid-template-columns: 1fr; }
      .imprint-row { grid-template-columns: 1fr; }
      .penname-row { grid-template-columns: repeat(2, 1fr); }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 400px) {
      .penname-row { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly vs = inject(AuthorVaultService);
  private bookService = inject(BookService);

  publishedCount = signal(0);
  draftCount = signal(0);

  ngOnInit() {
    this.bookService.getBooks().subscribe(books => {
      this.publishedCount.set(books.filter(b => b.status === 'published').length);
      this.draftCount.set(books.filter(b => b.status === 'draft').length);
    });
  }

  initials(name: string): string {
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  countBooks(pn: any): number {
    return pn.series.reduce((a: number, s: any) => a + s.books.length, 0);
  }
}
