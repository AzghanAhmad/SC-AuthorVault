import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  styleUrls: ['../company-vault/company-vault.component.css', './vault-formats-page.component.css'],
  templateUrl: './vault-formats-page.component.html',
  })
export class VaultFormatsPageComponent {
  private vs = inject(AuthorVaultService);
  private router = inject(Router);

  goTo(r: string) { this.router.navigate([r]); }

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
