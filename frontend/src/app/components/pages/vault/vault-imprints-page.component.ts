import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { Imprint } from '../../../models/author-vault.model';

@Component({
  selector: 'app-vault-imprints-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../company-vault/company-vault.component.css'],
  template: `
    <div class="page">

      <!-- ── IMPRINT LIST (no selection) ── -->
      @if (!selected()) {
        <div class="page-header">
          <h1 class="page-title">📚 Imprints</h1>
          <p class="page-subtitle">Publishing brands under {{ company().identity.legalName }}</p>
        </div>

        <!-- Summary stats -->
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value">{{ allImprints().length }}</div><div class="stat-label">Imprints</div></div>
          <div class="stat-card"><div class="stat-value">{{ totalPenNames }}</div><div class="stat-label">Pen Names</div></div>
          <div class="stat-card"><div class="stat-value">{{ totalBooks }}</div><div class="stat-label">Books</div></div>
          <div class="stat-card"><div class="stat-value">{{ totalISBNsRemaining }}</div><div class="stat-label">ISBNs Remaining</div></div>
        </div>

        <!-- Imprint cards -->
        <div class="imprint-grid">
          @for (imp of allImprints(); track imp.id) {
            <div class="imprint-hero-card" (click)="selectImprint(imp)">
              <!-- Logo area -->
              <div class="imprint-logo-area">
                <div class="imprint-logo-placeholder">
                  <svg viewBox="0 0 48 48" fill="none">
                    <rect width="48" height="48" rx="14" fill="rgba(139,92,246,0.12)"/>
                    <path d="M12 38V18l12-10 12 10v20H12z" stroke="#8b5cf6" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M20 38V28h8v10" stroke="#8b5cf6" stroke-width="2" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="imprint-hero-info">
                  <h2 class="imprint-hero-name">{{ imp.identity.name }}</h2>
                  <p class="imprint-hero-focus">{{ imp.identity.purposeGenreFocus }}</p>
                  <span class="status status-green">{{ imp.identity.status }}</span>
                </div>
              </div>

              <!-- Pen name avatars -->
              <div class="pen-name-avatars">
                @for (pn of imp.penNames; track pn.id) {
                  <div class="pn-avatar" [title]="pn.identity.displayName">
                    {{ initials(pn.identity.displayName) }}
                  </div>
                }
              </div>

              <!-- Stats bar -->
              <div class="imprint-stats-bar">
                <div class="istat"><span class="istat-val">{{ imp.penNames.length }}</span><span class="istat-lbl">Pen Names</span></div>
                <div class="istat"><span class="istat-val">{{ countBooks(imp) }}</span><span class="istat-lbl">Books</span></div>
                <div class="istat"><span class="istat-val">{{ imp.legalIsbn.isbnsAssigned }}</span><span class="istat-lbl">ISBNs Used</span></div>
                <div class="istat"><span class="istat-val">{{ imp.legalIsbn.isbnsRemaining }}</span><span class="istat-lbl">ISBNs Left</span></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── SELECTED IMPRINT DETAIL ── -->
      @if (selected(); as imp) {
        <!-- Header with logo + pen name avatars -->
        <div class="imprint-detail-header">
          <button class="back-btn" (click)="selected.set(null); activeTab.set('identity')">← All Imprints</button>
          <div class="imprint-logo-area" style="margin-top:.75rem">
            <div class="imprint-logo-placeholder">
              <svg viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="rgba(139,92,246,0.12)"/>
                <path d="M12 38V18l12-10 12 10v20H12z" stroke="#8b5cf6" stroke-width="2" stroke-linejoin="round"/>
                <path d="M20 38V28h8v10" stroke="#8b5cf6" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 class="page-title" style="margin:0 0 .25rem">{{ imp.identity.name }}</h1>
              <p class="page-subtitle" style="margin:0">{{ imp.identity.purposeGenreFocus }} · <span class="status status-green">{{ imp.identity.status }}</span></p>
            </div>
          </div>
          <!-- Pen name avatars row -->
          <div class="pen-name-avatars" style="margin-top:.75rem">
            @for (pn of imp.penNames; track pn.id) {
              <div class="pn-avatar-lg" [title]="pn.identity.displayName">
                <div class="pna-circle">{{ initials(pn.identity.displayName) }}</div>
                <span class="pna-name">{{ pn.identity.displayName }}</span>
              </div>
            }
          </div>
          <!-- Stats bar -->
          <div class="imprint-stats-bar" style="margin-top:.75rem">
            <div class="istat"><span class="istat-val">{{ imp.penNames.length }}</span><span class="istat-lbl">Pen Names</span></div>
            <div class="istat"><span class="istat-val">{{ countBooks(imp) }}</span><span class="istat-lbl">Books</span></div>
            <div class="istat"><span class="istat-val">{{ imp.legalIsbn.isbnBlockCount }}</span><span class="istat-lbl">ISBN Block</span></div>
            <div class="istat"><span class="istat-val">{{ imp.legalIsbn.isbnsAssigned }}</span><span class="istat-lbl">ISBNs Used</span></div>
            <div class="istat"><span class="istat-val">{{ imp.legalIsbn.isbnsRemaining }}</span><span class="istat-lbl">ISBNs Left</span></div>
          </div>
        </div>

        <!-- Tab nav -->
        <div class="vault-layout" style="margin-top:1.25rem">
          <nav class="vault-nav">
            @for (t of tabs; track t.id) {
              <button class="tab-item" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">{{ t.label }}</button>
            }
          </nav>

          <div class="vault-content">

            <!-- Identity -->
            @if (activeTab() === 'identity') {
              <div class="card">
                <h3 class="section-title">Imprint Identity</h3>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Name</span><div class="form-value">{{ imp.identity.name }}</div></div>
                  <div class="form-group"><span class="form-label">Parent Company</span><div class="form-value">{{ company().identity.legalName }}</div></div>
                  <div class="form-group"><span class="form-label">Genre Focus</span><div class="form-value">{{ imp.identity.purposeGenreFocus }}</div></div>
                  <div class="form-group"><span class="form-label">Status</span><div class="form-value"><span class="status status-green">{{ imp.identity.status }}</span></div></div>
                  <div class="form-group"><span class="form-label">Date Established</span><div class="form-value">{{ imp.identity.dateEstablished }}</div></div>
                  <div class="form-group"><span class="form-label">Website</span><div class="form-value"><a [href]="imp.identity.website" target="_blank" style="color:var(--accent-blue)">{{ imp.identity.website }}</a></div></div>
                  <div class="form-group"><span class="form-label">Email</span><div class="form-value">{{ imp.identity.email }}</div></div>
                  <div class="form-group"><span class="form-label">DBA Registration</span><div class="form-value">{{ imp.legalIsbn.dbaRegistration || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Trademark</span><div class="form-value">{{ imp.legalIsbn.trademark }}</div></div>
                </div>
              </div>
              <div class="card">
                <h3 class="section-title">Logo File</h3>
                <div class="logo-upload-area">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40" style="color:var(--text-muted)">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><path d="m3 15 5-5 4 4 3-3 6 6"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                  </svg>
                  <p style="color:var(--text-muted);font-size:.875rem;margin:.5rem 0 0">Drag & drop logo files here, or click to upload</p>
                  <p style="color:var(--text-muted);font-size:.75rem;margin:.25rem 0 0">PNG, SVG, EPS, PDF — all formats</p>
                </div>
              </div>
              <div class="card">
                <h3 class="section-title">Templates</h3>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Copyright Page Template</span><div class="form-value">{{ imp.legalIsbn.copyrightPageTemplate }}</div></div>
                  <div class="form-group"><span class="form-label">Contract Template</span><div class="form-value">contract-template-{{ imp.identity.name | lowercase }}.docx</div></div>
                </div>
              </div>
            }

            <!-- Pen Names -->
            @if (activeTab() === 'pennames') {
              <div class="card">
                <h3 class="section-title">Pen Names under {{ imp.identity.name }}</h3>
                <div class="entity-list">
                  @for (pn of imp.penNames; track pn.id) {
                    <div class="entity-card" (click)="goTo('/vault/pen-names')">
                      <div class="entity-card-header">
                        <h3 class="entity-name">✍️ {{ pn.identity.displayName }}</h3>
                        <span class="status status-green">{{ pn.identity.status }}</span>
                      </div>
                      <p class="entity-meta">{{ pn.identity.genre }} · {{ pn.identity.penNameType }}</p>
                      <div class="entity-stats">
                        <span class="entity-stat"><strong>{{ pn.series.length }}</strong> Series</span>
                        <span class="entity-stat"><strong>{{ countPenNameBooks(pn) }}</strong> Books</span>
                        <span class="entity-stat"><strong>{{ pn.onlinePresence.subscriberCount | number }}</strong> Subscribers</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- ISBNs -->
            @if (activeTab() === 'isbns') {
              <div class="stats-row" style="margin-bottom:1rem">
                <div class="stat-card"><div class="stat-value">{{ imp.legalIsbn.isbnBlockCount }}</div><div class="stat-label">Block Size</div></div>
                <div class="stat-card"><div class="stat-value">{{ imp.legalIsbn.isbnsAssigned }}</div><div class="stat-label">Assigned</div></div>
                <div class="stat-card"><div class="stat-value">{{ imp.legalIsbn.isbnsRemaining }}</div><div class="stat-label">Remaining</div></div>
              </div>
              <div class="card">
                <h3 class="section-title">ISBN Block Details</h3>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">ISBN Prefix</span><div class="form-value" style="font-family:monospace">{{ imp.legalIsbn.isbnPrefix }}</div></div>
                  <div class="form-group"><span class="form-label">Block Purchased</span><div class="form-value" style="font-family:monospace">{{ imp.legalIsbn.isbnBlockPurchased }}</div></div>
                  <div class="form-group"><span class="form-label">Block Count</span><div class="form-value">{{ imp.legalIsbn.isbnBlockCount }}</div></div>
                  <div class="form-group"><span class="form-label">Assigned</span><div class="form-value">{{ imp.legalIsbn.isbnsAssigned }}</div></div>
                  <div class="form-group"><span class="form-label">Remaining</span><div class="form-value" style="color:var(--success);font-weight:700">{{ imp.legalIsbn.isbnsRemaining }}</div></div>
                  <div class="form-group"><span class="form-label">Trademark</span><div class="form-value">{{ imp.legalIsbn.trademark }}</div></div>
                </div>
              </div>
              <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                  <h3 class="section-title" style="margin:0">ISBN Master List — {{ imp.identity.name }}</h3>
                  <div style="display:flex;gap:.5rem">
                    <select [(ngModel)]="isbnFilter" style="padding:.35rem .6rem;border:1px solid var(--border-color);border-radius:6px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit;">
                      <option value="">All</option><option value="used">Used</option><option value="unused">Available</option><option value="reserved">Reserved</option>
                    </select>
                  </div>
                </div>
                <table class="data-table">
                  <thead><tr><th>ISBN</th><th>Format</th><th>Assigned To</th><th>Series</th><th>Pub Date</th><th>Status</th></tr></thead>
                  <tbody>
                    @for (r of getImprintIsbns(imp); track r.isbn) {
                      <tr>
                        <td style="font-family:monospace;font-size:.8125rem">{{ r.isbn }}</td>
                        <td><span class="tag">{{ r.format }}</span></td>
                        <td class="td-primary">{{ r.title || '—' }}</td>
                        <td class="td-muted">{{ r.series || '—' }}</td>
                        <td class="td-muted">{{ r.pubDate || '—' }}</td>
                        <td><span class="status" [ngClass]="r.status==='used'?'status-green':r.status==='reserved'?'status-amber':'status-blue'">{{ r.status }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
                <p style="font-size:.75rem;color:var(--text-muted);margin-top:.75rem;padding:.5rem .75rem;background:rgba(245,158,11,.06);border-radius:6px;border-left:3px solid #f59e0b">
                  ⚠️ ISBNs are assigned per format. Once assigned and published, they cannot be changed. Each format (Paperback 6x9, Hardcover, Audio, etc.) requires its own ISBN. Translations also require separate ISBNs.
                </p>
              </div>
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .imprint-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }
    .imprint-hero-card {
      background: var(--surface); border: 1px solid var(--border-light); border-radius: 16px;
      padding: 1.5rem; cursor: pointer; transition: all .25s; box-shadow: var(--shadow-sm);
    }
    .imprint-hero-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); border-color: rgba(139,92,246,.3); }
    .imprint-logo-area { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .imprint-logo-placeholder svg { width: 52px; height: 52px; flex-shrink: 0; }
    .imprint-hero-name { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .2rem; }
    .imprint-hero-focus { font-size: .8125rem; color: var(--text-muted); margin: 0 0 .4rem; }
    .pen-name-avatars { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .875rem; }
    .pn-avatar {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 12px; cursor: default;
    }
    .pn-avatar-lg { display: flex; flex-direction: column; align-items: center; gap: .3rem; }
    .pna-circle {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 14px;
    }
    .pna-name { font-size: .6875rem; color: var(--text-muted); white-space: nowrap; }
    .imprint-stats-bar { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .istat { display: flex; flex-direction: column; }
    .istat-val { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1.1; }
    .istat-lbl { font-size: .6875rem; color: var(--text-muted); }
    .imprint-detail-header { background: var(--surface); border: 1px solid var(--border-light); border-radius: 16px; padding: 1.5rem; box-shadow: var(--shadow-sm); }
    .logo-upload-area {
      border: 2px dashed var(--border-color); border-radius: 12px; padding: 2rem;
      text-align: center; cursor: pointer; transition: border-color .2s;
    }
    .logo-upload-area:hover { border-color: var(--accent-blue); }
    .td-muted { color: var(--text-muted); font-size: .8125rem; }
  `]
})
export class VaultImprintsPageComponent {
  private vs = inject(AuthorVaultService);
  private router = inject(Router);
  company = this.vs.company;
  allImprints = computed(() => this.company().imprints);
  selected = signal<Imprint | null>(null);
  activeTab = signal('identity');
  isbnFilter = '';

  tabs = [
    { id: 'identity', label: '🏢 Identity' },
    { id: 'pennames', label: '✍️ Pen Names' },
    { id: 'isbns',    label: '🔢 ISBNs' },
  ];

  get totalPenNames() { return this.allImprints().reduce((a, i) => a + i.penNames.length, 0); }
  get totalBooks() { return this.allImprints().reduce((a, i) => a + i.penNames.reduce((b, p) => b + p.series.reduce((c, s) => c + s.books.length, 0), 0), 0); }
  get totalISBNsRemaining() { return this.allImprints().reduce((a, i) => a + i.legalIsbn.isbnsRemaining, 0); }

  countBooks(imp: Imprint): number {
    return imp.penNames.reduce((a, p) => a + p.series.reduce((b, s) => b + s.books.length, 0), 0);
  }
  countPenNameBooks(pn: any): number {
    return pn.series.reduce((a: number, s: any) => a + s.books.length, 0);
  }
  initials(name: string): string {
    const p = name.trim().split(' ');
    return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  }
  selectImprint(imp: Imprint) { this.selected.set(imp); this.activeTab.set('identity'); }
  goTo(r: string) { this.router.navigate([r]); }

  // Mock ISBN data per imprint
  private allIsbns = [
    { isbn: '979-8-XXXX-0001-0', format: 'Ebook', title: 'The Midnight Library', series: 'Hearts of Manhattan', pubDate: '2023-06-15', imprintId: 'imp1', status: 'used' },
    { isbn: '979-8-XXXX-0001-1', format: 'Paperback 5.5x8.5', title: 'The Midnight Library', series: 'Hearts of Manhattan', pubDate: '2023-06-15', imprintId: 'imp1', status: 'used' },
    { isbn: '979-8-XXXX-0001-3', format: 'Audiobook', title: 'The Midnight Library', series: 'Hearts of Manhattan', pubDate: '2023-09-01', imprintId: 'imp1', status: 'used' },
    { isbn: '979-8-XXXX-0002-0', format: 'Ebook', title: 'Shadow Protocol', series: 'Hearts of Manhattan', pubDate: '2023-11-01', imprintId: 'imp1', status: 'used' },
    { isbn: '979-8-XXXX-0002-1', format: 'Paperback 5.5x8.5', title: 'Shadow Protocol', series: 'Hearts of Manhattan', pubDate: '2023-11-01', imprintId: 'imp1', status: 'used' },
    { isbn: '979-8-XXXX-0003-0', format: 'Ebook', title: 'Garden of Stars', series: 'Hearts of Manhattan', pubDate: '', imprintId: 'imp1', status: 'reserved' },
    { isbn: '979-8-XXXX-0003-1', format: 'Paperback 5.5x8.5', title: 'Garden of Stars', series: 'Hearts of Manhattan', pubDate: '', imprintId: 'imp1', status: 'reserved' },
    { isbn: '979-8-XXXX-0007-0', format: 'Ebook', title: '', series: '', pubDate: '', imprintId: 'imp1', status: 'unused' },
    { isbn: '979-8-XXXX-0007-1', format: 'Paperback 6x9', title: '', series: '', pubDate: '', imprintId: 'imp1', status: 'unused' },
    { isbn: '979-8-XXXX-0008-0', format: 'Ebook', title: '', series: '', pubDate: '', imprintId: 'imp2', status: 'unused' },
    { isbn: '979-8-XXXX-0004-0', format: 'Ebook', title: 'The Quantified Self', series: 'Standalone', pubDate: '2025-03-20', imprintId: 'imp2', status: 'used' },
    { isbn: '979-8-XXXX-0004-1', format: 'Paperback 6x9', title: 'The Quantified Self', series: 'Standalone', pubDate: '2025-03-20', imprintId: 'imp2', status: 'used' },
  ];

  getImprintIsbns(imp: Imprint) {
    return this.allIsbns.filter(r =>
      r.imprintId === imp.id &&
      (!this.isbnFilter || r.status === this.isbnFilter)
    );
  }
}
