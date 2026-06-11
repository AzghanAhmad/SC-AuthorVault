import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { BookFormat } from '../../../models/author-vault.model';

interface FormatWithContext extends BookFormat {
  bookTitle: string;
  language: string;
  seriesName: string;
  penName: string;
}

@Component({
  selector: 'app-vault-formats-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../company-vault/company-vault.component.css'],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-title-wrap">
          <svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <h1 class="page-title" style="margin:0;">Formats</h1>
        </div>
        <p class="page-subtitle">Every format is listed by book. Use the filters to drill down by title, language, format type, or platform.</p>
      </div>

      <!-- ── Multi-dropdown filter bar ── -->
      <div class="filter-panel">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Title</label>
            <select [(ngModel)]="filterTitle" (change)="onFilterChange()" class="filter-sel">
              <option value="">All Titles</option>
              @for (t of uniqueTitles; track t) { <option [value]="t">{{ t }}</option> }
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Language</label>
            <select [(ngModel)]="filterLanguage" (change)="onFilterChange()" class="filter-sel">
              <option value="">All Languages</option>
              @for (l of uniqueLanguages; track l) { <option [value]="l">{{ l }}</option> }
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Format</label>
            <select [(ngModel)]="filterFormat" (change)="onFilterChange()" class="filter-sel">
              <option value="">All Formats</option>
              @for (f of uniqueFormats; track f) { <option [value]="f">{{ f }}</option> }
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Platform</label>
            <select [(ngModel)]="filterPlatform" (change)="onFilterChange()" class="filter-sel">
              <option value="">All Platforms</option>
              @for (p of uniquePlatforms; track p) { <option [value]="p">{{ p }}</option> }
            </select>
          </div>
          <button class="filter-go" (click)="applyFilters()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            Go
          </button>
          @if (hasActiveFilters) {
            <button class="filter-clear" (click)="clearFilters()">✕ Clear</button>
          }
        </div>
        @if (hasActiveFilters) {
          <div class="active-filters">
            @if (filterTitle) { <span class="filter-chip">Title: {{ filterTitle }}</span> }
            @if (filterLanguage) { <span class="filter-chip">Language: {{ filterLanguage }}</span> }
            @if (filterFormat) { <span class="filter-chip">Format: {{ filterFormat }}</span> }
            @if (filterPlatform) { <span class="filter-chip">Platform: {{ filterPlatform }}</span> }
          </div>
        }
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{ filteredFormats().length }}</div><div class="stat-label">Formats Shown</div></div>
        <div class="stat-card"><div class="stat-value">{{ liveCount }}</div><div class="stat-label">Live</div></div>
        <div class="stat-card"><div class="stat-value">{{ draftCount }}</div><div class="stat-label">Draft</div></div>
        <div class="stat-card"><div class="stat-value">{{ totalVariants }}</div><div class="stat-label">Platform Variants</div></div>
      </div>

      <!-- Format list grouped by book -->
      @if (!selected()) {
        @for (group of groupedFormats(); track group.bookTitle) {
          <div class="book-group">
            <div class="book-group-header">
              <div class="book-group-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                {{ group.bookTitle }}
              </div>
              <span class="book-group-meta">{{ group.seriesName }} · {{ group.penName }}</span>
            </div>
            <table class="data-table">
              <thead>
                <tr><th>Format</th><th>Language</th><th>Status</th><th>Version</th><th>Trim / Runtime</th><th>File Size</th><th>Platforms</th></tr>
              </thead>
              <tbody>
                @for (f of group.formats; track f.id) {
                  <tr class="clickable-row" (click)="selectItem(f)">
                    <td><span class="tag">{{ f.specs.formatType }}</span></td>
                    <td>{{ f.language }}</td>
                    <td><span class="status" [ngClass]="f.specs.status==='Live'?'status-green':f.specs.status==='Ready'?'status-blue':'status-amber'">{{ f.specs.status }}</span></td>
                    <td>v{{ f.specs.versionNumber }}</td>
                    <td>{{ f.specs.trimSize || f.specs.audioRuntime || '—' }}</td>
                    <td>{{ f.specs.fileSize || '—' }}</td>
                    <td>{{ f.platformVariants.length }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @if (filteredFormats().length === 0) {
          <div class="empty-state" style="text-align:center;padding:3rem;color:var(--text-muted)">
            <p>No formats match your filters. <button (click)="clearFilters()" style="background:none;border:none;color:var(--accent-blue);cursor:pointer;font-family:inherit;font-size:inherit">Clear filters</button></p>
          </div>
        }
      }

      <!-- Format detail -->
      @if (selected(); as f) {
        <button class="back-btn" (click)="selected.set(null); tab.set('specs')">← All Formats</button>
        <div style="margin:.75rem 0 1rem;padding:.875rem 1rem;background:var(--primary-light);border-radius:10px;font-size:.875rem;color:var(--text-secondary);display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          <strong style="color:var(--text-primary)">{{ f.bookTitle }}</strong>
          <span>·</span><span class="tag">{{ f.specs.formatType }}</span>
          <span>·</span><span>{{ f.language }}</span>
          @if (f.seriesName) { <span>· {{ f.seriesName }}</span> }
        </div>

        <div class="vault-layout">
          <nav class="vault-nav">
            @for (t of tabs; track t.id) {
              <button class="tab-item" [class.active]="tab() === t.id" (click)="tab.set(t.id)">
                @switch (t.id) {
                  @case ('specs') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M6 6h10M6 10h10"/></svg>
                  }
                  @case ('kdpselect') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
                  }
                  @case ('pricing') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  }
                  @case ('variants') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  }
                  @case ('logs') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  }
                }
                {{ t.label }}
              </button>
            }
          </nav>
          <div class="vault-content">

            @if (tab() === 'specs') {
              <div class="card">
                <h3 class="section-title">{{ f.specs.formatType }} Specs</h3>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Format Type</span><div class="form-value">{{ f.specs.formatType }}</div></div>
                  <div class="form-group"><span class="form-label">Status</span><div class="form-value"><span class="status" [ngClass]="f.specs.status==='Live'?'status-green':'status-amber'">{{ f.specs.status }}</span></div></div>
                  <div class="form-group"><span class="form-label">Version</span><div class="form-value">v{{ f.specs.versionNumber }}</div></div>
                  <div class="form-group"><span class="form-label">Release Date</span><div class="form-value">{{ f.specs.releaseDate || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Word Count</span><div class="form-value">{{ f.specs.wordCount | number }}</div></div>
                  <div class="form-group"><span class="form-label">Page Count</span><div class="form-value">{{ f.specs.pageCount }}</div></div>
                  <div class="form-group"><span class="form-label">File Size</span><div class="form-value">{{ f.specs.fileSize || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">DRM</span><div class="form-value">{{ f.specs.drmPreference || '—' }}</div></div>
                  @if (f.specs.trimSize) { <div class="form-group"><span class="form-label">Trim Size</span><div class="form-value">{{ f.specs.trimSize }}</div></div> }
                  @if (f.specs.paperType) { <div class="form-group"><span class="form-label">Paper Type</span><div class="form-value">{{ f.specs.paperType }}</div></div> }
                  @if (f.specs.bindingType) { <div class="form-group"><span class="form-label">Binding</span><div class="form-value">{{ f.specs.bindingType }}</div></div> }
                  @if (f.specs.printFinish) { <div class="form-group"><span class="form-label">Print Finish</span><div class="form-value">{{ f.specs.printFinish }}</div></div> }
                  @if (f.specs.interiorType) { <div class="form-group"><span class="form-label">Interior</span><div class="form-value">{{ f.specs.interiorType }}</div></div> }
                  @if (f.specs.audioRuntime) { <div class="form-group"><span class="form-label">Audio Runtime</span><div class="form-value">{{ f.specs.audioRuntime }}</div></div> }
                  @if (f.specs.deliveryMethod) { <div class="form-group"><span class="form-label">Delivery Method</span><div class="form-value">{{ f.specs.deliveryMethod }}</div></div> }
                </div>
              </div>
            }

            @if (tab() === 'kdpselect') {
              <div class="card">
                <h3 class="section-title">KDP Select Enrollment</h3>
                @if (f.kdpSelect) {
                  <div class="form-grid">
                    <div class="form-group"><span class="form-label">Status</span><div class="form-value">{{ f.kdpSelect.enrollmentStatus }}</div></div>
                    <div class="form-group"><span class="form-label">Auto-Renew</span><div class="form-value">{{ f.kdpSelect.autoRenew ? 'On' : 'Off' }}</div></div>
                    <div class="form-group"><span class="form-label">Period Start</span><div class="form-value">{{ f.kdpSelect.periodStart }}</div></div>
                    <div class="form-group"><span class="form-label">Period End</span><div class="form-value">{{ f.kdpSelect.periodEnd }}</div></div>
                    <div class="form-group"><span class="form-label">KENP Pages</span><div class="form-value">{{ f.kdpSelect.kenpPages | number }}</div></div>
                    <div class="form-group"><span class="form-label">KENP Revenue</span><div class="form-value">{{ f.kdpSelect.kenpRevenue }}</div></div>
                    <div class="form-group"><span class="form-label">Countdown Deals Used</span><div class="form-value">{{ f.kdpSelect.countdownDealUsed ? 'Yes' : 'No' }}</div></div>
                    <div class="form-group"><span class="form-label">Free Days Used</span><div class="form-value">{{ f.kdpSelect.freeDaysUsed ? 'Yes' : 'No' }}</div></div>
                  </div>
                } @else {
                  <div class="empty-state">
                    <div class="empty-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="40" height="40" style="color:var(--text-muted)">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="9" y1="9" x2="15" y2="9"/>
                        <line x1="9" y1="13" x2="15" y2="13"/>
                        <line x1="9" y1="17" x2="13" y2="17"/>
                      </svg>
                    </div>
                    <p>Not enrolled in KDP Select</p>
                  </div>
                }
              </div>
            }

            @if (tab() === 'pricing') {
              <div class="card">
                <h3 class="section-title">Pricing History</h3>
                <table class="data-table">
                  <thead><tr><th>Regular</th><th>Launch</th><th>Pre-Order</th><th>Sale</th><th>Currency</th><th>Start Date</th><th>Reason</th></tr></thead>
                  <tbody>
                    @for (p of f.pricingHistory; track p.startDate) {
                      <tr>
                        <td class="td-primary">{{ p.regularPrice }}</td>
                        <td>{{ p.launchPrice || '—' }}</td>
                        <td>{{ p.preOrderPrice || '—' }}</td>
                        <td>{{ p.salePrice || '—' }}</td>
                        <td>{{ p.currency }}</td>
                        <td>{{ p.startDate }}</td>
                        <td>{{ p.reason || '—' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            @if (tab() === 'variants') {
              <div class="card">
                <h3 class="section-title">Platform Variants</h3>
                <p class="section-subtitle">Each platform may have different metadata, cover sizes, and pricing</p>
                @for (pv of f.platformVariants; track pv.id) {
                  <div class="record-card" style="margin-bottom:.75rem">
                    <div class="record-header">
                      <h3 class="record-title">{{ pv.platformName }} ({{ pv.storeRegion }})</h3>
                      <span class="status" [ngClass]="pv.uploadStatus==='Live'?'status-green':'status-amber'">{{ pv.uploadStatus }}</span>
                    </div>
                    <div class="record-grid">
                      <div class="record-field"><span class="label">Price</span><span class="value">{{ pv.platformPrice }}</span></div>
                      <div class="record-field"><span class="label">ASIN / ID</span><span class="value" style="font-family:monospace">{{ pv.asinOrPlatformId }}</span></div>
                      <div class="record-field"><span class="label">Published</span><span class="value">{{ pv.publicationDate }}</span></div>
                      <div class="record-field"><span class="label">Last Updated</span><span class="value">{{ pv.lastUpdated }}</span></div>
                      <div class="record-field"><span class="label">Keywords</span><span class="value">{{ pv.keywords || '—' }}</span></div>
                      <div class="record-field"><span class="label">Categories</span><span class="value">{{ pv.categories || '—' }}</span></div>
                    </div>
                  </div>
                }
                @if (!f.platformVariants.length) {
                  <div class="empty-state">
                    <div class="empty-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="40" height="40" style="color:var(--text-muted)">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    </div>
                    <p>No platform variants yet</p>
                  </div>
                }
              </div>
            }

            @if (tab() === 'logs') {
              <div class="card">
                <h3 class="section-title">Upload Logs</h3>
                @if (!f.uploadLogs.length) {
                  <div class="empty-state">
                    <div class="empty-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="40" height="40" style="color:var(--text-muted)">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <p>No upload events recorded</p>
                  </div>
                }
                @if (f.uploadLogs.length) {
                  <table class="data-table">
                    <thead><tr><th>Event</th><th>Timestamp</th><th>Performed By</th><th>Status</th><th>Notes</th></tr></thead>
                    <tbody>
                      @for (ul of f.uploadLogs; track ul.id) {
                        <tr>
                          <td class="td-primary">{{ ul.eventType }}</td>
                          <td>{{ ul.timestamp }}</td>
                          <td>{{ ul.performedBy }}</td>
                          <td><span class="status" [ngClass]="ul.status==='Success'?'status-green':'status-red'">{{ ul.status }}</span></td>
                          <td>{{ ul.notes || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Filter panel */
    .filter-panel {
      background: var(--surface); border: 1px solid var(--border-light);
      border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: var(--shadow-sm);
    }
    .filter-row { display: flex; gap: .75rem; align-items: flex-end; flex-wrap: wrap; }
    .filter-group { display: flex; flex-direction: column; gap: .3rem; }
    .filter-label { font-size: .6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); }
    .filter-sel {
      padding: .55rem 2rem .55rem .875rem; border: 1.5px solid var(--border-color); border-radius: 9px;
      font-size: .8125rem; font-family: inherit; color: var(--text-primary); background: var(--surface);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right .5rem center; appearance: none; outline: none; min-width: 150px;
    }
    .filter-sel:focus { border-color: var(--accent-blue); }
    .filter-go {
      display: flex; align-items: center; gap: .4rem;
      padding: .55rem 1.25rem; background: var(--primary); color: #fff; border: none;
      border-radius: 9px; font-size: .875rem; font-weight: 600; cursor: pointer; font-family: inherit;
      align-self: flex-end;
    }
    .filter-clear {
      padding: .55rem .875rem; background: none; border: 1.5px solid var(--border-color);
      border-radius: 9px; font-size: .8125rem; color: var(--text-muted); cursor: pointer;
      font-family: inherit; align-self: flex-end; transition: all .15s;
    }
    .filter-clear:hover { border-color: #ef4444; color: #ef4444; }
    .active-filters { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: .75rem; padding-top: .75rem; border-top: 1px solid var(--border-light); }
    .filter-chip { font-size: .75rem; padding: 2px 10px; background: var(--primary-light); border: 1px solid var(--border-color); border-radius: 100px; color: var(--text-secondary); }

    /* Book group */
    .book-group { margin-bottom: 1.5rem; }
    .book-group-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .75rem 1rem; background: var(--background);
      border: 1px solid var(--border-light); border-radius: 10px 10px 0 0;
      border-bottom: none;
    }
    .book-group-title { display: flex; align-items: center; gap: .5rem; font-size: .9375rem; font-weight: 700; color: var(--text-primary); }
    .book-group-meta { font-size: .8125rem; color: var(--text-muted); }
    .book-group .data-table { border-radius: 0 0 10px 10px; }
    .book-group .data-table th:first-child { border-radius: 0; }
  `]
})
export class VaultFormatsPageComponent {
  private vs = inject(AuthorVaultService);

  allFormats = computed((): FormatWithContext[] => {
    const fs: FormatWithContext[] = [];
    for (const i of this.vs.company().imprints)
      for (const p of i.penNames)
        for (const s of p.series)
          for (const bk of s.books)
            for (const lb of bk.languageBranches)
              for (const f of lb.formats)
                fs.push({ ...f, bookTitle: bk.coreWork.masterTitle, language: lb.edition.language, seriesName: s.identity.name, penName: p.identity.displayName });
    return fs;
  });

  // Filters
  filterTitle = '';
  filterLanguage = '';
  filterFormat = '';
  filterPlatform = '';

  get uniqueTitles(): string[] { return [...new Set(this.allFormats().map(f => f.bookTitle))].sort(); }
  get uniqueLanguages(): string[] { return [...new Set(this.allFormats().map(f => f.language))].sort(); }
  get uniqueFormats(): string[] { return [...new Set(this.allFormats().map(f => f.specs.formatType))].sort(); }
  get uniquePlatforms(): string[] {
    const ps = new Set<string>();
    for (const f of this.allFormats()) for (const pv of f.platformVariants) ps.add(pv.platformName);
    return [...ps].sort();
  }
  get hasActiveFilters(): boolean { return !!(this.filterTitle || this.filterLanguage || this.filterFormat || this.filterPlatform); }

  filteredFormats(): FormatWithContext[] {
    return this.allFormats().filter(f => {
      if (this.filterTitle && f.bookTitle !== this.filterTitle) return false;
      if (this.filterLanguage && f.language !== this.filterLanguage) return false;
      if (this.filterFormat && f.specs.formatType !== this.filterFormat) return false;
      if (this.filterPlatform && !f.platformVariants.some(pv => pv.platformName === this.filterPlatform)) return false;
      return true;
    });
  }

  groupedFormats(): { bookTitle: string; seriesName: string; penName: string; formats: FormatWithContext[] }[] {
    const map = new Map<string, { bookTitle: string; seriesName: string; penName: string; formats: FormatWithContext[] }>();
    for (const f of this.filteredFormats()) {
      if (!map.has(f.bookTitle)) map.set(f.bookTitle, { bookTitle: f.bookTitle, seriesName: f.seriesName, penName: f.penName, formats: [] });
      map.get(f.bookTitle)!.formats.push(f);
    }
    return Array.from(map.values());
  }

  onFilterChange() { /* reactive — filteredFormats() recomputes */ }
  applyFilters() { /* filters already applied reactively */ }
  clearFilters() { this.filterTitle = ''; this.filterLanguage = ''; this.filterFormat = ''; this.filterPlatform = ''; }

  selected = signal<FormatWithContext | null>(null);
  tab = signal('specs');
  tabs = [
    { id: 'specs',     label: 'Specs' },
    { id: 'kdpselect', label: 'KDP Select' },
    { id: 'pricing',   label: 'Pricing' },
    { id: 'variants',  label: 'Platforms' },
    { id: 'logs',      label: 'Upload Logs' },
  ];

  get liveCount() { return this.filteredFormats().filter(f => f.specs.status === 'Live').length; }
  get draftCount() { return this.filteredFormats().filter(f => f.specs.status === 'Draft').length; }
  get totalVariants() { return this.filteredFormats().reduce((a, f) => a + f.platformVariants.length, 0); }
  selectItem(f: FormatWithContext) { this.selected.set(f); this.tab.set('specs'); }
}
