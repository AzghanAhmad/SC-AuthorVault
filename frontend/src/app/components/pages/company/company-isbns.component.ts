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
  template: `
    <div class="page">
      <app-page-action-bar
        [editing]="editMode()"
        deleteLabel="Delete all ISBNs"
        (editToggle)="editMode.update(v => !v)"
        (deleteAll)="deleteAllIsbns()" />

      <div class="page-header">
        <div>
          <div class="page-title-wrap">
            <svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2.5 21h19"/>
              <path d="M4.5 21V11.5h3.5V21"/>
              <path d="M6.25 13.5v5"/>
              <path d="M8.5 21V6h7V21"/>
              <path d="M12 6V2.75"/>
              <path d="M9.75 8h4.5"/><path d="M9.75 9.75h4.5"/><path d="M9.75 11.5h4.5"/>
              <path d="M9.75 13.25h4.5"/><path d="M9.75 15h4.5"/><path d="M9.75 16.75h4.5"/>
              <path d="M9.75 18.5h4.5"/>
              <path d="M16 21V11.5h3.5V21"/>
              <path d="M17.75 13.5v5"/>
            </svg>
            <h1 class="page-title" style="margin:0;">ISBN Master List</h1>
          </div>
          <p class="page-subtitle">Track every ISBN across all formats and books</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card"><span class="stat-value">{{ isbns().length }}</span><span class="stat-label">Total ISBNs</span></div>
        <div class="stat-card green"><span class="stat-value">{{ usedCount() }}</span><span class="stat-label">Used</span></div>
        <div class="stat-card amber"><span class="stat-value">{{ availableCount() }}</span><span class="stat-label">Available</span></div>
        <div class="stat-card blue"><span class="stat-value">{{ reservedCount() }}</span><span class="stat-label">Reserved</span></div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search ISBN or title..." [(ngModel)]="searchQuery" (input)="applyFilters()" class="search-input"/>
        </div>
        <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="filter-select">
          <option value="">All Statuses</option>
          <option value="Used">Used</option>
          <option value="Available">Available</option>
          <option value="Reserved">Reserved</option>
        </select>
        <select [(ngModel)]="filterFormat" (change)="applyFilters()" class="filter-select">
          <option value="">All Formats</option>
          <option value="Paperback 6x9">Paperback 6x9</option>
          <option value="Paperback 5.5x8.5">Paperback 5.5x8.5</option>
          <option value="Hardcover">Hardcover</option>
          <option value="Audiobook">Audiobook</option>
          <option value="Ebook">Ebook</option>
          <option value="Box Set">Box Set</option>
          <option value="Large Print">Large Print</option>
        </select>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table class="isbn-table">
          <thead>
            <tr>
              <th>ISBN</th>
              <th>Format</th>
              <th>Assigned To</th>
              <th>Imprint</th>
              <th>Status</th>
              <th>Assigned Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filtered()" class="isbn-row">
              <td class="isbn-num">{{ row.isbn }}</td>
              <td><span class="format-tag">{{ row.format }}</span></td>
              <td class="td-title">{{ row.title || '—' }}</td>
              <td class="td-muted">{{ row.imprint || '—' }}</td>
              <td><span class="status-badge" [class]="'status-' + row.status.toLowerCase()">{{ row.status }}</span></td>
              <td class="td-muted">{{ row.assignedDate || '—' }}</td>
              <td class="td-muted">{{ row.notes || '—' }}</td>
            </tr>
            <tr *ngIf="filtered().length === 0">
              <td colspan="7" class="empty-row">No ISBNs match your filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page { width: 100%; animation: fadeInUp .4s ease both; }
    .page-header { margin-bottom: 1.5rem; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .2rem; }
    .page-subtitle { font-size: .9rem; color: var(--text-muted); margin: 0; }

    .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface); border: 1px solid var(--border-light); border-radius: 14px; padding: 1.1rem; text-align: center; box-shadow: var(--shadow-sm); }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); display: block; }
    .stat-label { font-size: .75rem; color: var(--text-muted); }
    .stat-card.green .stat-value { color: #10b981; }
    .stat-card.amber .stat-value { color: #f59e0b; }
    .stat-card.blue .stat-value { color: #3b82f6; }

    .filter-bar { display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: 1.25rem; align-items: center; }
    .search-box { position: relative; flex: 1; min-width: 200px; }
    .search-box svg { position: absolute; left: .75rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted); }
    .search-input { width: 100%; padding: .6rem 1rem .6rem 2.25rem; border: 1.5px solid var(--border-color); border-radius: 9px; font-size: .875rem; font-family: inherit; color: var(--text-primary); background: var(--surface); outline: none; }
    .search-input:focus { border-color: var(--accent-blue); }
    .filter-select { padding: .6rem 2rem .6rem .875rem; border: 1.5px solid var(--border-color); border-radius: 9px; font-size: .8125rem; font-family: inherit; color: var(--text-secondary); background: var(--surface); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .6rem center; appearance: none; cursor: pointer; outline: none; }

    .table-wrap { background: var(--surface); border: 1px solid var(--border-light); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-sm); }
    .isbn-table { width: 100%; border-collapse: collapse; }
    .isbn-table th { padding: .7rem 1rem; text-align: left; font-size: .6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); border-bottom: 1px solid var(--border-light); background: var(--background); }
    .isbn-table td { padding: .7rem 1rem; font-size: .8125rem; border-bottom: 1px solid var(--border-light); }
    .isbn-row:last-child td { border-bottom: none; }
    .isbn-row:hover { background: var(--primary-light); }
    .isbn-num { font-family: monospace; font-size: .8125rem; color: var(--text-primary); font-weight: 600; }
    .td-title { font-weight: 600; color: var(--text-primary); }
    .td-muted { color: var(--text-muted); }
    .format-tag { font-size: .6875rem; font-weight: 600; padding: 2px 8px; background: var(--primary-light); border: 1px solid var(--border-color); border-radius: 5px; color: var(--text-secondary); white-space: nowrap; }
    .status-badge { font-size: .6875rem; font-weight: 700; padding: 2px 8px; border-radius: 100px; text-transform: uppercase; letter-spacing: .04em; }
    .status-used { background: rgba(16,185,129,.1); color: #059669; }
    .status-available { background: rgba(59,130,246,.1); color: #2563eb; }
    .status-reserved { background: rgba(245,158,11,.1); color: #d97706; }
    .empty-row { text-align: center; color: var(--text-muted); padding: 2rem; }

    @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2,1fr); } .table-wrap { overflow-x: auto; } }
  `]
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
