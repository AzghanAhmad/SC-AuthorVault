import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { BookFormat, KDPSelectEnrollment, PricingHistoryEntry, PlatformVariant, UploadLog } from '../../../models/author-vault.model';
import { EditableFieldComponent } from '../../shared/editable-field/editable-field.component';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';
import { VaultTableFooterComponent } from '../../shared/vault-table-footer/vault-table-footer.component';

interface FormatWithContext extends BookFormat {
  bookTitle: string;
  language: string;
  seriesName: string;
  penName: string;
}

@Component({
  selector: 'app-vault-formats-page',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, PageActionBarComponent, VaultTableFooterComponent],
  styleUrls: ['../company-vault/company-vault.component.css', './vault-formats-page.component.css'],
  templateUrl: './vault-formats-page.component.html',
  })
export class VaultFormatsPageComponent {
  readonly vs = inject(AuthorVaultService);
  private router = inject(Router);

  editMode = signal(false);
  cardEditModes: Record<string, boolean> = {};
  readonly TABLE_PAGE_SIZE = 8;
  tablePages: Record<string, number> = {};

  isCardEditing(cardId: string): boolean {
    return !!(this.cardEditModes[cardId] || this.editMode());
  }

  toggleCardEdit(cardId: string): void {
    this.cardEditModes[cardId] = !this.cardEditModes[cardId];
  }

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

  selectedId = signal<string | null>(null);
  /** Always resolve from the live company signal so in-place edits stay visible. */
  selected = computed(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.allFormats().find(f => f.id === id) ?? null;
  });
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
  selectItem(f: FormatWithContext) { this.selectedId.set(f.id); this.tab.set('specs'); }
  clearSelection(): void { this.selectedId.set(null); this.tab.set('specs'); }

  private readonly numericSpecKeys = new Set(['wordCount', 'pageCount']);

  patchSpecs(f: FormatWithContext, key: string, val: string | number): void {
    if (!this.isCardEditing('specs')) return;
    const nextVal = this.numericSpecKeys.has(key) ? (Number(val) || 0) : val;
    this.vs.updateFormatSpecs(f.id, { [key]: nextVal } as any);
  }

  loadSpecsDefaults(f: FormatWithContext): void {
    this.vs.updateFormatSpecs(f.id, {
      versionNumber: f.specs.versionNumber || '1.0',
      status: f.specs.status || 'Draft',
      releaseDate: f.specs.releaseDate || new Date().toISOString().split('T')[0],
      drmPreference: f.specs.drmPreference || (f.specs.formatType === 'Ebook' ? 'Off' : 'N/A'),
    });
    this.cardEditModes['specs'] = true;
  }

  deleteSpecsSection(f: FormatWithContext): void {
    if (!confirm('Clear this format\'s specs?')) return;
    this.vs.updateFormatSpecs(f.id, {
      releaseDate: '', versionNumber: '1.0', wordCount: 0, pageCount: 0, audioRuntime: '',
      trimSize: '', paperType: '', bindingType: '', printFinish: '', interiorType: '',
      fileSize: '', drmPreference: '', deliveryMethod: '',
    });
  }

  // ── KDP Select ──
  ensureKdpSelect(f: FormatWithContext): void {
    if (f.kdpSelect) return;
    this.vs.updateFormatKdpSelect(f.id, {
      enrollmentStatus: 'Not enrolled',
      periodStart: '',
      periodEnd: '',
      autoRenew: false,
      kenpPages: 0,
      kenpRevenue: '',
      countdownDealUsed: false,
      freeDaysUsed: false,
    });
  }

  patchKdp(f: FormatWithContext, key: keyof KDPSelectEnrollment, val: string | number | boolean): void {
    if (!this.isCardEditing('kdpselect')) return;
    this.ensureKdpSelect(f);
    const live = this.selected();
    if (!live) return;
    const numeric = key === 'kenpPages' || key === 'kenpReads' || key === 'enrollmentPeriodNumber' || key === 'freeDayDownloads';
    this.vs.updateFormatKdpSelect(live.id, {
      [key]: numeric ? (Number(val) || 0) : val,
    } as Partial<KDPSelectEnrollment>);
  }

  loadKdpDefaults(f: FormatWithContext): void {
    const today = new Date().toISOString().split('T')[0];
    const end = new Date();
    end.setDate(end.getDate() + 90);
    this.vs.updateFormatKdpSelect(f.id, {
      enrollmentStatus: 'Enrolled',
      periodStart: today,
      periodEnd: end.toISOString().split('T')[0],
      autoRenew: true,
      enrollmentPeriodNumber: 1,
      kenpPages: 0,
      kenpRevenue: '$0.00',
      countdownDealUsed: false,
      freeDaysUsed: false,
      reasonForEnrollment: 'Maximize KU reads',
    });
    this.cardEditModes['kdpselect'] = true;
  }

  deleteKdpSection(f: FormatWithContext): void {
    if (!confirm('Clear KDP Select enrollment for this format?')) return;
    this.vs.updateFormatKdpSelect(f.id, null);
  }

  // ── Pricing ──
  patchPricing(f: FormatWithContext, index: number, key: keyof PricingHistoryEntry, val: string): void {
    if (!this.isCardEditing('pricing')) return;
    const list = [...(f.pricingHistory || [])];
    if (!list[index]) return;
    list[index] = { ...list[index], [key]: val };
    this.vs.updateFormatPricing(f.id, list);
  }

  addPricingRow(f: FormatWithContext): void {
    if (!this.isCardEditing('pricing')) return;
    this.vs.updateFormatPricing(f.id, [
      ...(f.pricingHistory || []),
      { regularPrice: '', launchPrice: '', preOrderPrice: '', salePrice: '', startDate: new Date().toISOString().split('T')[0], endDate: '', currency: 'USD', reason: '' },
    ]);
  }

  removePricingRow(f: FormatWithContext, index: number): void {
    if (!this.isCardEditing('pricing')) return;
    this.vs.updateFormatPricing(f.id, (f.pricingHistory || []).filter((_, i) => i !== index));
  }

  loadPricingDefaults(f: FormatWithContext): void {
    this.vs.updateFormatPricing(f.id, [
      { regularPrice: '$4.99', launchPrice: '$2.99', preOrderPrice: '$0.99', salePrice: '', startDate: new Date().toISOString().split('T')[0], endDate: '', currency: 'USD', reason: 'Launch' },
    ]);
    this.cardEditModes['pricing'] = true;
  }

  deletePricingSection(f: FormatWithContext): void {
    if (!confirm('Delete all pricing history rows?')) return;
    this.vs.updateFormatPricing(f.id, []);
  }

  // ── Platforms ──
  patchVariant(f: FormatWithContext, index: number, key: keyof PlatformVariant, val: string): void {
    if (!this.isCardEditing('variants')) return;
    const list = [...(f.platformVariants || [])];
    if (!list[index]) return;
    list[index] = { ...list[index], [key]: val };
    this.vs.updateFormatPlatformVariants(f.id, list);
  }

  addVariantRow(f: FormatWithContext): void {
    if (!this.isCardEditing('variants')) return;
    this.vs.updateFormatPlatformVariants(f.id, [
      ...(f.platformVariants || []),
      {
        id: `pv-${Date.now()}`,
        platformName: '',
        storeRegion: 'US',
        uploadStatus: 'Draft',
        publicationDate: '',
        lastUpdated: new Date().toISOString().split('T')[0],
        platformTitle: f.bookTitle || '',
        platformDescription: '',
        keywords: '',
        categories: '',
        bisacCodes: '',
        platformPrice: '',
        platformSalePrice: '',
        isbn: '',
        asinOrPlatformId: '',
      },
    ]);
  }

  removeVariantRow(f: FormatWithContext, index: number): void {
    if (!this.isCardEditing('variants')) return;
    this.vs.updateFormatPlatformVariants(f.id, (f.platformVariants || []).filter((_, i) => i !== index));
  }

  loadVariantDefaults(f: FormatWithContext): void {
    const today = new Date().toISOString().split('T')[0];
    this.vs.updateFormatPlatformVariants(f.id, [
      {
        id: `pv-amz-${Date.now()}`,
        platformName: 'Amazon KDP',
        storeRegion: 'US',
        uploadStatus: 'Draft',
        publicationDate: '',
        lastUpdated: today,
        platformTitle: f.bookTitle || '',
        platformDescription: '',
        keywords: '',
        categories: '',
        bisacCodes: '',
        platformPrice: '$4.99',
        platformSalePrice: '',
        isbn: '',
        asinOrPlatformId: '',
      },
    ]);
    this.cardEditModes['variants'] = true;
  }

  deleteVariantsSection(f: FormatWithContext): void {
    if (!confirm('Delete all platform variants?')) return;
    this.vs.updateFormatPlatformVariants(f.id, []);
  }

  // ── Upload Logs ──
  patchLog(f: FormatWithContext, index: number, key: keyof UploadLog, val: string): void {
    if (!this.isCardEditing('logs')) return;
    const list = [...(f.uploadLogs || [])];
    if (!list[index]) return;
    list[index] = { ...list[index], [key]: val };
    this.vs.updateFormatUploadLogs(f.id, list);
  }

  addLogRow(f: FormatWithContext): void {
    if (!this.isCardEditing('logs')) return;
    this.vs.updateFormatUploadLogs(f.id, [
      ...(f.uploadLogs || []),
      {
        id: `ul-${Date.now()}`,
        eventType: 'Upload',
        timestamp: new Date().toISOString().slice(0, 16),
        performedBy: '',
        oldValue: '',
        newValue: '',
        status: 'Pending',
        platformResponse: '',
        notes: '',
      },
    ]);
  }

  removeLogRow(f: FormatWithContext, index: number): void {
    if (!this.isCardEditing('logs')) return;
    this.vs.updateFormatUploadLogs(f.id, (f.uploadLogs || []).filter((_, i) => i !== index));
  }

  loadLogDefaults(f: FormatWithContext): void {
    this.vs.updateFormatUploadLogs(f.id, [
      {
        id: `ul-${Date.now()}`,
        eventType: 'Publish',
        timestamp: new Date().toISOString().slice(0, 16),
        performedBy: f.penName || 'Author',
        oldValue: 'Draft',
        newValue: 'Live',
        status: 'Success',
        platformResponse: '',
        notes: '',
      },
    ]);
    this.cardEditModes['logs'] = true;
  }

  deleteLogsSection(f: FormatWithContext): void {
    if (!confirm('Delete all upload log entries?')) return;
    this.vs.updateFormatUploadLogs(f.id, []);
  }

  tablePage(key: string): number {
    return this.tablePages[key] ?? 1;
  }

  setTablePage(key: string, page: number): void {
    this.tablePages[key] = page;
  }

  pageSliceIndexed<T>(key: string, items: T[]): { item: T; index: number }[] {
    const page = this.tablePage(key);
    const start = (page - 1) * this.TABLE_PAGE_SIZE;
    return items.slice(start, start + this.TABLE_PAGE_SIZE).map((item, i) => ({ item, index: start + i }));
  }
}
