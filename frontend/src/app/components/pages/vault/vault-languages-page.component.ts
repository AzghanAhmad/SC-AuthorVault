import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { LanguageBranch } from '../../../models/author-vault.model';

const ALL_LANGUAGES = [
  'Afrikaans','Albanian','Arabic','Armenian','Azerbaijani','Basque','Belarusian','Bengali',
  'Bosnian','Bulgarian','Catalan','Chinese (Simplified)','Chinese (Traditional)','Croatian',
  'Czech','Danish','Dutch','English','Estonian','Finnish','French','Galician','Georgian',
  'German','Greek','Gujarati','Hebrew','Hindi','Hungarian','Icelandic','Indonesian','Irish',
  'Italian','Japanese','Kannada','Kazakh','Korean','Latvian','Lithuanian','Macedonian','Malay',
  'Maltese','Marathi','Mongolian','Nepali','Norwegian','Persian','Polish','Portuguese (Brazil)',
  'Portuguese (Portugal)','Punjabi','Romanian','Russian','Serbian','Slovak','Slovenian',
  'Spanish','Swahili','Swedish','Tamil','Telugu','Thai','Turkish','Ukrainian','Urdu',
  'Uzbek','Vietnamese','Welsh','Yoruba','Zulu'
];

@Component({
  selector: 'app-vault-languages-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../company-vault/company-vault.component.css'],
  template: `
    <div class="page">
      <div class="page-header">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem">
          <div>
            <h1 class="page-title">🌐 Language Editions</h1>
            <p class="page-subtitle">Filter by language to see all books published in that language</p>
          </div>
          <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
            <select [(ngModel)]="selectedLanguage" (change)="onLanguageChange()" class="lang-select">
              <option value="">All Languages</option>
              @for (lang of availableLanguages; track lang) {
                <option [value]="lang">{{ lang }}</option>
              }
            </select>
            <button class="add-lang-btn" (click)="showAddLang = !showAddLang">+ Add Language</button>
          </div>
        </div>
      </div>

      <!-- Add language panel -->
      @if (showAddLang) {
        <div class="card" style="margin-bottom:1.25rem">
          <h3 class="section-title">Add a Language Edition</h3>
          <p class="section-subtitle">AI translation makes it easy to publish in almost any language. Select from the full list below.</p>
          <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
            <select [(ngModel)]="newLanguage" style="padding:.6rem 1rem;border:1.5px solid var(--border-color);border-radius:9px;font-size:.875rem;font-family:inherit;color:var(--text-primary);background:var(--surface);outline:none;min-width:220px">
              <option value="">Select a language...</option>
              @for (lang of ALL_LANGUAGES; track lang) {
                <option [value]="lang">{{ lang }}</option>
              }
            </select>
            <button (click)="addLanguage()" style="padding:.6rem 1.25rem;background:var(--accent-blue);color:#fff;border:none;border-radius:9px;font-size:.875rem;font-weight:600;cursor:pointer;font-family:inherit" [disabled]="!newLanguage">Add Language</button>
            <button (click)="showAddLang=false" style="padding:.6rem 1rem;background:var(--surface);border:1.5px solid var(--border-color);border-radius:9px;font-size:.875rem;cursor:pointer;font-family:inherit;color:var(--text-secondary)">Cancel</button>
          </div>
          <p style="font-size:.75rem;color:var(--text-muted);margin-top:.75rem">
            Note: Each translation is a separate format and requires its own ISBN per format type (e.g., a Spanish Paperback 6x9 gets its own ISBN separate from the English Paperback 6x9).
          </p>
        </div>
      }

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{ filteredBranches().length }}</div><div class="stat-label">{{ selectedLanguage || 'All' }} Editions</div></div>
        <div class="stat-card"><div class="stat-value">{{ primaryCount }}</div><div class="stat-label">Primary (English)</div></div>
        <div class="stat-card"><div class="stat-value">{{ translationCount }}</div><div class="stat-label">Translations</div></div>
        <div class="stat-card"><div class="stat-value">{{ totalFormats }}</div><div class="stat-label">Total Formats</div></div>
      </div>

      <!-- Language summary chips (when no filter) -->
      @if (!selectedLanguage) {
        <div class="card" style="margin-bottom:1.25rem">
          <h3 class="section-title">Languages Published</h3>
          <div class="lang-chips">
            @for (lang of availableLanguages; track lang) {
              <button class="lang-chip" [class.active]="selectedLanguage === lang" (click)="selectedLanguage = lang">
                {{ lang }} <span class="lang-chip-count">{{ countByLanguage(lang) }}</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- Edition list -->
      @if (!selected()) {
        <div class="card">
          <h3 class="section-title">
            {{ selectedLanguage ? selectedLanguage + ' Editions' : 'All Editions' }}
            @if (selectedLanguage) {
              <button (click)="selectedLanguage=''" style="margin-left:.75rem;font-size:.75rem;color:var(--accent-blue);background:none;border:none;cursor:pointer;font-family:inherit">Clear filter</button>
            }
          </h3>
          <table class="data-table">
            <thead>
              <tr><th>Edition</th><th>Language</th><th>Type</th><th>Status</th><th>Formats</th><th>Words</th><th>ISBNs</th></tr>
            </thead>
            <tbody>
              @for (lb of filteredBranches(); track lb.id) {
                <tr class="clickable-row" (click)="selectItem(lb)">
                  <td class="td-primary">{{ lb.edition.editionName }}</td>
                  <td>
                    <span class="lang-badge">{{ lb.edition.language }}</span>
                    @if (lb.edition.isPrimaryLanguage) { <span class="tag" style="margin-left:.35rem">Default</span> }
                  </td>
                  <td>{{ lb.edition.editionType }}</td>
                  <td><span class="status" [ngClass]="lb.edition.publicationStatus==='Published'?'status-green':lb.edition.publicationStatus==='In Progress'?'status-amber':'status-default'">{{ lb.edition.publicationStatus }}</span></td>
                  <td>{{ lb.formats.length }}</td>
                  <td>{{ lb.edition.wordCount | number }}</td>
                  <td>
                    <span style="font-size:.75rem;color:var(--text-muted)">
                      {{ lb.identifiers.isbnEbook ? '✓ Ebook' : '' }}
                      {{ lb.identifiers.isbnPaperback ? ' ✓ PB' : '' }}
                    </span>
                  </td>
                </tr>
              }
              @if (filteredBranches().length === 0) {
                <tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No editions found for this language.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Selected edition detail -->
      @if (selected(); as lb) {
        <button class="back-btn" (click)="selected.set(null); detailTab.set('edition')">← Back to Editions</button>

        <div class="vault-layout" style="margin-top:1rem">
          <nav class="vault-nav">
            @for (t of detailTabs; track t.id) {
              <button class="tab-item" [class.active]="detailTab() === t.id" (click)="detailTab.set(t.id)">{{ t.label }}</button>
            }
          </nav>
          <div class="vault-content">

            @if (detailTab() === 'edition') {
              <div class="card">
                <h3 class="section-title">{{ lb.edition.editionName }}</h3>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Edition Name</span><div class="form-value">{{ lb.edition.editionName }}</div></div>
                  <div class="form-group"><span class="form-label">Edition Type</span><div class="form-value">{{ lb.edition.editionType }}</div></div>
                  <div class="form-group"><span class="form-label">Language</span><div class="form-value">{{ lb.edition.language }}</div></div>
                  <div class="form-group"><span class="form-label">Language Code</span><div class="form-value">{{ lb.edition.languageCode }}</div></div>
                  <div class="form-group"><span class="form-label">Locale Variant</span><div class="form-value">{{ lb.edition.localeVariant }}</div></div>
                  <div class="form-group"><span class="form-label">Primary Language</span><div class="form-value">{{ lb.edition.isPrimaryLanguage ? 'Yes (Default)' : 'No (Translation)' }}</div></div>
                  <div class="form-group"><span class="form-label">Publication Status</span><div class="form-value">{{ lb.edition.publicationStatus }}</div></div>
                  <div class="form-group"><span class="form-label">Release Date</span><div class="form-value">{{ lb.edition.releaseDate || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Word Count</span><div class="form-value">{{ lb.edition.wordCount | number }}</div></div>
                  <div class="form-group"><span class="form-label">Page Count</span><div class="form-value">{{ lb.edition.pageCount }}</div></div>
                  <div class="form-group"><span class="form-label">Chapter Count</span><div class="form-value">{{ lb.edition.chapterCount }}</div></div>
                </div>
              </div>
            }

            @if (detailTab() === 'metadata') {
              <div class="card">
                <h3 class="section-title">Localized Metadata</h3>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Localized Title</span><div class="form-value">{{ lb.localizedMetadata.localizedTitle || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Localized Subtitle</span><div class="form-value">{{ lb.localizedMetadata.localizedSubtitle || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Localized Series Name</span><div class="form-value">{{ lb.localizedMetadata.localizedSeriesName || '—' }}</div></div>
                  <div class="form-group full"><span class="form-label">Localized Hook</span><div class="form-value">{{ lb.localizedMetadata.localizedHook || '—' }}</div></div>
                  <div class="form-group full"><span class="form-label">Short Description</span><div class="form-value">{{ lb.localizedMetadata.localizedShortDescription || '—' }}</div></div>
                  <div class="form-group full"><span class="form-label">Long Description</span><div class="form-value">{{ lb.localizedMetadata.localizedLongDescription || '—' }}</div></div>
                  <div class="form-group full"><span class="form-label">Author Bio (Localized)</span><div class="form-value">{{ lb.localizedMetadata.localizedAuthorBio || '—' }}</div></div>
                  <div class="form-group full"><span class="form-label">Translator Credit</span><div class="form-value">{{ lb.localizedMetadata.translatorCreditLine || '—' }}</div></div>
                  <div class="form-group full"><span class="form-label">Content Warnings</span><div class="form-value">{{ lb.localizedMetadata.localizedContentWarnings || '—' }}</div></div>
                </div>
              </div>
            }

            @if (detailTab() === 'identifiers') {
              <div class="card">
                <h3 class="section-title">ISBNs for this Edition</h3>
                <p class="section-subtitle">Each format requires its own ISBN — including translations</p>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Ebook ISBN</span><div class="form-value" style="font-family:monospace">{{ lb.identifiers.isbnEbook || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Paperback ISBN</span><div class="form-value" style="font-family:monospace">{{ lb.identifiers.isbnPaperback || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Hardcover ISBN</span><div class="form-value" style="font-family:monospace">{{ lb.identifiers.isbnHardcover || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Large Print ISBN</span><div class="form-value" style="font-family:monospace">{{ lb.identifiers.isbnLargePrint || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Audiobook ISBN</span><div class="form-value" style="font-family:monospace">{{ lb.identifiers.isbnAudiobook || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Assigned Date</span><div class="form-value">{{ lb.identifiers.isbnAssignedDate || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">ISBN Status</span><div class="form-value">{{ lb.identifiers.isbnStatus }}</div></div>
                </div>
              </div>
            }

            @if (detailTab() === 'formats') {
              <div class="card">
                <h3 class="section-title">Formats in this Edition</h3>
                <div class="entity-list">
                  @for (f of lb.formats; track f.id) {
                    <div class="entity-card">
                      <div class="entity-card-header">
                        <h3 class="entity-name">📄 {{ f.specs.formatType }}</h3>
                        <span class="status" [ngClass]="f.specs.status==='Live'?'status-green':'status-amber'">{{ f.specs.status }}</span>
                      </div>
                      <div class="entity-stats">
                        <span class="entity-stat">v{{ f.specs.versionNumber }}</span>
                        <span class="entity-stat">{{ f.specs.fileSize || '—' }}</span>
                        <span class="entity-stat"><strong>{{ f.platformVariants.length }}</strong> Platforms</span>
                      </div>
                    </div>
                  }
                  @if (!lb.formats.length) {
                    <div class="empty-state"><div class="empty-icon">📄</div><p>No formats yet for this edition</p></div>
                  }
                </div>
              </div>
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .lang-select {
      padding: .6rem 2rem .6rem 1rem; border: 1.5px solid var(--border-color); border-radius: 9px;
      font-size: .875rem; font-family: inherit; color: var(--text-primary); background: var(--surface);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right .6rem center; appearance: none; outline: none; min-width: 180px;
    }
    .add-lang-btn {
      padding: .6rem 1.25rem; background: var(--primary); color: #fff; border: none;
      border-radius: 9px; font-size: .875rem; font-weight: 600; cursor: pointer; font-family: inherit;
    }
    .lang-chips { display: flex; gap: .5rem; flex-wrap: wrap; }
    .lang-chip {
      padding: .35rem .875rem; border: 1.5px solid var(--border-color); border-radius: 100px;
      background: var(--surface); font-size: .8125rem; font-weight: 500; color: var(--text-secondary);
      cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: .4rem;
    }
    .lang-chip:hover, .lang-chip.active { border-color: var(--accent-blue); color: var(--accent-blue); background: var(--primary-light); }
    .lang-chip-count { font-size: .6875rem; background: var(--border-color); border-radius: 100px; padding: 1px 6px; }
    .lang-badge { font-size: .8125rem; font-weight: 600; color: var(--text-primary); }
  `]
})
export class VaultLanguagesPageComponent {
  private vs = inject(AuthorVaultService);
  readonly ALL_LANGUAGES = ALL_LANGUAGES;

  allBranches = computed(() => {
    const bs: LanguageBranch[] = [];
    for (const i of this.vs.company().imprints)
      for (const p of i.penNames)
        for (const s of p.series)
          for (const bk of s.books)
            bs.push(...bk.languageBranches);
    return bs;
  });

  selectedLanguage = 'English'; // default English
  selected = signal<LanguageBranch | null>(null);
  detailTab = signal('edition');
  showAddLang = false;
  newLanguage = '';

  detailTabs = [
    { id: 'edition',     label: '📖 Edition' },
    { id: 'metadata',    label: '📝 Metadata' },
    { id: 'identifiers', label: '🔢 ISBNs' },
    { id: 'formats',     label: '📄 Formats' },
  ];

  get availableLanguages(): string[] {
    const langs = new Set(this.allBranches().map(b => b.edition.language));
    return Array.from(langs).sort();
  }

  filteredBranches(): LanguageBranch[] {
    if (!this.selectedLanguage) return this.allBranches();
    return this.allBranches().filter(b => b.edition.language === this.selectedLanguage);
  }

  countByLanguage(lang: string): number {
    return this.allBranches().filter(b => b.edition.language === lang).length;
  }

  get primaryCount() { return this.allBranches().filter(b => b.edition.isPrimaryLanguage).length; }
  get translationCount() { return this.allBranches().filter(b => !b.edition.isPrimaryLanguage).length; }
  get totalFormats() { return this.allBranches().reduce((a, b) => a + b.formats.length, 0); }

  onLanguageChange() { this.selected.set(null); }
  selectItem(lb: LanguageBranch) { this.selected.set(lb); this.detailTab.set('edition'); }

  addLanguage() {
    if (this.newLanguage) {
      this.selectedLanguage = this.newLanguage;
      this.newLanguage = '';
      this.showAddLang = false;
    }
  }
}
