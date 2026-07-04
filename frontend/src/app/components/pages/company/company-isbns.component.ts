import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VaultCompanyStoreService, VaultIsbnRecord } from '../../../services/vault-company-store.service';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';

interface IsbnRecord {
  isbn: string;
  format: string;
  title: string;
  imprint: string;
  status: 'Used' | 'Available' | 'Reserved';
  assignedDate: string;
  notes: string;
}

function mapVaultStatus(status: VaultIsbnRecord['status']): IsbnRecord['status'] {
  if (status === 'used') return 'Used';
  if (status === 'reserved') return 'Reserved';
  return 'Available';
}

function toDisplayRecord(r: VaultIsbnRecord): IsbnRecord {
  return {
    isbn: r.isbn,
    format: r.format,
    title: r.title,
    imprint: r.imprint,
    status: mapVaultStatus(r.status),
    assignedDate: r.pubDate || '',
    notes: r.series ? `Series: ${r.series}` : ''
  };
}

@Component({
  selector: 'app-company-isbns',
  standalone: true,
  imports: [CommonModule, FormsModule, PageActionBarComponent],
  templateUrl: './company-isbns.component.html',
  styleUrls: ['./company-isbns.component.css'],
  })
export class CompanyIsbnsComponent {
  private readonly vaultStore = inject(VaultCompanyStoreService);
  editMode = signal(false);

  searchQuery = '';
  filterStatus = '';
  filterFormat = '';

  isbns = computed(() => this.vaultStore.isbnRecords().map(toDisplayRecord));

  usedCount = computed(() => this.isbns().filter(i => i.status === 'Used').length);
  availableCount = computed(() => this.isbns().filter(i => i.status === 'Available').length);
  reservedCount = computed(() => this.isbns().filter(i => i.status === 'Reserved').length);

  filtered() {
    return this.isbns().filter(i => {
      const q = this.searchQuery.toLowerCase();
      const matchQ = !q || i.isbn.includes(q) || i.title.toLowerCase().includes(q);
      const matchS = !this.filterStatus || i.status === this.filterStatus;
      const matchF = !this.filterFormat || i.format === this.filterFormat;
      return matchQ && matchS && matchF;
    });
  }

  applyFilters() {}

  deleteAllIsbns(): void {
    if (!confirm('Delete all ISBN records? This cannot be undone.')) return;
    this.vaultStore.clearIsbnRecords();
    this.editMode.set(false);
  }
}
