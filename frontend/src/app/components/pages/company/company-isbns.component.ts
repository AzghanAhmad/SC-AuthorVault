import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VaultCompanyStoreService, VaultIsbnRecord } from '../../../services/vault-company-store.service';
import { ExcelImportService } from '../../../services/excel-import.service';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';
import { VaultTableFooterComponent } from '../../shared/vault-table-footer/vault-table-footer.component';

@Component({
  selector: 'app-company-isbns',
  standalone: true,
  imports: [CommonModule, FormsModule, PageActionBarComponent, VaultTableFooterComponent],
  templateUrl: './company-isbns.component.html',
  styleUrls: [
    '../company-vault/company-vault.component.css',
    './company-isbns.component.css',
  ],
})
export class CompanyIsbnsComponent {
  private readonly vaultStore = inject(VaultCompanyStoreService);
  private readonly excelImport = inject(ExcelImportService);
  private readonly router = inject(Router);

  editMode = signal(false);
  cardEditModes: Record<string, boolean> = {};
  searchQuery = '';
  filterStatus = '';
  filterFormat = '';
  readonly TABLE_PAGE_SIZE = 10;
  tablePage = signal(1);

  rawRecords = computed(() => this.vaultStore.isbnRecords());

  usedCount = computed(() => this.rawRecords().filter(i => i.status === 'used').length);
  availableCount = computed(() => this.rawRecords().filter(i => i.status === 'unused').length);
  reservedCount = computed(() => this.rawRecords().filter(i => i.status === 'reserved').length);

  isCardEditing(cardId: string): boolean {
    return !!(this.cardEditModes[cardId] || this.editMode());
  }

  toggleCardEdit(cardId: string): void {
    this.cardEditModes[cardId] = !this.cardEditModes[cardId];
  }

  filtered(): VaultIsbnRecord[] {
    return this.rawRecords().filter(i => {
      const q = this.searchQuery.toLowerCase();
      const matchQ = !q || i.isbn.toLowerCase().includes(q) || i.title.toLowerCase().includes(q);
      const displayStatus = this.statusLabel(i.status);
      const matchS = !this.filterStatus || displayStatus === this.filterStatus;
      const matchF = !this.filterFormat || i.format === this.filterFormat;
      return matchQ && matchS && matchF;
    });
  }

  pageSlice(): { item: VaultIsbnRecord; index: number }[] {
    const items = this.filtered();
    const page = this.tablePage();
    const start = (page - 1) * this.TABLE_PAGE_SIZE;
    return items.slice(start, start + this.TABLE_PAGE_SIZE).map(item => ({
      item,
      index: this.absoluteIndex(item),
    }));
  }

  absoluteIndex(target: VaultIsbnRecord): number {
    return this.rawRecords().findIndex(r =>
      r.isbn === target.isbn &&
      r.imprint === target.imprint &&
      r.format === target.format &&
      r.title === target.title
    );
  }

  statusLabel(status: VaultIsbnRecord['status']): string {
    if (status === 'used') return 'Used';
    if (status === 'reserved') return 'Reserved';
    return 'Available';
  }

  toStoreStatus(label: string): VaultIsbnRecord['status'] {
    if (label === 'Used') return 'used';
    if (label === 'Reserved') return 'reserved';
    return 'unused';
  }

  applyFilters(): void {
    this.tablePage.set(1);
  }

  setPage(page: number): void {
    this.tablePage.set(page);
  }

  patchRow(absIndex: number, key: keyof VaultIsbnRecord, val: string): void {
    if (!this.isCardEditing('isbn_master') || absIndex < 0) return;
    const list = [...this.rawRecords()];
    if (key === 'status') {
      list[absIndex] = { ...list[absIndex], status: this.toStoreStatus(val) };
    } else {
      list[absIndex] = { ...list[absIndex], [key]: val };
    }
    this.vaultStore.updateIsbnRecords(list);
  }

  addRow(): void {
    if (!this.isCardEditing('isbn_master')) return;
    this.vaultStore.updateIsbnRecords([
      ...this.rawRecords(),
      {
        isbn: '',
        format: '',
        title: '',
        imprint: '',
        pubDate: '',
        series: '',
        trimSize: '',
        edition: '',
        asin: '',
        status: 'unused',
      },
    ]);
  }

  removeRow(absIndex: number): void {
    if (!this.isCardEditing('isbn_master') || absIndex < 0) return;
    this.vaultStore.updateIsbnRecords(this.rawRecords().filter((_, i) => i !== absIndex));
  }

  triggerCsvImport(): void {
    const input = document.getElementById('isbn-master-csv-input') as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.click();
    }
  }

  onCsvSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.excelImport.parseFileList(file).then(list => {
      const mapped: VaultIsbnRecord[] = list.map((row: any) => {
        const get = (...keys: string[]) => {
          for (const k of keys) {
            const found = Object.keys(row).find(
              rk => rk.toLowerCase().replace(/\s+/g, '') === k.replace(/\s+/g, '')
            );
            if (found && row[found] != null) return String(row[found]);
          }
          return '';
        };
        const statusRaw = get('status').toLowerCase();
        const status: VaultIsbnRecord['status'] =
          statusRaw === 'used' ? 'used' : statusRaw === 'reserved' ? 'reserved' : 'unused';
        return {
          isbn: get('isbn', 'number'),
          format: get('format'),
          title: get('title', 'assigned to', 'book'),
          imprint: get('imprint'),
          pubDate: get('pub date', 'assigned date', 'date'),
          series: get('series', 'notes'),
          trimSize: get('trim size', 'trim'),
          edition: get('edition'),
          asin: get('asin'),
          status,
        };
      }).filter(r => r.isbn || r.title);
      this.vaultStore.updateIsbnRecords([...this.rawRecords(), ...mapped]);
      alert(`Imported ${mapped.length} ISBN row(s).`);
    }).catch(err => alert(err.message || 'Import failed.'));
    (event.target as HTMLInputElement).value = '';
  }

  deleteMasterSection(): void {
    if (!confirm('Delete all ISBN master-list records? This cannot be undone.')) return;
    this.vaultStore.clearIsbnRecords();
    this.cardEditModes = {};
  }

  goToCompanyIsbnsTab(): void {
    this.router.navigate(['/vault/company'], { queryParams: { tab: 'isbns' } });
  }

  deleteAllIsbns(): void {
    this.deleteMasterSection();
    this.editMode.set(false);
  }
}
