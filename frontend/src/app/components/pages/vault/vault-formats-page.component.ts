import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  styleUrls: ['../company-vault/company-vault.component.css'],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">📄 Formats</h1>
        <p class="page-subtitle">All book formats across all titles and editions — each format is a specific version of a book</p>
      </div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{ allFormats().length }}</div><div class="stat-label">Total Formats</div></div>
        <div class="stat-card"><div class="stat-value">{{ liveCount }}</div><div class="stat-label">Live</div></div>
        <div class="stat-card"><div class="stat-value">{{ draftCount }}</div><div class="stat-label">Draft</div></div>
        <div class="stat-card"><div class="stat-value">{{ totalVariants }}</div><div class="stat-label">Platform Variants</div></div>
      </div>

      @if (!selected()) {
        <div class="card">
          <h3 class="section-title">All Formats</h3>
          <p class="section-subtitle">Each row is a specific format (Ebook, Paperback, Hardcover, Audio) for a specific book and language edition</p>
          <table class="data-table">
            <thead>
              <tr><th>Book Title</th><th>Format</th><th>Language</th><th>Series</th><th>Status</th><th>Version</th><th>File Size</th><th>Platforms</th></tr>
            </thead>
            <tbody>
              @for (f of allFormats(); track f.id) {
                <tr class="clickable-row" (click)="selectItem(f)">
                  <td class="td-primary">{{ f.bookTitle }}</td>
                  <td><span class="tag">{{ f.specs.formatType }}</span></td>
                  <td>{{ f.language }}</td>
                  <td class="td-muted">{{ f.seriesName }}</td>
                  <td><span class="status" [ngClass]="f.specs.status==='Live'?'status-green':f.specs.status==='Ready'?'status-blue':'status-amber'">{{ f.specs.status }}</span></td>
                  <td>v{{ f.specs.versionNumber }}</td>
                  <td>{{ f.specs.fileSize || '—' }}</td>
                  <td>{{ f.platformVariants.length }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (selected(); as f) {
        <button class="back-btn" (click)="selected.set(null); tab.set('specs')">← All Formats</button>
        <div style="margin:.75rem 0 1rem;padding:.75rem 1rem;background:var(--primary-light);border-radius:10px;font-size:.875rem;color:var(--text-secondary)">
          <strong style="color:var(--text-primary)">{{ f.bookTitle }}</strong> · {{ f.specs.formatType }} · {{ f.language }}
          @if (f.seriesName) { <span> · {{ f.seriesName }}</span> }
        </div>

        <div class="vault-layout">
          <nav class="vault-nav">
            @for (t of tabs; track t.id) {
              <button class="tab-item" [class.active]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button>
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
                  <div class="empty-state"><div class="empty-icon">📋</div><p>Not enrolled in KDP Select</p></div>
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
                @for (pv of f.platformVariants; track pv.id) {
                  <div class="record-card">
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
                  <div class="empty-state"><div class="empty-icon">🖥</div><p>No platform variants yet</p></div>
                }
              </div>
            }

            @if (tab() === 'logs') {
              <div class="card">
                <h3 class="section-title">Upload Logs</h3>
                @if (!f.uploadLogs.length) {
                  <div class="empty-state"><div class="empty-icon">📋</div><p>No upload events recorded</p></div>
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
  `
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

  selected = signal<FormatWithContext | null>(null);
  tab = signal('specs');
  tabs = [
    { id: 'specs',     label: '📐 Specs' },
    { id: 'kdpselect', label: '📋 KDP Select' },
    { id: 'pricing',   label: '💰 Pricing' },
    { id: 'variants',  label: '🖥 Platforms' },
    { id: 'logs',      label: '📝 Upload Logs' },
  ];

  get liveCount() { return this.allFormats().filter(f => f.specs.status === 'Live').length; }
  get draftCount() { return this.allFormats().filter(f => f.specs.status === 'Draft').length; }
  get totalVariants() { return this.allFormats().reduce((a, f) => a + f.platformVariants.length, 0); }
  selectItem(f: FormatWithContext) { this.selected.set(f); this.tab.set('specs'); }
}
